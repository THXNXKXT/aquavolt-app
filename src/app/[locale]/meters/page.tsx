"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { SubNav } from "@/components/layout/sub-nav";
import { SelectApple } from "@/components/shared/select-apple";
import { Pagination } from "@/components/shared/pagination";
import { formatCurrency } from "@/lib/formatters";
import { calculateUtilityCosts } from "@/lib/calculators";
import { useSettings } from "@/hooks/use-settings";
import toast from "react-hot-toast";
import { Modal } from "@/components/shared/modal";
import { fetchMeters, fetchRooms, createMeterReading, createActivity } from "@/lib/api";
import { Reveal } from "@/components/shared/reveal";
import type { MeterReading, Room } from "@/types";
import {
  Plus,
  Droplets,
  Zap,
  ClipboardList,
  DollarSign,
  Building2,
  Home,
  Inbox,
} from "lucide-react";

export default function MetersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [roomsForDropdown, setRoomsForDropdown] = useState<Room[]>([]);

  useEffect(() => {
    Promise.all([fetchMeters(), fetchRooms()])
      .then(([meterData, roomData]) => {
        setReadings(meterData);
        setRoomsForDropdown(roomData);
        setLoaded(true);
      })
      .catch((e) => {
        console.warn("API:", e);
        setLoaded(true);
      });
  }, []);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [formData, setFormData] = useState({
    roomId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    waterPrevious: 0,
    waterCurrent: 0,
    electricPrevious: 0,
    electricCurrent: 0,
  });

  const { settings } = useSettings();
  const { waterRate, electricRate, serviceCharge } = settings;

  // Get rental fee for the selected room
  const currentRoom = roomsForDropdown.find((r) => r.id === formData.roomId);
  const rentalFee = currentRoom?.rentalFee || 0;

  // Rooms already recorded for the current form month/year
  const recordedRoomIds = useMemo(() => {
    return new Set(
      readings
        .filter((r) => r.month === formData.month && r.year === formData.year)
        .map((r) => r.roomId)
    );
  }, [readings, formData.month, formData.year]);

  const calcResult = useMemo(() => {
    if (formData.waterCurrent && formData.electricCurrent) {
      return calculateUtilityCosts({
        waterPrevious: formData.waterPrevious,
        waterCurrent: formData.waterCurrent,
        electricPrevious: formData.electricPrevious,
        electricCurrent: formData.electricCurrent,
        waterRate,
        electricRate,
        serviceCharge,
        rentalFee,
      });
    }
    return null;
  }, [formData, waterRate, electricRate, serviceCharge, rentalFee]);

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "short" });
  };

  const monthOptions = useMemo(() => {
    const months = new Set(readings.map((r) => `${r.month}-${r.year}`));
    return Array.from(months).sort().reverse().map((m) => {
      const [mo, yr] = m.split("-");
      return { value: m, label: `${getMonthName(parseInt(mo))} ${yr}` };
    });
  }, [readings]);

  const filteredReadings = useMemo(() => {
    return readings
      .filter((r) => (selectedRoom === "all" ? true : r.roomId === selectedRoom))
      .filter((r) => (filterMonth === "all" ? true : `${r.month}-${r.year}` === filterMonth))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.month !== b.month) return b.month - a.month;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [readings, selectedRoom, filterMonth]);

  // Reset page when filters change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [selectedRoom, filterMonth]);

  const paginatedReadings = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredReadings.slice(start, start + PAGE_SIZE);
  }, [filteredReadings, page]);

  const openCreate = () => {
    const firstRoom = roomsForDropdown.find((r) => r.status === "occupied");
    const lastReading = firstRoom
      ? readings
          .filter((r) => r.roomId === firstRoom.id)
          .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          })[0]
      : null;

    setFormData({
      roomId: firstRoom?.id || "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      waterPrevious: Number(lastReading?.waterCurrent || 0),
      waterCurrent: Number(lastReading?.waterCurrent || 0) + 10,
      electricPrevious: Number(lastReading?.electricCurrent || 0),
      electricCurrent: Number(lastReading?.electricCurrent || 0) + 80,
    });
    setFormOpen(true);
  };

  const handleRoomChange = (roomId: string) => {
    const lastReading = readings
      .filter((r) => r.roomId === roomId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })[0];

    setFormData((prev) => ({
      ...prev,
      roomId,
      waterPrevious: Number(lastReading?.waterCurrent || 0),
      electricPrevious: Number(lastReading?.electricCurrent || 0),
    }));
  };

  const handleSave = async () => {
    if (!calcResult) return;

    const saved = (await createMeterReading({
      roomId: formData.roomId,
      month: formData.month,
      year: formData.year,
      waterPrevious: formData.waterPrevious,
      waterCurrent: formData.waterCurrent,
      electricPrevious: formData.electricPrevious,
      electricCurrent: formData.electricCurrent,
    })) as MeterReading;
    // Enrich with room info (API returns raw DB row without JOIN fields)
    const savedRoom = roomsForDropdown.find((r) => r.id === formData.roomId);
    const savedFull = { ...saved, roomNumber: savedRoom?.roomNumber || "", buildingName: savedRoom?.buildingName || "" };
    setReadings((prev) => [savedFull, ...prev]);
    setFormOpen(false);
    toast.success(t("toast.meterSaved"));
    const usage = saved.waterUsage && saved.electricUsage ? `น้ำ ${saved.waterUsage} หน่วย · ไฟ ${saved.electricUsage} kWh` : "";
    createActivity({ type: "meter", action: "บันทึกมิเตอร์", detail: `${savedRoom?.roomNumber || formData.roomId} · ${usage}` }).catch((e) => console.warn("activity:", e));
  };

  return (
    <div>
      <SubNav title={t("meters.title")} />
      <Reveal className="max-w-300 mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Summary + Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-[13px] text-[#86868b]">
            <span className="font-semibold text-ink">{readings.length}</span> รายการ
            <span className="w-1 h-1 rounded-full bg-surface-chip mx-1" />
            {roomsForDropdown.filter(r => r.status === "occupied").length} ห้องที่มีข้อมูล
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" />
            {t("meters.recordMeter")}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label className="text-[13px] font-medium text-[#6e6e73]">
            {t("meters.selectRoom")}:
          </label>
          <SelectApple
            value={selectedRoom}
            onChange={setSelectedRoom}
            options={[
              { value: "all", label: t("common.filter") },
              ...roomsForDropdown.map((r) => ({
                value: r.id,
                label: `${r.roomNumber} (${r.buildingName})${r.status === "occupied" ? "" : " · " + (r.status === "vacant" ? "ว่าง" : "ซ่อมบำรุง")}`,
              })),
            ]}
            className="min-w-[220px]"
          />
          <label className="text-[13px] font-medium text-[#6e6e73] ml-2">
            {t("common.month")}:
          </label>
          <SelectApple
            value={filterMonth}
            onChange={setFilterMonth}
            options={[
              { value: "all", label: t("invoices.filterMonth") },
              ...monthOptions,
            ]}
            className="min-w-[180px]"
          />
        </div>

        {/* Readings Table */}
        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-surface-chip border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredReadings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[14px] border border-hairline">
            <Inbox className="w-10 h-10 text-surface-chip mb-3" />
            <p className="text-sm font-medium text-[#86868b]">{t("meters.noReadings")}</p>
            <button onClick={openCreate} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary rounded-full hover:bg-primary-focus transition-all">
              <Plus className="w-3.5 h-3.5" />
              {t("meters.recordMeter")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
          <div className="bg-white rounded-[14px] border border-hairline overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-hairline">
                  <th rowSpan={2} className="text-left px-4 py-3 text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider border-r border-divider-soft">{t("common.month")}</th>
                  <th rowSpan={2} className="text-left px-4 py-3 text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider border-r border-divider-soft">{t("meters.room")}</th>
                  <th colSpan={3} className="text-center px-2 py-2.5 text-[11px] font-semibold text-primary uppercase tracking-wider bg-[#f0f7ff] border-r border-[#cce4ff]">
                    <span className="inline-flex items-center gap-1"><Droplets className="w-3 h-3" />{t("meters.water")}</span>
                  </th>
                  <th colSpan={3} className="text-center px-2 py-2.5 text-[11px] font-semibold text-[#d97706] uppercase tracking-wider bg-[#fff8ed]">
                    <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" />{t("meters.electric")}</span>
                  </th>
                </tr>
                <tr className="border-b border-hairline">
                  <th className="text-right px-3 py-2.5 text-[11px] font-medium text-[#6e6e73] bg-[#f0f7ff] border-r border-[#cce4ff]">← {t("meters.waterPrevious")}</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-medium text-[#6e6e73] bg-[#f0f7ff] border-r border-[#cce4ff]">→ {t("meters.waterCurrent")}</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-medium text-primary bg-[#f0f7ff] border-r border-[#cce4ff]">= {t("meters.waterUsage")}</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-medium text-[#6e6e73] bg-[#fff8ed] border-r border-[#ffe4b3]">← {t("meters.electricPrevious")}</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-medium text-[#6e6e73] bg-[#fff8ed] border-r border-[#ffe4b3]">→ {t("meters.electricCurrent")}</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-medium text-[#d97706] bg-[#fff8ed]">= {t("meters.electricUsage")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReadings.map((reading) => (
                  <tr key={reading.id} className="border-b border-divider-soft hover:bg-canvas-parchment/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink border-r border-divider-soft whitespace-nowrap">{getMonthName(reading.month)} {reading.year}</td>
                    <td className="px-4 py-3 text-[#86868b] border-r border-divider-soft">{reading.roomNumber}</td>
                    <td className="px-3 py-3 text-right text-[#6e6e73] bg-[#fafcff] border-r border-[#f0f7ff]">{reading.waterPrevious}</td>
                    <td className="px-3 py-3 text-right font-medium text-ink bg-[#fafcff] border-r border-[#f0f7ff]">{reading.waterCurrent}</td>
                    <td className="px-3 py-3 text-right font-semibold text-primary bg-[#fafcff] border-r border-[#f0f7ff]">{reading.waterUsage}</td>
                    <td className="px-3 py-3 text-right text-[#6e6e73] bg-[#fffdfa] border-r border-[#fff3d6]">{reading.electricPrevious}</td>
                    <td className="px-3 py-3 text-right font-medium text-ink bg-[#fffdfa] border-r border-[#fff3d6]">{reading.electricCurrent}</td>
                    <td className="px-3 py-3 text-right font-semibold text-[#d97706] bg-[#fffdfa]">{reading.electricUsage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredReadings.length > PAGE_SIZE && (
            <Pagination currentPage={page} totalItems={filteredReadings.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          )}
        </div>
      )}
      </Reveal>

      {/* Record Meter Dialog */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} maxWidthClassName="max-w-xl">
        <div className="p-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-semibold text-ink mb-5 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              {t("meters.recordMeter")}
            </h3>
            <div className="space-y-5">
              {/* Room + Period */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[13px] font-medium text-[#6e6e73] mb-1.5">
                    {t("meters.selectRoom")}
                  </label>
                  <SelectApple
                    value={formData.roomId}
                    onChange={(v) => handleRoomChange(v)}
                    variant="input"
                    className="w-full"
                    options={roomsForDropdown.map((r) => {
                      const alreadyRecorded = recordedRoomIds.has(r.id);
                      return {
                        value: r.id,
                        label: `${r.roomNumber} (${r.buildingName})${alreadyRecorded ? " · บันทึกแล้ว" : r.status === "vacant" ? " · ว่าง" : r.status === "maintenance" ? " · ซ่อมบำรุง" : ""}`,
                        disabled: alreadyRecorded,
                      };
                    })}
                  />
                </div>
                <div className="w-20">
                  <label className="block text-[13px] font-medium text-[#6e6e73] mb-1.5">
                    {t("meters.month")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.month}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        month: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-md border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[13px] font-medium text-[#6e6e73] mb-1.5">
                    {t("meters.year")}
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        year: parseInt(e.target.value) || 2026,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-md border border-hairline text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* ══════ Water Meter Section ══════ */}
              <div className="bg-[#f0f7ff] rounded-[14px] p-4 border border-[#cce4ff]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-ink">
                      {t("meters.water")}
                    </h4>
                    <p className="text-[11px] text-[#86868b]">
                      หน่วย: ลบ.ม. (m³) · อัตรา {waterRate} {t("meters.baht")}/{t("rates.perCubicMeter")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#6e6e73] mb-1 block">
                      ← {t("meters.waterPrevious")}
                    </label>
                    <input
                      type="number"
                      value={formData.waterPrevious}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          waterPrevious: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#cce4ff] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#6e6e73] mb-1 block">
                      → {t("meters.waterCurrent")}
                    </label>
                    <input
                      type="number"
                      value={formData.waterCurrent}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          waterCurrent: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#cce4ff] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#6e6e73] mb-1 block">
                      = {t("meters.waterUsage")}
                    </label>
                    <div className="w-full px-3 py-2 rounded-md border border-[#cce4ff] bg-[#e6f2ff] text-sm font-semibold text-primary text-center">
                      {calcResult
                        ? `${calcResult.waterUsage} m³`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════ Electric Meter Section ══════ */}
              <div className="bg-[#fff8ed] rounded-[14px] p-4 border border-[#ffe4b3]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#d97706] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-ink">
                      {t("meters.electric")}
                    </h4>
                    <p className="text-[11px] text-[#86868b]">
                      หน่วย: kWh · อัตรา {electricRate} {t("meters.baht")}/{t("rates.perKwh")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#6e6e73] mb-1 block">
                      ← {t("meters.electricPrevious")}
                    </label>
                    <input
                      type="number"
                      value={formData.electricPrevious}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          electricPrevious: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#ffe4b3] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d97706]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#6e6e73] mb-1 block">
                      → {t("meters.electricCurrent")}
                    </label>
                    <input
                      type="number"
                      value={formData.electricCurrent}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          electricCurrent: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#ffe4b3] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d97706]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#6e6e73] mb-1 block">
                      = {t("meters.electricUsage")}
                    </label>
                    <div className="w-full px-3 py-2 rounded-md border border-[#ffe4b3] bg-[#fff3d6] text-sm font-semibold text-[#d97706] text-center">
                      {calcResult
                        ? `${calcResult.electricUsage} kWh`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Preview */}
              {calcResult && (
                <div className="bg-canvas-parchment rounded-[14px] p-4 space-y-2">
                  <h4 className="text-[13px] font-semibold text-ink mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-primary" />
                    {t("meters.calculatedCost")}
                  </h4>
                  <div className="flex justify-between text-sm py-1">
                    <span className="flex items-center gap-1.5 text-[#6e6e73]">
                      <Droplets className="w-3.5 h-3.5 text-primary" />
                      {t("meters.waterCost")}
                      <span className="text-[11px] text-[#a1a1a6]">
                        ({calcResult.waterUsage} m³ × {waterRate} {t("meters.baht")})
                      </span>
                    </span>
                    <span className="font-medium text-primary">
                      {formatCurrency(calcResult.waterCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="flex items-center gap-1.5 text-[#6e6e73]">
                      <Zap className="w-3.5 h-3.5 text-[#d97706]" />
                      {t("meters.electricCost")}
                      <span className="text-[11px] text-[#a1a1a6]">
                        ({calcResult.electricUsage} kWh × {electricRate} {t("meters.baht")})
                      </span>
                    </span>
                    <span className="font-medium text-[#d97706]">
                      {formatCurrency(calcResult.electricCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="flex items-center gap-1.5 text-[#6e6e73]">
                      <Building2 className="w-3.5 h-3.5 text-[#6e6e73]" />
                      {t("rates.service")}
                    </span>
                    <span className="font-medium text-ink">
                      {formatCurrency(calcResult.serviceCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="flex items-center gap-1.5 text-[#6e6e73]">
                      <Home className="w-3.5 h-3.5 text-[#6e6e73]" />
                      {t("meters.rentalCost")}
                    </span>
                    <span className="font-medium text-ink">
                      {formatCurrency(calcResult.rentalCost)}
                    </span>
                  </div>
                  <div className="border-t border-hairline pt-2 flex justify-between text-sm font-semibold">
                    <span className="text-ink">{t("meters.totalCost")}</span>
                    <span className="text-[15px] text-primary">
                      {formatCurrency(calcResult.totalAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-divider-soft">
              <button
                onClick={() => setFormOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-[#86868b] bg-white border border-hairline rounded-full hover:bg-canvas-parchment transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.roomId || !formData.waterCurrent || !formData.electricCurrent}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                {t("common.save")}
              </button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
