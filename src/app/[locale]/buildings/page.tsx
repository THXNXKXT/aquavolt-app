"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { SubNav } from "@/components/layout/sub-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FieldError } from "@/components/shared/field-error";
import { Loader2, Check } from "lucide-react";
import { fetchBuildings, createBuilding, updateBuilding, deleteBuilding } from "@/lib/api";
import type { Building } from "@/types";
import { Reveal } from "@/components/shared/reveal";
import { Building2, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/shared/modal";

export default function BuildingsPage() {
  const t = useTranslations();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuildings()
      .then((data) => { setBuildings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  const sortedBuildings = useMemo(() => {
    return [...buildings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [buildings]);
  const [formOpen, setFormOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState<Building | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaving, setFormSaving] = useState(false);

  const openCreate = () => {
    setEditBuilding(null);
    setFormName("");
    setFormAddress("");
    setFormOpen(true);
  };

  const openEdit = (b: Building) => {
    setEditBuilding(b);
    setFormName(b.name);
    setFormAddress(b.address);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormErrors({});
    if (!formName.trim()) {
      setFormErrors({ name: "กรุณากรอกชื่ออาคาร / Building name is required" });
      return;
    }
    setFormSaving(true);
    try {
      if (editBuilding) {
        const updated = (await updateBuilding(editBuilding.id, { name: formName, address: formAddress })) as Building;
        setBuildings((prev) => prev.map((b) => (b.id === editBuilding.id ? updated : b)));
        toast.success(t("toast.buildingUpdated"));
      } else {
        const newBuilding = (await createBuilding({ name: formName, address: formAddress })) as Building;
        setBuildings((prev) => [newBuilding, ...prev]);
        toast.success(t("toast.buildingCreated"));
      }
      setFormOpen(false);
      setEditBuilding(null);
    } catch {}
    setFormSaving(false);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteBuilding(deleteId);
      setBuildings((prev) => prev.filter((b) => b.id !== deleteId));
      toast.success(t("toast.buildingDeleted"));
      setDeleteId(null);
    }
  };

  return (
    <div>
      <SubNav title={t("buildings.title")} />
      <Reveal className="max-w-300 mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Stats bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-[13px] text-[#86868b]">
            <span className="font-semibold text-ink">{buildings.length}</span> {t("buildings.count")}
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" />
            {t("buildings.addBuilding")}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-surface-chip border-t-primary rounded-full animate-spin" />
          </div>
        ) : buildings.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-12 h-12" />}
            title={t("buildings.empty")}
            action={
              <button
                onClick={openCreate}
                className="px-5 py-2.5 bg-primary text-white text-[13px] font-medium rounded-full hover:bg-primary-focus transition-all"
              >
                {t("buildings.addBuilding")}
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedBuildings.map((building) => {
              const roomCount = building.totalRooms;
              return (
              <div
                key={building.id}
                className="relative bg-white rounded-[14px] border border-divider-soft hover:border-surface-chip transition-colors overflow-hidden group"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-[10px] bg-[#f0f7ff] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-ink truncate">
                          {building.name}
                        </h3>
                        <p className="text-[11px] text-[#86868b]">
                          {roomCount} {t("common.rooms")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(building)}
                        className="p-1.5 rounded-full hover:bg-canvas-parchment transition-colors"
                        title={t("common.edit")}
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#86868b]" />
                      </button>
                      <button
                        onClick={() => setDeleteId(building.id)}
                        className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                        title={t("common.delete")}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#86868b] hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Address */}
                  {building.address && (
                    <div className="rounded-md bg-canvas-parchment p-3">
                      <p className="text-[11px] text-[#86868b] leading-relaxed">
                        {building.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </Reveal>

      {/* Form Dialog */}
      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditBuilding(null); }} maxWidthClassName="max-w-lg">
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#f0f7ff] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-ink">
                  {editBuilding ? t("buildings.editBuilding") : t("buildings.addBuilding")}
                </h3>
                <p className="text-[11px] text-[#86868b] mt-0.5">
                  {editBuilding ? t("buildings.editBuildingDesc") : t("buildings.addBuildingDesc")}
                </p>
              </div>
            </div>

            {/* ── Section: ข้อมูลอาคาร ── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-primary" />
                <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">{t("buildings.buildingInfo")}</span>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft divide-y divide-divider-soft">
                <div className="p-4">
                  <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
                    {t("buildings.buildingName")} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                    <input
                      value={formName}
                      onChange={(e) => { setFormName(e.target.value); if (formErrors.name) setFormErrors({}); }}
                      placeholder={t("buildings.buildingName")}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${formErrors.name ? "border-red-400 bg-red-50" : "border-hairline"}`}
                    />
                  </div>
                  <FieldError message={formErrors.name} />
                </div>
                <div className="p-4">
                  <label className="block text-[11px] font-medium text-[#86868b] mb-1.5">
                    {t("buildings.address")}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#86868b]" />
                    <textarea
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      rows={3}
                      placeholder={t("buildings.address")}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-hairline text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-divider-soft">
              <button
                onClick={() => { setFormOpen(false); setEditBuilding(null); }}
                className="px-5 py-2.5 text-[13px] font-medium text-[#86868b] bg-white border border-hairline rounded-full hover:bg-canvas-parchment transition-all"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={formSaving}
                className="px-6 py-2.5 text-[13px] font-medium text-white bg-primary rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 inline-flex items-center gap-2"
              >
                {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {formSaving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title={t("buildings.deleteBuilding")}
        message={t("buildings.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
