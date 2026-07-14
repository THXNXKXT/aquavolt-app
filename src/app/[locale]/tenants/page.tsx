"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { SubNav } from "@/components/layout/sub-nav";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SelectApple } from "@/components/shared/select-apple";
import { FieldError } from "@/components/shared/field-error";
import { Pagination } from "@/components/shared/pagination";

import { useLocale } from "next-intl";
import type { Tenant, Room } from "@/types";
import { Users, Plus, Pencil, Trash2, Search, Phone, MessageCircle, Loader2, Check } from "lucide-react";
import { fetchTenants, fetchRooms, createTenant, updateTenant, deleteTenant, updateRoom, createActivity } from "@/lib/api";
import toast from "react-hot-toast";
import { Modal } from "@/components/shared/modal";
import { AnimatePresence, motion } from "framer-motion";

function getDuration(moveInDate: string, locale: string): string {
  const start = new Date(moveInDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (locale === "th") {
    if (months > 0) return `${months} เดือน ${remainingDays} วัน`;
    return `${days} วัน`;
  }
  if (months > 0) return `${months}m ${remainingDays}d`;
  return `${days}d`;
}

export default function TenantsPage() {
  const t = useTranslations();
  const locale = useLocale();

  function contractBadge(moveInDate: string, months: number) {
    const start = new Date(moveInDate);
    const end = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700">{t("dashboard.contractExpired")}</span>;
    }
    if (daysLeft <= 30) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">{t("dashboard.contractExpiring")} ({daysLeft}{t("common.days") || "d"})</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700">{t("dashboard.contractNormal")}</span>;
  }

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [roomsForDropdown, setRoomsForDropdown] = useState<Room[]>([]);

  useEffect(() => {
    Promise.all([fetchTenants(), fetchRooms()])
      .then(([tData, rData]) => { setTenants(tData); setRoomsForDropdown(rData); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, []);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    lineId: "",
    roomId: "",
    contractDuration: 12,
    moveInDate: new Date().toISOString().split("T")[0],
    isActive: true,
    wifiEnabled: false,
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const filteredTenants = useMemo(() => {
    return tenants
      .filter((t) =>
        search
          ? t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.phone.includes(search)
          : true
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tenants, search]);

  // Reset page when search changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [search]);

  const paginatedTenants = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTenants.slice(start, start + PAGE_SIZE);
  }, [filteredTenants, page]);

  const openCreate = () => {
    setEditTenant(null);
    const vacantRoom = roomsForDropdown.find((r) => r.status === "vacant");
    setFormData({
      name: "",
      phone: "",
      lineId: "",
      roomId: vacantRoom?.id || "",
      contractDuration: 12,
      moveInDate: new Date().toISOString().split("T")[0],
      isActive: true,
      wifiEnabled: false,
    });
    setFormOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditTenant(tenant);
    setFormData({
      name: tenant.name,
      phone: tenant.phone,
      lineId: tenant.lineId || "",
      roomId: tenant.roomId,
      contractDuration: tenant.contractDuration,
      moveInDate: tenant.moveInDate.split("T")[0],
      isActive: tenant.isActive,
      wifiEnabled: tenant.wifiEnabled ?? false,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormErrors({});
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = t("tenants.nameRequired");
    if (!formData.phone.trim()) errs.phone = t("tenants.phoneRequired");
    if (!formData.roomId) errs.roomId = t("tenants.roomRequired");
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setFormSaving(true);
    try {
      const room = roomsForDropdown.find((r) => r.id === formData.roomId);
      if (editTenant) {
        const updated = (await updateTenant(editTenant.id, {
          name: formData.name,
          phone: formData.phone,
          lineId: formData.lineId,
          roomId: formData.roomId,
          moveInDate: new Date(formData.moveInDate).toISOString(),
          isActive: formData.isActive,
          contractDuration: formData.contractDuration,
          wifiEnabled: formData.wifiEnabled,
        })) as Tenant;
        // Enrich with room info (API returns raw DB row without JOIN fields)
        const updatedRoom = roomsForDropdown.find((r) => r.id === formData.roomId);
        const updatedTenant = { ...updated, roomNumber: updatedRoom?.roomNumber || "", buildingName: updatedRoom?.buildingName || "" };
        setTenants((prev) => prev.map((t) => (t.id === editTenant.id ? updatedTenant : t)));
        toast.success(t("toast.tenantUpdated"));

        // Update room status if room changed or tenant deactivated
        if (editTenant.roomId !== formData.roomId) {
          // Old room → vacant
          updateRoom(editTenant.roomId, { status: "vacant" }).catch(() => {});
          setRoomsForDropdown((prev) =>
            prev.map((r) => (r.id === editTenant.roomId ? { ...r, status: "vacant" } : r))
          );
          // New room → occupied (if active)
          if (formData.isActive) {
            updateRoom(formData.roomId, { status: "occupied" }).catch(() => {});
            setRoomsForDropdown((prev) =>
              prev.map((r) => (r.id === formData.roomId ? { ...r, status: "occupied" } : r))
            );
          }
        } else if (!formData.isActive) {
          // Same room but deactivated → vacant
          updateRoom(formData.roomId, { status: "vacant" }).catch(() => {});
          setRoomsForDropdown((prev) =>
            prev.map((r) => (r.id === formData.roomId ? { ...r, status: "vacant" } : r))
          );
        }
      } else {
        const newTenant = (await createTenant({
          name: formData.name,
          phone: formData.phone,
          lineId: formData.lineId,
          roomId: formData.roomId,
          moveInDate: formData.moveInDate,
          contractDuration: formData.contractDuration,
          isActive: formData.isActive,
          wifiEnabled: formData.wifiEnabled,
        })) as Tenant;
        // Enrich with room info (API returns raw DB row without JOIN fields)
        const newTenantRoom = roomsForDropdown.find((r) => r.id === formData.roomId);
        const newTenantFull = { ...newTenant, roomNumber: newTenantRoom?.roomNumber || "", buildingName: newTenantRoom?.buildingName || "" };
        setTenants((prev) => [newTenantFull, ...prev]);
        toast.success(t("toast.tenantCreated"));

        // Mark room as occupied
        if (formData.isActive) {
          updateRoom(formData.roomId, { status: "occupied" }).catch(() => {});
          setRoomsForDropdown((prev) =>
            prev.map((r) => (r.id === formData.roomId ? { ...r, status: "occupied" } : r))
          );
        }

        createActivity({ type: "tenant", action: "เพิ่มผู้เช่า", detail: `${formData.name} · ห้อง ${room?.roomNumber || formData.roomId}` }).catch(() => {});
      }
      setFormOpen(false);
      setEditTenant(null);
    } catch {}
    setFormSaving(false);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const tenant = tenants.find((t) => t.id === deleteId);
        await deleteTenant(deleteId);
        setTenants((prev) => prev.filter((t) => t.id !== deleteId));
        toast.success(t("toast.tenantDeleted"));
        if (tenant) {
          // Set room back to vacant
          updateRoom(tenant.roomId, { status: "vacant" }).catch(() => {});
          setRoomsForDropdown((prev) =>
            prev.map((r) => (r.id === tenant.roomId ? { ...r, status: "vacant" } : r))
          );
          createActivity({ type: "tenant", action: "ลบผู้เช่า", detail: `ลบผู้เช่า ${tenant.name} · ห้อง ${tenant.roomNumber}` }).catch(() => {});
        }
      } catch {}
      setDeleteId(null);
    }
  };

  return (
    <div>
      <SubNav title={t("tenants.title")} />
      <div className="max-w-300 mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Stats bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {tenants.filter(t => t.isActive).length} {t("tenants.status.active").toLowerCase()}
            </span>
            {tenants.filter(t => !t.isActive).length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#f5f5f7] text-[#86868b]">
                {tenants.filter(t => !t.isActive).length} {t("tenants.status.inactive").toLowerCase()}
              </span>
            )}
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("tenants.addTenant")}
          </button>
        </div>

        <div className="relative mb-6 w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-divider-soft text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-surface-chip border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredTenants.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={t("tenants.empty")}
            action={
              <button
                onClick={openCreate}
                className="px-5 py-2.5 bg-primary text-white text-[13px] font-medium rounded-full hover:bg-primary-focus transition-all"
              >
                {t("tenants.addTenant")}
              </button>
            }
          />
        ) : (
          <div className="bg-white rounded-[14px] border border-divider-soft overflow-hidden overflow-x-auto">
            <table className="w-full text-[13px] min-w-[700px]">
              <thead>
                <tr className="border-b border-divider-soft">
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
                    {t("tenants.name")}
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
                    {t("tenants.room")}
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
                    {t("tenants.phone")}
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em] hidden md:table-cell">
                    {t("tenants.lineId")}
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em] hidden md:table-cell">
                    {t("tenants.duration")}
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em] hidden md:table-cell">
                    {t("tenants.contractStatus")}
                  </th>
                  <th className="text-center px-5 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
                    {t("common.status")}
                  </th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                {paginatedTenants.map((tenant) => (
                  <motion.tr
                    layout
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    key={tenant.id}
                    className="border-b border-divider-soft hover:bg-canvas-parchment/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-medium text-ink">{tenant.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#86868b]">{tenant.roomNumber}</td>
                    <td className="px-5 py-3.5">
                      {tenant.phone ? (
                        <a
                          href={`tel:${tenant.phone.replace(/[^0-9]/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:text-primary-focus transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {tenant.phone}
                        </a>
                      ) : (
                        <span className="text-surface-chip">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {tenant.lineId ? (
                        <a
                          href={`https://line.me/R/ti/p/~${tenant.lineId.replace(/@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[13px] text-[#06c755] hover:text-[#05b54c] transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {tenant.lineId}
                        </a>
                      ) : (
                        <span className="text-surface-chip">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-[11px] text-[#86868b]">
                        {tenant.isActive ? getDuration(tenant.moveInDate, locale) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {tenant.isActive ? contractBadge(tenant.moveInDate, tenant.contractDuration) : <span className="text-surface-chip">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={tenant.isActive ? "active" : "inactive"} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(tenant)}
                          className="p-1.5 rounded-full hover:bg-canvas-parchment transition-colors"
                          title={t("common.edit")}
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#86868b]" />
                        </button>
                        <button
                          onClick={() => setDeleteId(tenant.id)}
                          className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                          title={t("common.delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#86868b] hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        {filteredTenants.length > PAGE_SIZE && (
          <Pagination
            currentPage={page}
            totalItems={filteredTenants.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Form Dialog */}
      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditTenant(null); }} maxWidthClassName="max-w-xl">
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#f0f7ff] flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-ink">
                  {editTenant ? t("tenants.editTenant") : t("tenants.addTenant")}
                </h3>
                <p className="text-[11px] text-[#86868b] mt-0.5">
                  {editTenant ? t("tenants.editTenantDesc") : t("tenants.addTenantDesc")}
                </p>
              </div>
            </div>

            {/* ── Section: ข้อมูลส่วนตัว ── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-primary" />
                <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">{t("tenants.personalInfo")}</span>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft divide-y divide-divider-soft">
                <div className="p-4">
                  <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
                    {t("tenants.name")} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                    <input
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, name: e.target.value }));
                        if (formErrors.name) setFormErrors({});
                      }}
                      placeholder="ชื่อ-นามสกุล"
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${formErrors.name ? "border-red-400 bg-red-50" : "border-hairline"}`}
                    />
                  </div>
                  <FieldError message={formErrors.name} />
                </div>
                <div className="p-4">
                  <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
                    {t("tenants.phone")} <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                      <input
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, phone: e.target.value }));
                          if (formErrors.phone) setFormErrors({});
                        }}
                        placeholder="08X-XXX-XXXX"
                        className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${formErrors.phone ? "border-red-400 bg-red-50" : "border-hairline"}`}
                      />
                    </div>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                      <input
                        value={formData.lineId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lineId: e.target.value }))}
                        placeholder="LINE ID"
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-hairline text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      />
                    </div>
                  </div>
                  <FieldError message={formErrors.phone} />
                </div>
              </div>
            </div>

            {/* ── Section: ห้องและสัญญา ── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-amber-400" />
                <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">{t("tenants.roomContract")}</span>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft divide-y divide-divider-soft">
                <div className="p-4">
                  <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
                    {t("tenants.room")} <span className="text-red-400">*</span>
                  </label>
                  <SelectApple
                    value={formData.roomId}
                    onChange={(v) => setFormData((prev) => ({ ...prev, roomId: v }))}
                    variant="input"
                    className="w-full"
                    options={roomsForDropdown.map((r) => {
                      const isOccupied = tenants.some(
                        (t) => t.roomId === r.id && t.isActive && t.id !== editTenant?.id
                      );
                      return {
                        value: r.id,
                        label: `${r.roomNumber} (${r.buildingName})${isOccupied ? ` · ${t("tenants.roomOccupied")}` : ` · ${t("tenants.roomVacant")}`}`,
                        disabled: isOccupied,
                      };
                    })}
                  />
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
                        {t("tenants.moveInDate")}
                      </label>
                      <input
                        type="date"
                        value={formData.moveInDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, moveInDate: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-hairline text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
                        {t("tenants.contractDuration")}
                      </label>
                      <SelectApple
                        value={String(formData.contractDuration)}
                        onChange={(v) => setFormData((prev) => ({ ...prev, contractDuration: parseInt(v) || 12 }))}
                        variant="input"
                        className="w-full"
                        options={[
                          { value: "6", label: t("tenants.contract6") },
                          { value: "12", label: t("tenants.contract12") },
                          { value: "24", label: t("tenants.contract24") },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section: บริการเสริม ── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-green-500" />
                <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">{t("tenants.additionalServices")}</span>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft p-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${formData.isActive ? "border-primary bg-[#f0f7ff]" : "border-divider-soft bg-white hover:border-primary/30"}`}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${formData.isActive ? "bg-primary" : "bg-divider-soft"}`}>
                      {formData.isActive && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-ink">{t("tenants.isActive")}</p>
                      <p className="text-[10px] text-[#86868b]">{t("tenants.isActiveDesc")}</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${formData.wifiEnabled ? "border-primary bg-[#f0f7ff]" : "border-divider-soft bg-white hover:border-primary/30"}`}>
                    <input
                      type="checkbox"
                      checked={formData.wifiEnabled}
                      onChange={(e) => setFormData((prev) => ({ ...prev, wifiEnabled: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${formData.wifiEnabled ? "bg-primary" : "bg-divider-soft"}`}>
                      {formData.wifiEnabled && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-ink">
                        <span className="text-primary font-bold text-[10px]">WiFi</span> {t("tenants.wifiLabel")}
                      </p>
                      <p className="text-[10px] text-[#86868b]">{t("tenants.wifiDesc")}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-divider-soft">
              <button
                onClick={() => { setFormOpen(false); setEditTenant(null); }}
                className="px-5 py-2.5 text-[13px] font-medium text-[#86868b] bg-white border border-hairline rounded-full hover:bg-canvas-parchment transition-all"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={formSaving}
                className="px-6 py-2.5 text-[13px] font-medium text-white bg-primary rounded-full hover:bg-primary-focus active:scale-[0.97] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 inline-flex items-center gap-2"
              >
                {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {formSaving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title={t("tenants.deleteTenant")}
        message={t("tenants.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
