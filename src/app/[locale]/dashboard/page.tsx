"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSettings } from "@/hooks/use-settings";
import { useMemo, useState, useEffect, useCallback } from "react";
import { fetchDashboard, fetchRooms, fetchInvoices, fetchMeters, fetchTenants, type DashboardData } from "@/lib/api";
import type { Room, Tenant, Invoice, MeterReading } from "@/types";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { RevenueCard } from "@/components/dashboard/revenue-card";
import { ContractStatusCard } from "@/components/dashboard/contract-status-card";
import { RoomGridUsage } from "@/components/dashboard/room-grid-usage";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { CollectionRate } from "@/components/dashboard/collection-rate";
import { MeterStatus } from "@/components/dashboard/meter-status";
import { OverdueAlert } from "@/components/dashboard/overdue-alert";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { timeAgo, MS } from "@/lib/formatters";
import toast from "react-hot-toast";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Reveal } from "@/components/shared/reveal";

type RevenuePoint = { month: number; year: number; label: string; total: number; count: number };

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { settings } = useSettings();

  const [apiData, setApiData] = useState<DashboardData | null>(null);
  const [roomsData, setRoomsData] = useState<Room[]>([]);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);
  const [metersData, setMetersData] = useState<MeterReading[]>([]);
  const [tenantsData, setTenantsData] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchDashboard(),
      fetchRooms(),
      fetchInvoices(),
      fetchMeters(),
      fetchTenants(),
    ]).then(([dash, rooms, invs, meters, tens]) => {
      setApiData(dash);
      setRoomsData(rooms);
      setInvoicesData(invs);
      setMetersData(meters);
      setTenantsData(tens);
    }).catch((e) => {
      toast.error(t("toast.dashboardError"));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData, refreshKey]);

  // Re-fetch when page regains visibility (back from invoice detail, tab switch, etc.)
  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // ── Stats ──
  const totalRooms = roomsData.length || 0;
  const occupiedRooms = roomsData.filter((r) => r.status === "occupied").length;
  const vacantRooms = roomsData.filter((r) => r.status === "vacant").length;
  const maintenanceRooms = roomsData.filter((r) => r.status === "maintenance").length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const totalBuildings = apiData?.totalBuildings || new Set(roomsData.map((r) => r.buildingId).filter(Boolean)).size;

  const currentInvoices = invoicesData.filter(
    (inv) => inv.month === currentMonth && inv.year === currentYear
  );
  const monthlyRevenue = currentInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum: number, inv) => sum + Number(inv.rentalCost || 0) + Number(inv.waterCost || 0) + Number(inv.electricCost || 0) + Number(inv.serviceCharge || 0) + Number(inv.wifiCost || 0), 0);

  const currentReadings = metersData.filter(
    (m) => m.month === currentMonth && m.year === currentYear
  );
  const avgWater = currentReadings.length > 0
    ? Math.round(currentReadings.reduce((sum: number, m) => sum + Number(m.waterUsage || 0), 0) / currentReadings.length) : 0;
  const avgElectric = currentReadings.length > 0
    ? Math.round(currentReadings.reduce((sum: number, m) => sum + Number(m.electricUsage || 0), 0) / currentReadings.length) : 0;

  const paidCount = currentInvoices.filter((inv) => inv.status === "paid").length;
  const collectionRate = currentInvoices.length > 0
    ? Math.round((paidCount / currentInvoices.length) * 100) : 0;

  const overdueInvoices = currentInvoices.filter((inv) => inv.status === "overdue");
  const maxDaysOverdue = overdueInvoices.length > 0
    // eslint-disable-next-line react-hooks/purity -- computing overdue days for display
    ? Math.max(...overdueInvoices.map((inv) => Math.ceil((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)))) : 0;

  const occupiedRoomIds = roomsData.filter((r) => r.status === "occupied").map((r) => r.id);
  const readRoomIds = new Set(currentReadings.map((m) => m.roomId));
  const meterReadCount = occupiedRoomIds.filter((id: string) => readRoomIds.has(id)).length;
  const meterUnreadCount = occupiedRoomIds.length - meterReadCount;

  const recentInvoices = invoicesData
    .filter((inv) => inv.month === currentMonth && inv.year === currentYear)
    .sort((a, b) => new Date(b.issuedDate || b.createdAt).getTime() - new Date(a.issuedDate || a.createdAt).getTime())
    .slice(0, 5);

  const { topElectric, topWater } = useMemo(() => ({
    topElectric: [...currentReadings].sort((a, b) => Number(b.electricUsage || 0) - Number(a.electricUsage || 0)).slice(0, 3),
    topWater: [...currentReadings].sort((a, b) => Number(b.waterUsage || 0) - Number(a.waterUsage || 0)).slice(0, 3),
  }), [currentReadings]);

  const revenueByMonth = useMemo(() => {
    // Build aggregation map: "M-YYYY" → { total, count }
    const map = new Map<string, { total: number; count: number }>();
    for (const inv of invoicesData) {
      const key = `${inv.month}-${inv.year}`;
      const prev = map.get(key) || { total: 0, count: 0 };
      prev.total += Number(inv.rentalCost || 0) + Number(inv.waterCost || 0) + Number(inv.electricCost || 0) + Number(inv.serviceCharge || 0) + Number(inv.wifiCost || 0);
      prev.count++;
      map.set(key, prev);
    }
    // Generate 6-month range
    const now = new Date();
    const months: RevenuePoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getMonth() + 1}-${d.getFullYear()}`;
      const data = map.get(key) || { total: 0, count: 0 };
      months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "short" }), total: data.total, count: data.count });
    }
    return months;
  }, [invoicesData, locale]);

  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.total), 1);
  const revenueAvg = Math.round(revenueByMonth.reduce((s: number, m) => s + m.total, 0) / Math.max(revenueByMonth.length, 1));
  const revenueDiff = (revenueByMonth[revenueByMonth.length-1]?.total || 0) - (revenueByMonth[revenueByMonth.length-2]?.total || 0);
  const prevTotal = revenueByMonth[revenueByMonth.length-2]?.total;
  const revenueDiffPct = prevTotal > 0 ? Math.round(((revenueByMonth[revenueByMonth.length-1]?.total || 0) - prevTotal) / prevTotal * 100) : 0;
  const recentActivities = apiData?.recentActivity?.slice(0, 5) || [];

  const dateStr = new Date().toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <ErrorBoundary>
    <div className="max-w-300 mx-auto px-5 sm:px-8 py-8 sm:py-10">
      {/* ── Hero: Welcome ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
        <div>
          <p className="text-[13px] text-[#86868b] font-medium">{dateStr}</p>
          <h1 className="text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.4px] text-ink mt-1">
            {settings.dormitoryName}
          </h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full">
          <span className="text-[13px] text-[#86868b]">{t("dashboard.occupancyRateLabel")}</span>
          <span className="text-[15px] font-semibold text-ink">{occupancyRate}%</span>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <MetricCards totalRooms={totalRooms} occupiedRooms={occupiedRooms} vacantRooms={vacantRooms}
        maintenanceRooms={maintenanceRooms} totalBuildings={totalBuildings}
        totalTenants={tenantsData.length}
        monthlyRevenue={monthlyRevenue} currentInvoiceCount={currentInvoices.length} />

      {/* ── Featured: Revenue (3-col) + Stats sidebar (1-col) ── */}
      <Reveal className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <Reveal.Item className="lg:col-span-3">
          <RevenueCard invoicesData={invoicesData} revenueByMonth={revenueByMonth} maxRevenue={maxRevenue}
            currentMonth={currentMonth} currentYear={currentYear}
            avg={revenueAvg}
            diff={revenueDiff}
            diffPct={revenueDiffPct}
            loading={loading} />
        </Reveal.Item>
        <Reveal.Item className="lg:col-span-1 flex flex-col gap-4 h-full">
          <QuickActions />
          <CollectionRate
            collectionRate={collectionRate}
            paidCount={paidCount}
            totalInvoices={currentInvoices.length}
          />
          <MeterStatus
            meterReadCount={meterReadCount}
            meterUnreadCount={meterUnreadCount}
            occupiedRoomCount={occupiedRoomIds.length}
          />
        </Reveal.Item>
      </Reveal>

      {/* ── Overdue Alert ── */}
      <OverdueAlert overdueInvoices={overdueInvoices} maxDaysOverdue={maxDaysOverdue} />

      {/* ── Contract + Room Grid side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <ContractStatusCard stats={useMemo(() => {
          // eslint-disable-next-line react-hooks/purity -- contract expiry needs current time
          const now = Date.now();
          const monthMs = MS.DAY * 30;
          let active = 0, expiring = 0, expired = 0, total = 0;
          for (const t of tenantsData) {
            if (!t.isActive) continue;
            total++;
            const e = new Date(t.moveInDate);
            e.setFullYear(e.getFullYear() + Math.floor(t.contractDuration / 12));
            e.setMonth(e.getMonth() + (t.contractDuration % 12));
            const endTime = e.getTime();
            if (endTime <= now) { expired++; }
            else if (endTime - now <= monthMs) { expiring++; }
            else { active++; }
          }
          return { active, expiring, expired, total };
        }, [tenantsData])} />

        <RoomGridUsage
          roomsData={roomsData}
          occupiedRooms={occupiedRooms}
          vacantRooms={vacantRooms}
          maintenanceRooms={maintenanceRooms}
          avgWater={avgWater}
          avgElectric={avgElectric}
          topElectric={topElectric}
          topWater={topWater}
          currentMonth={currentMonth}
        />
      </div>

      {/* ── Bottom: Activity + Invoices ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivity activities={recentActivities} timeAgo={(ts: string) => timeAgo(ts, locale)} />
        <RecentInvoices invoices={recentInvoices.map((inv) => ({
          id: inv.id, roomNumber: inv.roomNumber || "", tenantName: inv.tenantName || "",
          invoiceNumber: inv.invoiceNumber || "",
          totalAmount: Number(inv.rentalCost || 0) + Number(inv.waterCost || 0) + Number(inv.electricCost || 0) + Number(inv.serviceCharge || 0) + Number(inv.wifiCost || 0),
          status: inv.status || "pending",
        }))} />
      </div>
    </div>
    </ErrorBoundary>
  );
}
