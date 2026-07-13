"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { SubNav } from "@/components/layout/sub-nav";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SelectApple } from "@/components/shared/select-apple";
import { FieldError } from "@/components/shared/field-error";
import { Modal } from "@/components/shared/modal";
import { AnimatePresence, motion } from "framer-motion";

import { Pagination } from "@/components/shared/pagination";
import { Loader2, Check } from "lucide-react";
import { fetchRooms, fetchBuildings, fetchTenants, createRoom, updateRoom, deleteRoom, createActivity } from "@/lib/api";
import type { Room, RoomStatus, Building } from "@/types";
import { DoorOpen, Plus, Pencil, Trash2, Search, User, Wallet, Building2 } from "lucide-react";
import toast from "react-hot-toast";

export default function RoomsPage() {
  const t = useTranslations();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildingsList, setBuildingsList] = useState<Building[]>([]);
  const [tenantsMap, setTenantsMap] = useState<Record<string, string>>({});
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    fetchRooms().then((d) => { setRooms(d); setFirstLoad(false); }).catch(() => {});
    fetchBuildings().then(setBuildingsList).catch(() => {});
    fetchTenants().then((data) => {
      const map: Record<string, string> = {};
      data.forEach((tn) => { if (tn.isActive) map[tn.roomId] = tn.name; });
      setTenantsMap(map);
    }).catch(() => {});
  }, []);

  const [filterBuilding, setFilterBuilding] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaving, setFormSaving] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const [formData, setFormData] = useState({
    buildingId: "",
    roomNumber: "",
    floor: 1,
    rentalFee: 0,
    status: "vacant" as RoomStatus,
  });

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        if (filterBuilding !== "all" && room.buildingId !== filterBuilding)
          return false;
        if (filterStatus !== "all" && room.status !== filterStatus) return false;
        if (
          search &&
          !room.roomNumber.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rooms, filterBuilding, filterStatus, search]);

  const paginatedRooms = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRooms.slice(start, start + PAGE_SIZE);
  }, [filteredRooms, page]);

  // Reset page when filters change — standard derived-state reset pattern
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [filterBuilding, filterStatus, search]);

  const openCreate = () => {
    setEditRoom(null);
    setFormData({
      buildingId: buildingsList[0]?.id || "",
      roomNumber: "",
      floor: 1,
      rentalFee: 0,
      status: "vacant",
    });
    setFormOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditRoom(room);
    setFormData({
      buildingId: room.buildingId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      rentalFee: room.rentalFee,
      status: room.status,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormErrors({});
    if (!formData.roomNumber.trim()) {
      setFormErrors({ roomNumber: "กรุณากรอกเลขห้อง / Room number is required" });
      return;
    }
    setFormSaving(true);
    try {
      if (editRoom) {
        const updated = (await updateRoom(editRoom.id, {
          buildingId: formData.buildingId,
          roomNumber: formData.roomNumber,
          floor: formData.floor,
          rentalFee: formData.rentalFee,
          status: formData.status,
        })) as Room;
        setRooms((prev) => prev.map((r) => (r.id === editRoom.id ? updated : r)));
        toast.success(t("toast.roomUpdated"));
      } else {
        const newRoom = (await createRoom({
          buildingId: formData.buildingId,
          roomNumber: formData.roomNumber,
          floor: formData.floor,
          rentalFee: formData.rentalFee,
          status: formData.status,
        })) as Room;
        setRooms((prev) => [newRoom, ...prev]);
        toast.success(t("toast.roomCreated"));
        createActivity({ type: "room", action: "เพิ่มห้อง", detail: `${formData.roomNumber} · ค่าเช่า ${formData.rentalFee.toLocaleString()} ฿` }).catch(() => {});
      }
      setFormOpen(false);
      setEditRoom(null);
    } catch {}
    setFormSaving(false);
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const room = rooms.find((r) => r.id === deleteId);
        await deleteRoom(deleteId);
        setRooms((prev) => prev.filter((r) => r.id !== deleteId));
        toast.success(t("toast.roomDeleted"));
        if (room) createActivity({ type: "room", action: "ลบห้อง", detail: `ลบห้อง ${room.roomNumber}` }).catch(() => {});
      } catch {}
      setDeleteId(null);
    }
  };

  return (
    <div>
      <SubNav title={t("rooms.title")} />
      <div className="max-w-300 mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Stats bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {rooms.filter(r => r.status === "occupied").length} {t("rooms.occupied").toLowerCase()}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {rooms.filter(r => r.status === "vacant").length} {t("rooms.vacant").toLowerCase()}
            </span>
            {rooms.filter(r => r.status === "maintenance").length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {rooms.filter(r => r.status === "maintenance").length} {t("rooms.maintenance").toLowerCase()}
              </span>
            )}
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" />
            {t("rooms.addRoom")}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a6]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="pl-9 pr-4 py-2.5 rounded-full border border-hairline text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <SelectApple
            value={filterBuilding}
            onChange={setFilterBuilding}
            options={[
              { value: "all", label: t("rooms.filterBuilding") },
              ...buildingsList.map((b) => ({ value: b.id, label: b.name })),
            ]}
            className="min-w-50"
          />
          <SelectApple
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "all", label: t("rooms.filterStatus") },
              { value: "vacant", label: t("rooms.vacant") },
              { value: "occupied", label: t("rooms.occupied") },
              { value: "maintenance", label: t("rooms.maintenance") },
            ]}
            className="min-w-40"
          />
        </div>

        {!firstLoad && filteredRooms.length === 0 ? (
          <EmptyState
            icon={<DoorOpen className="w-12 h-12" />}
            title={t("rooms.empty")}
            action={
              <button
                onClick={openCreate}
                className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-focus transition-all"
              >
                {t("rooms.addRoom")}
              </button>
            }
          />
        ) : firstLoad ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-surface-chip border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
            {paginatedRooms.map((room, idx) => {
              const isOccupied = room.status === "occupied";
              const statusDot = isOccupied ? "bg-green-500" : room.status === "vacant" ? "bg-blue-400" : "bg-amber-400";

              return (
              <motion.div
                layout
                initial={firstLoad ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{
                  duration: 0.18,
                  ease: [0.22, 1, 0.36, 1],
                  delay: firstLoad ? Math.min(idx, 8) * 0.04 : 0,
                }}
                key={room.id}
                className={`relative bg-white rounded-[14px] border border-divider-soft hover:border-surface-chip transition-colors overflow-hidden group`}
              >
                <div className="p-4">
                  {/* Header: Room number + Status (left), Badge + Actions (right) */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusDot} shrink-0`} />
                      <h3 className="text-[20px] font-bold tracking-tight text-ink">
                        {room.roomNumber}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(room)}
                          className="p-1.5 rounded-full hover:bg-canvas-parchment transition-colors"
                          title={t("common.edit")}
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#86868b]" />
                        </button>
                        <button
                          onClick={() => setDeleteId(room.id)}
                          className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                          title={t("common.delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#a1a1a6] hover:text-red-500" />
                        </button>
                      </div>
                      <StatusBadge status={room.status} />
                    </div>
                  </div>

                  {/* Building + Floor */}
                  <p className="text-xs text-[#86868b] mb-3 ml-[18px]">
                    {room.buildingName} · {t("rooms.floor")} {room.floor}
                  </p>

                  {/* Tenant / Status section */}
                  <div className={`rounded-md p-3 ${isOccupied ? "bg-canvas-parchment" : "bg-[#fafafa]"}`}>
                    {isOccupied && tenantsMap[room.id] ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-ink truncate">{tenantsMap[room.id]}</p>
                            <p className="text-[10px] text-[#86868b]">{t("rooms.currentTenant")}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-bold text-primary">{room.rentalFee.toLocaleString()}</p>
                          <p className="text-[9px] text-[#86868b]">{t("common.perMonth") || "฿/เดือน"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="w-4 h-4 text-[#86868b]" />
                          <span className="text-xs text-[#86868b]">
                            {room.status === "vacant" ? t("rooms.vacant") : t("rooms.maintenance")}
                          </span>
                        </div>
                        {room.rentalFee > 0 && (
                          <span className="text-xs font-medium text-[#86868b]">{room.rentalFee.toLocaleString()} ฿/เดือน</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
          {filteredRooms.length > PAGE_SIZE && (
            <Pagination
              currentPage={page}
              totalItems={filteredRooms.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </>
      )}
      </div>

      {/* Form Dialog */}
      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditRoom(null); }} maxWidthClassName="max-w-lg">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#f0f7ff] flex items-center justify-center">
                <DoorOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-ink">
                  {editRoom ? t("rooms.editRoom") : t("rooms.addRoom")}
                </h3>
                <p className="text-[11px] text-[#86868b] mt-0.5">
                  {editRoom ? t("rooms.editRoomDesc") : t("rooms.addRoomDesc")}
                </p>
              </div>
            </div>

            {/* ── Section: ข้อมูลห้อง ── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-primary" />
                <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">{t("rooms.roomInfo") || "ข้อมูลห้อง"}</span>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft divide-y divide-divider-soft">
                <div className="p-4">
                  <label className="block text-xs font-medium text-[#6e6e73] mb-1.5">
                    {t("rooms.building")} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a6]" />
                    <SelectApple
                      value={formData.buildingId}
                      onChange={(v) => setFormData((prev) => ({ ...prev, buildingId: v }))}
                      variant="input"
                      options={buildingsList.map((b) => ({ value: b.id, label: b.name }))}
                      className="w-full pl-9"
                    />
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#6e6e73] mb-1.5">
                        {t("rooms.roomNumber")} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a6]" />
                        <input
                          value={formData.roomNumber}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, roomNumber: e.target.value }));
                            if (formErrors.roomNumber) setFormErrors({});
                          }}
                          placeholder="A101"
                          className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${formErrors.roomNumber ? "border-red-400 bg-red-50" : "border-hairline"}`}
                        />
                      </div>
                      <FieldError message={formErrors.roomNumber} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6e6e73] mb-1.5">
                        {t("rooms.floor")}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.floor}
                        onChange={(e) => setFormData((prev) => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section: ค่าเช่าและสถานะ ── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-green-500" />
                <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">{t("rooms.rentAndStatus") || "ค่าเช่าและสถานะ"}</span>
              </div>
              <div className="bg-white rounded-[14px] border border-divider-soft divide-y divide-divider-soft">
                <div className="p-4">
                  <label className="block text-xs font-medium text-[#6e6e73] mb-1.5">
                    {t("rooms.rentalFee")}
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a6]" />
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={formData.rentalFee}
                      onChange={(e) => setFormData((prev) => ({ ...prev, rentalFee: parseInt(e.target.value) || 0 }))}
                      className="w-full pl-9 pr-12 py-2.5 rounded-lg border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#a1a1a6]">{t("settings.bahtPerMonth")}</span>
                  </div>
                </div>
                <div className="p-4">
                  <label className="block text-xs font-medium text-[#6e6e73] mb-1.5">
                    {t("rooms.status")}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["vacant", "occupied", "maintenance"] as RoomStatus[]).map((s) => (
                      <label
                        key={s}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-xs font-medium ${
                          formData.status === s
                            ? s === "vacant" ? "border-blue-400 bg-blue-50 text-blue-700"
                              : s === "occupied" ? "border-green-400 bg-green-50 text-green-700"
                              : "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-divider-soft bg-white text-[#86868b] hover:border-primary/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="roomStatus"
                          checked={formData.status === s}
                          onChange={() => setFormData((prev) => ({ ...prev, status: s }))}
                          className="sr-only"
                        />
                        <span className={`w-2 h-2 rounded-full ${
                          s === "vacant" ? "bg-blue-400" : s === "occupied" ? "bg-green-500" : "bg-amber-400"
                        }`} />
                        {s === "vacant" ? t("rooms.vacant") : s === "occupied" ? t("rooms.occupied") : t("rooms.maintenance")}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-divider-soft">
              <button
                onClick={() => { setFormOpen(false); setEditRoom(null); }}
                className="px-5 py-2.5 text-[13px] font-medium text-[#86868b] bg-white border border-hairline rounded-full hover:bg-canvas-parchment transition-all"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={formSaving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 inline-flex items-center gap-2"
              >
                {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {formSaving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title={t("rooms.deleteRoom")}
        message={t("rooms.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
