"use client";

import { useTranslations } from "next-intl";
import { Building2, Users, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { AnimatedNumber } from "@/components/shared/animated-number";

interface MetricCardsProps {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  totalBuildings: number;
  totalTenants: number;
  monthlyRevenue: number;
  currentInvoiceCount: number;
  buildings?: { name: string }[];
}

export function MetricCards({
  totalRooms,
  occupiedRooms,
  vacantRooms,
  maintenanceRooms,
  totalBuildings,
  totalTenants,
  monthlyRevenue,
  currentInvoiceCount,
  buildings,
}: MetricCardsProps) {
  const t = useTranslations();
  const int = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Total Rooms */}
      <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
            {t("dashboard.totalRooms")}
          </span>
          <div className="p-1.5 rounded-full bg-canvas-parchment">
            <Building2 className="w-3.5 h-3.5 text-[#6e6e73]" />
          </div>
        </div>
        <p className="text-[24px] font-semibold tracking-tight text-ink">
          <AnimatedNumber value={totalRooms} formatter={int} />
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-medium text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {occupiedRooms}{" "}
            {t("dashboard.roomsOccupied")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-medium text-blue-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {vacantRooms}{" "}
            {t("dashboard.roomsVacant")}
          </span>
          {maintenanceRooms > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-medium text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {maintenanceRooms}{" "}
              {t("dashboard.roomsMaintenance")}
            </span>
          )}
        </div>
      </div>

      {/* All Buildings */}
      <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
            {t("dashboard.allBuildings")}
          </span>
          <div className="p-1.5 rounded-full bg-canvas-parchment">
            <Building2 className="w-3.5 h-3.5 text-[#6e6e73]" />
          </div>
        </div>
        <p className="text-[24px] font-semibold tracking-tight text-ink">
          <AnimatedNumber value={totalBuildings} formatter={int} />
        </p>
        <p className="text-[11px] text-[#86868b] mt-0.5">
          {buildings?.map((b) => b.name).join(" · ") || ""}
        </p>
      </div>

      {/* Total Tenants */}
      <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
            {t("dashboard.totalTenants")}
          </span>
          <div className="p-1.5 rounded-full bg-[#f0f7ff]">
            <Users className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>
        <p className="text-[24px] font-semibold tracking-tight text-ink">
          <AnimatedNumber value={totalTenants} formatter={int} />
        </p>
      </div>

      {/* Monthly Revenue */}
      <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
            {t("dashboard.monthlyRevenue")}
          </span>
          <div className="p-1.5 rounded-full bg-[#e6f2ff]">
            <Wallet className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>
        <p className="text-[24px] font-semibold tracking-tight text-primary">
          <AnimatedNumber value={monthlyRevenue} formatter={formatCurrency} />
        </p>
        <p className="text-[11px] text-[#86868b] mt-0.5">
          {currentInvoiceCount} {t("common.rooms")}
        </p>
      </div>
    </div>
  );
}
