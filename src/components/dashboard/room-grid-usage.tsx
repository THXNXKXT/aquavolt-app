"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Droplets, Zap, DoorOpen } from "lucide-react";
import { TopUsageCard } from "@/components/dashboard/top-usage-card";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";
import type { Room, MeterReading } from "@/types";

interface RoomGridUsageProps {
  roomsData: Room[];
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  avgWater: number;
  avgElectric: number;
  topElectric: MeterReading[];
  topWater: MeterReading[];
  currentMonth: number;
}

export function RoomGridUsage({
  roomsData,
  occupiedRooms,
  vacantRooms,
  maintenanceRooms,
  avgWater,
  avgElectric,
  topElectric,
  topWater,
  currentMonth,
}: RoomGridUsageProps) {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-8">
      <div className="lg:col-span-2 bg-white rounded-[14px] p-5 border border-divider-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[#0071e3]/8 flex items-center justify-center">
              <DoorOpen className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-[13px] font-semibold text-ink">
              {t("dashboard.roomStatus")}
            </h3>
          </div>
          <button
            onClick={() => router.push("/rooms")}
            className="text-[11px] text-primary hover:text-primary-focus transition-colors font-medium"
          >
            {t("dashboard.viewAll")}
          </button>
        </div>

        {/* Room Grid */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {roomsData.slice(0, 12).map((room: Room) => (
            <div
              key={room.id}
              onClick={() => router.push("/rooms")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold cursor-pointer hover:scale-105 transition-all border ${
                room.status === "occupied"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : room.status === "vacant"
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {room.roomNumber?.replace(/\D/g, "")}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-3 text-[11px] mb-3">
          {[
            {
              label: t("dashboard.roomsOccupied"),
              count: occupiedRooms,
              dot: "bg-green-500",
              bg: "bg-green-50",
              txt: "text-green-700",
            },
            {
              label: t("dashboard.roomsVacant"),
              count: vacantRooms,
              dot: "bg-blue-400",
              bg: "bg-blue-50",
              txt: "text-blue-600",
            },
            ...(maintenanceRooms > 0
              ? [
                  {
                    label: t("dashboard.roomsMaintenance"),
                    count: maintenanceRooms,
                    dot: "bg-amber-400",
                    bg: "bg-amber-50",
                    txt: "text-amber-700",
                  },
                ]
              : []),
          ].map((s) => (
            <span
              key={s.label}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${s.bg} ${s.txt} font-medium`}
            >
              <span className={`w-2 h-2 rounded-full ${s.dot}`} /> {s.count}{" "}
              {s.label}
            </span>
          ))}
        </div>

        {/* Average Usage */}
        <div className="pt-3 border-t border-divider-soft grid grid-cols-2 gap-4">
          {[
            {
              icon: Droplets,
              label: t("dashboard.avgWaterUsage"),
              value: avgWater,
              unit: "m³",
              color: "#0066cc",
              bg: "bg-[#f0f7ff]",
              pct: Math.min(100, avgWater * 4),
            },
            {
              icon: Zap,
              label: t("dashboard.avgElectricUsage"),
              value: avgElectric,
              unit: "kWh",
              color: "#d97706",
              bg: "bg-[#fff8ed]",
              pct: Math.min(100, avgElectric),
            },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5 text-[#6e6e73]">
                  <s.icon className="w-3 h-3" style={{ color: s.color }} />{" "}
                  {s.label}
                </span>
                <span className="font-semibold text-ink">
                  {s.value}{" "}
                  <span className="text-[#86868b] font-normal">{s.unit}</span>
                </span>
              </div>
              <div className={`h-1.5 ${s.bg} rounded-full`}>
                <AnimatedProgressBar
                  value={s.pct}
                  fillClassName="rounded-full"
                  containerClassName="h-full rounded-full"
                  fillStyle={{ backgroundColor: s.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        <TopUsageCard
          topElectric={topElectric}
          topWater={topWater}
          currentMonth={currentMonth}
        />
      </div>
    </div>
  );
}
