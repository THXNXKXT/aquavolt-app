"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { SubNav } from "@/components/layout/sub-nav";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SelectApple } from "@/components/shared/select-apple";
import { Pagination } from "@/components/shared/pagination";
import { Modal } from "@/components/shared/modal";
import { AnimatePresence, motion } from "framer-motion";
import { fetchInvoices, createInvoice, fetchRooms, fetchTenants, fetchMeters, createActivity } from "@/lib/api";

import { formatCurrency, formatDateShort } from "@/lib/formatters";
import { calculateUtilityCosts } from "@/lib/calculators";
import { useSettings } from "@/hooks/use-settings";
import type { Invoice, Room, Tenant, MeterReading } from "@/types";
import { FileText, Search, Plus, X, Droplets, Zap, Home, Building2, Gauge, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

export default function InvoicesPage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { settings } = useSettings();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ roomId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [creating, setCreating] = useState(false);
  const [roomsForDropdown, setRoomsForDropdown] = useState<Room[]>([]);
  const [tenantsForDropdown, setTenantsForDropdown] = useState<Tenant[]>([]);
  const [metersForDropdown, setMetersForDropdown] = useState<MeterReading[]>([]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterMonth !== "all") {
        const [m, y] = filterMonth.split("-");
        if (inv.month !== parseInt(m) || inv.year !== parseInt(y)) return false;
      }
      if (filterStatus !== "all" && inv.status !== filterStatus) return false;
      if (search && !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) &&
          !inv.tenantName?.toLowerCase().includes(search.toLowerCase()) &&
          !inv.roomNumber?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());
  }, [invoices, filterMonth, filterStatus, search]);

  // Reset page when filters change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [filterMonth, filterStatus, search]);

  useEffect(() => {
    Promise.all([
      fetchInvoices(),
      fetchRooms(),
      fetchTenants(),
      fetchMeters(),
    ]).then(([invData, roomData, tenData, meterData]) => {
      setInvoices(invData);
      setRoomsForDropdown(roomData);
      setTenantsForDropdown(tenData);
      setMetersForDropdown(meterData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredInvoices, page]);

  const monthOptions = useMemo(() => {
    const months = new Set(invoices.map((inv) => `${inv.month}-${inv.year}`));
    const cur = `${currentMonth}-${currentYear}`;
    if (!months.has(cur)) months.add(cur);
    const prev = `${currentMonth === 1 ? 12 : currentMonth - 1}-${currentMonth === 1 ? currentYear - 1 : currentYear}`;
    if (!months.has(prev)) months.add(prev);
    return Array.from(months).sort().reverse();
  }, [invoices]);

  const getMonthName = (month: number) => {
    const d = new Date(2000, month - 1, 1);
    return d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: locale === "th" ? "long" : "short" });
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

  // ── Create Invoice Preview ──
  const selectedRoom = roomsForDropdown.find((r) => r.id === createForm.roomId);
  const selectedTenant = selectedRoom ? tenantsForDropdown.find((t) => t.roomId === selectedRoom.id && t.isActive) : null;
  const meterReading = createForm.roomId ? metersForDropdown.filter((m) => m.roomId === createForm.roomId).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  })[0] : null;

  const calcPreview = useMemo(() => {
    if (!selectedRoom) return null;
    const lastReading = metersForDropdown.filter((m) => m.roomId === selectedRoom.id).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0];

    const estWater = lastReading ? Math.max(1, Number(lastReading.waterUsage)) : 10;
    const estElectric = lastReading ? Math.max(1, Number(lastReading.electricUsage)) : 80;

    const actualReading = metersForDropdown.find((m) => m.roomId === selectedRoom.id && m.month === createForm.month && m.year === createForm.year);

    return calculateUtilityCosts({
      waterPrevious: Number(actualReading?.waterPrevious || 0),
      waterCurrent: Number(actualReading?.waterCurrent || estWater),
      electricPrevious: Number(actualReading?.electricPrevious || 0),
      electricCurrent: Number(actualReading?.electricCurrent || estElectric),
      waterRate: settings.waterRate,
      electricRate: settings.electricRate,
      serviceCharge: settings.serviceCharge,
      rentalFee: selectedRoom.rentalFee,
      wifiCost: selectedTenant?.wifiEnabled ? settings.wifiRate : 0,
    });
  }, [createForm.roomId, createForm.month, createForm.year, selectedRoom, selectedTenant, settings]);

  const alreadyHasInvoice = invoices.some(
    (inv) => inv.roomId === createForm.roomId && inv.month === createForm.month && inv.year === createForm.year && inv.status !== "cancelled"
  );

  const handleCreate = async () => {
    if (!selectedRoom || !calcPreview) return;
    setCreating(true);
    try {
      const now = new Date();
      const due = new Date(now.getTime() + 15 * 86400000);

      const newInvoice = await createInvoice({
        roomId: createForm.roomId,
        tenantId: selectedTenant?.id || "",
        month: createForm.month,
        year: createForm.year,
        rentalCost: calcPreview.rentalCost,
        waterCost: calcPreview.waterCost,
        electricCost: calcPreview.electricCost,
        serviceCharge: calcPreview.serviceCharge,
        wifiCost: calcPreview.wifiCost,
        dueDate: due.toISOString(),
      });

      setInvoices((prev) => [newInvoice, ...prev]);
      toast.success(t("toast.invoiceCreated"));
      setShowCreate(false);
      setFilterMonth(`${createForm.month}-${createForm.year}`);
      const roomName = selectedRoom?.roomNumber || createForm.roomId;
      createActivity({ type: "invoice", action: "ออกใบแจ้งหนี้", detail: `${roomName} · ${selectedTenant?.name || ""} · ${formatCurrency(calcPreview.totalAmount)}` }).catch(() => {});
    } catch {}
    setCreating(false);
  };

  const occupiedRooms = roomsForDropdown.filter((r) => r.status === "occupied");

  return (
    <div>
      <SubNav title={t("invoices.title")} />
      <div className="max-w-300 mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Summary + Create Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-[13px] text-[#86868b]">
            <span className="font-semibold text-ink">{filteredInvoices.length}</span> {t("common.items")}
            <span className="w-1 h-1 rounded-full bg-surface-chip mx-1" />
            {t("invoices.total")} <span className="font-semibold text-primary">{formatCurrency(totalAmount)}</span>
            {(() => {
              const p = filteredInvoices.filter(i => i.status === "pending" || i.status === "overdue").length;
              return p > 0 ? (
                <><span className="w-1 h-1 rounded-full bg-surface-chip mx-1" /><span className="text-amber-600 font-medium">{t("invoices.pendingCount", { count: p })}</span></>
              ) : null;
            })()}
          </div>
          <button
            onClick={() => { setCreateForm({ roomId: occupiedRooms[0]?.id || "", month: currentMonth, year: currentYear }); setShowCreate(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("invoices.createInvoiceBtn")}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")}
              className="pl-9 pr-4 py-2.5 rounded-full border border-hairline text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary w-48" />
          </div>
          <SelectApple value={filterMonth} onChange={setFilterMonth}
            options={[{ value: "all", label: t("invoices.filterMonth") }, ...monthOptions.map((m) => { const [mo, yr] = m.split("-"); return { value: m, label: `${getMonthName(parseInt(mo))} ${yr}` }; })]}
            className="min-w-50" />
          <SelectApple value={filterStatus} onChange={setFilterStatus}
            options={[{ value: "all", label: t("invoices.filterStatus") }, { value: "pending", label: t("invoices.pending") }, { value: "paid", label: t("invoices.paid") }, { value: "overdue", label: t("invoices.overdue") }, { value: "cancelled", label: t("invoices.cancelled") }]}
            className="min-w-37.5" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-surface-chip border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState icon={<FileText className="w-12 h-12" />} title={t("invoices.noInvoices")} />
        ) : (
          <><div className="bg-white rounded-[14px] border border-divider-soft overflow-hidden overflow-x-auto">
            <table className="w-full text-[13px] min-w-150">
              <thead>
                <tr className="border-b border-divider-soft">
                  <th className="text-left px-6 py-3.5 text-[11px] font-medium text-[#86868b] uppercase tracking-wider">{t("invoices.invoiceNumber")}</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-medium text-[#86868b] uppercase tracking-wider">{t("invoices.room")}</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-medium text-[#86868b] uppercase tracking-wider">{t("invoices.tenant")}</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-medium text-[#86868b] uppercase tracking-wider hidden md:table-cell">{t("invoices.issueDate")}</th>
                  <th className="text-right px-6 py-3.5 text-[11px] font-medium text-[#86868b] uppercase tracking-wider">{t("invoices.total")}</th>
                  <th className="text-center px-6 py-3.5 text-[11px] font-medium text-[#86868b] uppercase tracking-wider">{t("invoices.status")}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                {paginatedInvoices.map((inv) => (
                  <motion.tr
                    layout
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    key={inv.id} className="border-b border-divider-soft hover:bg-canvas-parchment/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/invoices/${inv.id}`)}>
                    <td className="px-6 py-4 font-medium text-ink">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-[#86868b]">{inv.roomNumber}</td>
                    <td className="px-6 py-4 text-[#86868b]">{inv.tenantName}</td>
                    <td className="px-6 py-4 text-[#86868b] hidden md:table-cell">{formatDateShort(inv.issuedDate)}</td>
                    <td className="px-6 py-4 text-right font-medium text-ink">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={inv.status} /></td>
                  </motion.tr>
                ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {filteredInvoices.length > PAGE_SIZE && (
            <Pagination currentPage={page} totalItems={filteredInvoices.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          )}
          </>
        )}
      </div>

      {/* ── Create Invoice Dialog ── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} maxWidthClassName="max-w-lg">
        <div className="p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-semibold text-ink flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t("invoices.createInvoiceBtn")}
              </h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-full hover:bg-canvas-parchment transition-colors">
                <X className="w-4 h-4 text-[#86868b]" />
              </button>
            </div>

            {/* Room + Period */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">{t("invoices.formRoom")}</label>
                <SelectApple variant="input" className="w-full" value={createForm.roomId}
                  onChange={(v) => setCreateForm((prev) => ({ ...prev, roomId: v }))}
                  options={occupiedRooms.map((r) => {
                    const hasMeter = metersForDropdown.some(
                      (m) => m.roomId === r.id && m.month === createForm.month && m.year === createForm.year
                    );
                    return {
                      value: r.id,
                      label: `${r.roomNumber} (${r.buildingName})${r.currentTenantName ? ` · ${r.currentTenantName}` : ""} · ${hasMeter ? t("invoices.meterRecorded") : t("invoices.meterNotRecorded")}`,
                    };
                  })} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">{t("invoices.formMonth")}</label>
                <input type="number" min={1} max={12} value={createForm.month}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, month: parseInt(e.target.value) || currentMonth }))}
                  className="w-full px-3 py-2.5 rounded-md border border-hairline text-[13px] focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">{t("invoices.formYear")}</label>
                <input type="number" value={createForm.year}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, year: parseInt(e.target.value) || currentYear }))}
                  className="w-full px-3 py-2.5 rounded-md border border-hairline text-[13px] focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            {/* Preview */}
            {selectedRoom && calcPreview && (
              <div className="bg-canvas-parchment rounded-[14px] p-4 space-y-2">
                <p className="text-[11px] font-semibold text-ink mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary" />
                  {t("invoices.invoicePreview")}
                </p>

                {meterReading && (
                  <div className="flex items-center gap-4 text-[11px] pb-2 border-b border-hairline">
                    <div className="flex items-center gap-1"><Gauge className="w-3 h-3 text-primary" /> {getMonthName(meterReading.month)} {meterReading.year}</div>
                    <div className="flex items-center gap-1"><Droplets className="w-3 h-3 text-primary" /> {meterReading.waterUsage} m³</div>
                    <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-600" /> {meterReading.electricUsage} kWh</div>
                  </div>
                )}

                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#86868b]"><Home className="w-3 h-3" /> {t("invoices.rentalChargeLabel")}</span>
                  <span className="font-medium text-ink">{formatCurrency(calcPreview.rentalCost)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#86868b]"><Droplets className="w-3 h-3 text-primary" /> {t("invoices.waterCharge")} ({calcPreview.waterUsage} m³)</span>
                  <span className="font-medium text-ink">{formatCurrency(calcPreview.waterCost)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#86868b]"><Zap className="w-3 h-3 text-amber-600" /> {t("invoices.electricCharge")} ({calcPreview.electricUsage} kWh)</span>
                  <span className="font-medium text-ink">{formatCurrency(calcPreview.electricCost)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#86868b]"><Building2 className="w-3 h-3" /> {t("invoices.serviceChargeLabel")}</span>
                  <span className="font-medium text-ink">{formatCurrency(calcPreview.serviceCharge)}</span>
                </div>
                {calcPreview.wifiCost > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-[#86868b]">
                      <span className="w-3 h-3 text-primary font-bold text-[8px] flex items-center justify-center">WiFi</span>
                      {t("invoices.wifiCharge")}
                    </span>
                    <span className="font-medium text-ink">{formatCurrency(calcPreview.wifiCost)}</span>
                  </div>
                )}
                <div className="border-t border-hairline pt-2 flex justify-between text-[13px] font-semibold">
                  <span className="text-ink">{t("invoices.totalLabel")}</span>
                  <span className="text-primary">{formatCurrency(calcPreview.totalAmount)}</span>
                </div>
              </div>
            )}

            {alreadyHasInvoice && (
              <p className="text-[11px] text-amber-700 bg-amber-50 rounded-md px-3 py-2 mt-3">
                ⚠️ {t("invoices.alreadyHasInvoice")}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-divider-soft">
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#86868b] bg-white border border-hairline rounded-full hover:bg-canvas-parchment transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={handleCreate} disabled={creating || !selectedRoom || !calcPreview}
                className="px-5 py-2 text-[13px] font-medium text-white bg-primary rounded-full hover:bg-primary-focus active:scale-[0.97] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {creating ? t("invoices.creating") : t("invoices.createInvoiceBtn")}
              </button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
