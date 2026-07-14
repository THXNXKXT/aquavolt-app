"use client";

import { useTranslations } from "next-intl";
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
  collectionRate: number;
  paidCount: number;
  buildings?: { name: string }[];
}

export function MetricCards({
  totalRooms,
  occupiedRooms,
  vacantRooms,
  maintenanceRooms,
  totalBuildings,
  totalTenants,
  currentInvoiceCount,
  collectionRate,
  paidCount,
}: MetricCardsProps) {
  const t = useTranslations();
  const int = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Total Rooms */}
      <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
        <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
          {t("dashboard.totalRooms")}
        </span>
        <p className="text-[34px] font-semibold tabular-nums tracking-tight text-ink leading-none mt-3">
          <AnimatedNumber value={totalRooms} formatter={int} />
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-[#86868b]">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {occupiedRooms} {t("dashboard.roomsOccupied")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-[#86868b]">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            {vacantRooms} {t("dashboard.roomsVacant")}
          </span>
        </div>
      </div>

      {/* Total Tenants */}
      <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
        <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
          {t("dashboard.totalTenants")}
        </span>
        <p className="text-[34px] font-semibold tabular-nums tracking-tight text-ink leading-none mt-3">
          <AnimatedNumber value={totalTenants} formatter={int} />
        </p>
        <p className="text-[10px] text-[#86868b] mt-3">
          {totalBuildings} {t("dashboard.allBuildings")}
        </p>
      </div>

      {/* Collection Rate (gradient) */}
      <div className="bg-gradient-to-br from-[#0071e3] to-[#005bb5] rounded-[14px] p-4 border border-transparent">
        <span className="text-[11px] font-medium text-white/70 uppercase tracking-wider">
          {t("dashboard.collectionRate")}
        </span>
        <p className="text-[34px] font-semibold tabular-nums tracking-tight text-white leading-none mt-3">
          <AnimatedNumber value={collectionRate} formatter={(v) => `${Math.round(v)}%`} />
        </p>
        <p className="text-[10px] text-white/60 mt-3">
          {paidCount}/{currentInvoiceCount} {t("dashboard.paid")}
        </p>
      </div>

      {/* Buildings */}
      <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
        <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
          {t("dashboard.allBuildings")}
        </span>
        <p className="text-[34px] font-semibold tabular-nums tracking-tight text-ink leading-none mt-3">
          <AnimatedNumber value={totalBuildings} formatter={int} />
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
          {maintenanceRooms > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#86868b]">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {maintenanceRooms} {t("dashboard.roomsMaintenance")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
