"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { SubNav } from "@/components/layout/sub-nav";
import { SelectApple } from "@/components/shared/select-apple";
import { fetchInvoices, fetchRooms, fetchTenants, fetchMeters } from "@/lib/api";
import type { Invoice, Room, Tenant, MeterReading } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { exportToExcel, formatExportDate, formatExportCurrency } from "@/lib/export-utils";
import { FileText, Download, Building2, Zap, DollarSign } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

type ReportTab = "financial" | "outstanding" | "utility" | "occupancy";

export default function ReportsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [, setTenants] = useState<Tenant[]>([]);
  const [meters, setMeters] = useState<MeterReading[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTab>("financial");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchRooms(), fetchTenants(), fetchMeters()])
      .then(([i, r, t, m]) => { setInvoices(i); setRooms(r); setTenants(t); setMeters(m); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getMonthName = (month: number) => {
    const d = new Date(2000, month - 1, 1);
    return d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long" });
  };

  const monthOptions = useMemo(() => {
    const months = new Set(invoices.map((inv) => `${inv.month}-${inv.year}`));
    const cur = `${currentMonth}-${currentYear}`;
    if (!months.has(cur)) months.add(cur);
    return Array.from(months).sort().reverse();
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (filterMonth === "all") return invoices;
    const [m, y] = filterMonth.split("-");
    return invoices.filter((inv) => inv.month === parseInt(m) && inv.year === parseInt(y));
  }, [invoices, filterMonth]);

  const financialData = useMemo(() => {
    return filteredInvoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      roomNumber: inv.roomNumber,
      tenantName: inv.tenantName,
      rentalCost: Number(inv.rentalCost || 0),
      waterCost: Number(inv.waterCost || 0),
      electricCost: Number(inv.electricCost || 0),
      serviceCharge: Number(inv.serviceCharge || 0),
      wifiCost: Number(inv.wifiCost || 0),
      totalAmount: Number(inv.totalAmount || 0),
      status: inv.status === "paid" ? t("invoices.paid") : inv.status === "pending" ? t("invoices.pending") : inv.status === "overdue" ? t("invoices.overdue") : t("invoices.cancelled"),
      issuedDate: inv.issuedDate,
      paidDate: inv.paidDate,
    }));
  }, [filteredInvoices]);

  const exportFinancial = () => {
    exportToExcel(financialData, [
      { key: "invoiceNumber", label: t("invoices.invoiceNumber") },
      { key: "roomNumber", label: t("invoices.room") },
      { key: "tenantName", label: t("invoices.tenant") },
      { key: "rentalCost", label: t("invoices.rentalCharge"), format: formatExportCurrency },
      { key: "waterCost", label: t("invoices.waterCharge"), format: formatExportCurrency },
      { key: "electricCost", label: t("invoices.electricCharge"), format: formatExportCurrency },
      { key: "serviceCharge", label: t("invoices.serviceCharge"), format: formatExportCurrency },
      { key: "wifiCost", label: t("invoices.wifiCharge"), format: formatExportCurrency },
      { key: "totalAmount", label: t("invoices.total"), format: formatExportCurrency },
      { key: "status", label: t("invoices.status") },
      { key: "issuedDate", label: t("invoices.issueDate"), format: formatExportDate },
      { key: "paidDate", label: t("invoices.paidDate"), format: formatExportDate },
    ], t("reports.exportFilenameFinancial"));
  };

  const outstandingData = useMemo(() => {
    return filteredInvoices
      .filter((inv) => inv.status === "pending" || inv.status === "overdue")
      .map((inv) => {
        const dueDate = new Date(inv.dueDate);
        // eslint-disable-next-line react-hooks/purity -- days-overdue calculation
        const daysOverdue = Math.max(0, Math.ceil((Date.now() - dueDate.getTime()) / 86400000));
        return {
          invoiceNumber: inv.invoiceNumber,
          roomNumber: inv.roomNumber,
          tenantName: inv.tenantName,
          totalAmount: Number(inv.totalAmount || 0),
          status: inv.status === "overdue" ? t("invoices.overdue") : t("invoices.pending"),
          dueDate: inv.dueDate,
          daysOverdue,
        };
      });
  }, [filteredInvoices]);

  const exportOutstanding = () => {
    exportToExcel(outstandingData, [
      { key: "invoiceNumber", label: t("invoices.invoiceNumber") },
      { key: "roomNumber", label: t("invoices.room") },
      { key: "tenantName", label: t("invoices.tenant") },
      { key: "totalAmount", label: t("reports.pendingAmount"), format: formatExportCurrency },
      { key: "status", label: t("invoices.status") },
      { key: "dueDate", label: t("invoices.dueDate"), format: formatExportDate },
      { key: "daysOverdue", label: t("reports.overdueDays") },
    ], t("reports.exportFilenameOutstanding"));
  };

  const utilityData = useMemo(() => {
    const currentMeters = filterMonth === "all"
      ? meters
      : meters.filter((m) => m.month === parseInt(filterMonth.split("-")[0]) && m.year === parseInt(filterMonth.split("-")[1]));
    return currentMeters.map((m) => ({
      roomNumber: m.roomNumber || m.roomId,
      buildingName: m.buildingName || "",
      waterUsage: Number(m.waterUsage || 0),
      electricUsage: Number(m.electricUsage || 0),
    })).sort((a, b) => (b.waterUsage + b.electricUsage) - (a.waterUsage + a.electricUsage));
  }, [meters, filterMonth]);

  const exportUtility = () => {
    exportToExcel(utilityData, [
      { key: "roomNumber", label: t("invoices.room") },
      { key: "buildingName", label: t("buildings.buildingName") },
      { key: "waterUsage", label: `${t("invoices.waterCharge")} (m³)` },
      { key: "electricUsage", label: `${t("invoices.electricCharge")} (kWh)` },
    ], t("reports.exportFilenameUtility"));
  };

  const occupancyData = useMemo(() => {
    return {
      total: rooms.length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      vacant: rooms.filter((r) => r.status === "vacant").length,
      maintenance: rooms.filter((r) => r.status === "maintenance").length,
      occupancyRate: rooms.length > 0 ? Math.round((rooms.filter((r) => r.status === "occupied").length / rooms.length) * 100) : 0,
      buildings: [...new Set(rooms.map((r) => r.buildingName).filter(Boolean))],
    };
  }, [rooms]);

  const exportOccupancy = () => {
    const buildingStats = occupancyData.buildings.map((b) => {
      const buildingRooms = rooms.filter((r) => r.buildingName === b);
      return {
        building: b,
        total: buildingRooms.length,
        occupied: buildingRooms.filter((r) => r.status === "occupied").length,
        vacant: buildingRooms.filter((r) => r.status === "vacant").length,
        rate: buildingRooms.length > 0 ? Math.round((buildingRooms.filter((r) => r.status === "occupied").length / buildingRooms.length) * 100) : 0,
      };
    });
    exportToExcel(buildingStats, [
      { key: "building", label: t("buildings.buildingName") },
      { key: "total", label: t("reports.totalAll") },
      { key: "occupied", label: t("reports.occupied") },
      { key: "vacant", label: t("reports.vacant") },
      { key: "rate", label: `${t("reports.occupancyRate")} (%)` },
    ], t("reports.exportFilenameOccupancy"));
  };

  const tabs = [
    { key: "financial" as ReportTab, label: t("reports.tabFinancial"), icon: DollarSign },
    { key: "outstanding" as ReportTab, label: t("reports.tabOutstanding"), icon: FileText },
    { key: "utility" as ReportTab, label: t("reports.tabUtility"), icon: Zap },
    { key: "occupancy" as ReportTab, label: t("reports.tabOccupancy"), icon: Building2 },
  ];

  const summary = useMemo(() => {
    const paid = filteredInvoices.filter((i) => i.status === "paid");
    const pending = filteredInvoices.filter((i) => i.status === "pending" || i.status === "overdue");
    return {
      totalInvoices: filteredInvoices.length,
      paidCount: paid.length,
      totalRevenue: paid.reduce((s, i) => s + Number(i.totalAmount || 0), 0),
      pendingAmount: pending.reduce((s, i) => s + Number(i.totalAmount || 0), 0),
    };
  }, [filteredInvoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-60">
        <p className="text-[13px] text-[#86868b]">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div>
      <SubNav title={t("reports.title")} />
      <Reveal className="max-w-300 mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <div className="flex flex-wrap items-right justify-self-end gap-3 mb-6">
          <SelectApple value={filterMonth} onChange={setFilterMonth}
            options={[{ value: "all", label: t("reports.filterAll") }, ...monthOptions.map((m) => { const [mo, yr] = m.split("-"); return { value: m, label: `${getMonthName(parseInt(mo))} ${yr}` }; })]}
            className="min-w-[180px]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
            <p className="text-[11px] text-[#86868b]">{t("reports.totalInvoices")}</p>
            <p className="text-[24px] font-semibold text-ink mt-1">{summary.totalInvoices}</p>
          </div>
          <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
            <p className="text-[11px] text-[#86868b]">{t("reports.paid")}</p>
            <p className="text-[24px] font-semibold text-green-600 mt-1">{summary.paidCount}</p>
          </div>
          <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
            <p className="text-[11px] text-[#86868b]">{t("reports.totalRevenue")}</p>
            <p className="text-[24px] font-semibold text-primary mt-1">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
            <p className="text-[11px] text-[#86868b]">{t("reports.pendingAmount")}</p>
            <p className="text-[24px] font-semibold text-amber-600 mt-1">{formatCurrency(summary.pendingAmount)}</p>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-divider-soft rounded-full mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key ? "bg-white text-ink shadow-sm" : "text-[#86868b] hover:text-ink"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "financial" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[13px] font-semibold text-ink">{t("reports.financialList")}</h2>
              <button onClick={exportFinancial} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[11px] font-medium rounded-full hover:bg-primary-focus transition-all">
                <Download className="w-3.5 h-3.5" /> {t("reports.exportExcel")}
              </button>
            </div>
            <div className="bg-white rounded-[14px] border border-divider-soft overflow-x-auto">
              <table className="w-full text-[13px] min-w-[850px]">
                <thead>
                  <tr className="border-b border-divider-soft">
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.invoiceNumber")}</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.room")}</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.tenant")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.rentalCharge")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.waterCharge")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.electricCharge")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.serviceCharge")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.wifiCharge")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.total")}</th>
                    <th className="text-center px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.slice(0, 50).map((inv) => (
                    <tr key={inv.invoiceNumber} className="border-b border-divider-soft hover:bg-canvas-parchment/50">
                      <td className="px-4 py-3 text-[11px] text-[#86868b]">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-[11px] text-ink font-medium">{inv.roomNumber}</td>
                      <td className="px-4 py-3 text-[11px] text-[#86868b]">{inv.tenantName}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-ink">{formatCurrency(inv.rentalCost)}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-ink">{formatCurrency(inv.waterCost)}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-ink">{formatCurrency(inv.electricCost)}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-ink">{formatCurrency(inv.serviceCharge)}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-ink">{formatCurrency(inv.wifiCost)}</td>
                      <td className="px-4 py-3 text-[11px] text-right font-semibold text-ink">{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-[11px] text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          inv.status === t("invoices.paid") ? "bg-green-50 text-green-700" :
                          inv.status === t("invoices.overdue") ? "bg-red-50 text-red-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "outstanding" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[13px] font-semibold text-ink">{t("reports.outstandingList")}</h2>
              <button onClick={exportOutstanding} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[11px] font-medium rounded-full hover:bg-primary-focus transition-all">
                <Download className="w-3.5 h-3.5" /> {t("reports.exportExcel")}
              </button>
            </div>
            {outstandingData.length > 0 ? (
              <div className="bg-white rounded-[14px] border border-divider-soft overflow-x-auto">
                <table className="w-full text-[13px] min-w-[600px]">
                  <thead>
                    <tr className="border-b border-divider-soft">
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.invoiceNumber")}</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.room")}</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.tenant")}</th>
                      <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("reports.pendingAmount")}</th>
                      <th className="text-center px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("reports.overdueDays")}</th>
                      <th className="text-center px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingData.map((inv) => (
                      <tr key={inv.invoiceNumber} className="border-b border-divider-soft hover:bg-canvas-parchment/50">
                        <td className="px-4 py-3 text-[11px] text-[#86868b]">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-[11px] text-ink font-medium">{inv.roomNumber}</td>
                        <td className="px-4 py-3 text-[11px] text-[#86868b]">{inv.tenantName}</td>
                        <td className="px-4 py-3 text-[11px] text-right font-semibold text-ink">{formatCurrency(inv.totalAmount)}</td>
                        <td className="px-4 py-3 text-[11px] text-center">
                          <span className={`font-medium ${inv.daysOverdue > 7 ? "text-red-600" : "text-amber-600"}`}>
                            {inv.daysOverdue > 0 ? t("reports.daysOverdue", { days: inv.daysOverdue }) : t("reports.notOverdue")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            inv.status === t("invoices.overdue") ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                          }`}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-[14px] p-8 text-center text-[13px] text-[#86868b] border border-divider-soft">
                {t("reports.noOutstanding")}
              </div>
            )}
          </div>
        )}

        {activeTab === "utility" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[13px] font-semibold text-ink">{t("reports.utilityList")}</h2>
              <button onClick={exportUtility} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[11px] font-medium rounded-full hover:bg-primary-focus transition-all">
                <Download className="w-3.5 h-3.5" /> {t("reports.exportExcel")}
              </button>
            </div>
            <div className="bg-white rounded-[14px] border border-divider-soft overflow-x-auto">
              <table className="w-full text-[13px] min-w-[500px]">
                <thead>
                  <tr className="border-b border-divider-soft">
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.room")}</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("buildings.buildingName")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.waterCharge")} (m³)</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.electricCharge")} (kWh)</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("invoices.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {utilityData.slice(0, 100).map((m, i) => (
                    <tr key={i} className="border-b border-divider-soft hover:bg-canvas-parchment/50">
                      <td className="px-4 py-3 text-[11px] text-ink font-medium">{m.roomNumber}</td>
                      <td className="px-4 py-3 text-[11px] text-[#86868b]">{m.buildingName}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-ink">{m.waterUsage}</td>
                      <td className="px-4 py-3 text-[11px] text-right text-ink">{m.electricUsage}</td>
                      <td className="px-4 py-3 text-[11px] text-right font-semibold text-ink">{m.waterUsage + m.electricUsage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "occupancy" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[13px] font-semibold text-ink">{t("reports.occupancyList")}</h2>
              <button onClick={exportOccupancy} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[11px] font-medium rounded-full hover:bg-primary-focus transition-all">
                <Download className="w-3.5 h-3.5" /> {t("reports.exportExcel")}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-[14px] p-4 border border-divider-soft text-center">
                <p className="text-[11px] text-[#86868b]">{t("reports.totalAll")}</p>
                <p className="text-[24px] font-semibold text-ink mt-1">{occupancyData.total}</p>
              </div>
              <div className="bg-white rounded-[14px] p-4 border border-divider-soft text-center">
                <p className="text-[11px] text-[#86868b]">{t("reports.occupied")}</p>
                <p className="text-[24px] font-semibold text-green-600 mt-1">{occupancyData.occupied}</p>
              </div>
              <div className="bg-white rounded-[14px] p-4 border border-divider-soft text-center">
                <p className="text-[11px] text-[#86868b]">{t("reports.vacant")}</p>
                <p className="text-[24px] font-semibold text-primary mt-1">{occupancyData.vacant}</p>
              </div>
              <div className="bg-white rounded-[14px] p-4 border border-divider-soft text-center">
                <p className="text-[11px] text-[#86868b]">{t("reports.occupancyRate")}</p>
                <p className="text-[24px] font-semibold text-primary mt-1">{occupancyData.occupancyRate}%</p>
              </div>
            </div>

            <div className="bg-white rounded-[14px] border border-divider-soft overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-divider-soft">
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("buildings.buildingName")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("reports.totalAll")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("reports.occupied")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("reports.vacant")}</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-[#86868b]">{t("reports.occupancyRate")} %</th>
                  </tr>
                </thead>
                <tbody>
                  {occupancyData.buildings.map((b) => {
                    const buildingRooms = rooms.filter((r) => r.buildingName === b);
                    const occ = buildingRooms.filter((r) => r.status === "occupied").length;
                    const vac = buildingRooms.filter((r) => r.status === "vacant").length;
                    const rate = buildingRooms.length > 0 ? Math.round((occ / buildingRooms.length) * 100) : 0;
                    return (
                      <tr key={b} className="border-b border-divider-soft hover:bg-canvas-parchment/50">
                        <td className="px-4 py-3 text-[11px] text-ink font-medium">{b}</td>
                        <td className="px-4 py-3 text-[11px] text-right text-ink">{buildingRooms.length}</td>
                        <td className="px-4 py-3 text-[11px] text-right text-green-600 font-medium">{occ}</td>
                        <td className="px-4 py-3 text-[11px] text-right text-primary">{vac}</td>
                        <td className="px-4 py-3 text-[11px] text-right font-semibold text-ink">{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Reveal>
    </div>
  );
}