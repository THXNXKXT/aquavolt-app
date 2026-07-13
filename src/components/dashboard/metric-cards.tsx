"use client";

import { useTranslations } from "next-intl";
import { Building2, Users, DoorOpen, Receipt } from "lucide-react";
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
}: MetricCardsProps) {
  const t = useTranslations();
  const int = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Rooms */}
      <div className="bg-white rounded-[14px] p-5 border border-divider-soft">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-[10px] bg-blue-50 flex items-center justify-center">
            <DoorOpen className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
            {t("dashboard.totalRooms")}
          </span>
        </div>
        <p className="text-[32px] font-semibold tracking-tight text-ink leading-none">
          <AnimatedNumber value={totalRooms} formatter={int} />
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-medium text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {occupiedRooms}{" "}
            {t("dashboard.roomsOccupied")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-medium text-blue-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {vacantRooms}{" "}
            {t("dashboard.roomsVacant")}
          </span>
        </div>
      </div>

      {/* Total Tenants */}
      <div className="bg-white rounded-[14px] p-5 border border-divider-soft">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#f0f7ff] flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
            {t("dashboard.totalTenants")}
          </span>
        </div>
        <p className="text-[32px] font-semibold tracking-tight text-ink leading-none">
          <AnimatedNumber value={totalTenants} formatter={int} />
        </p>
        <p className="text-[11px] text-[#86868b] mt-3">
          {totalBuildings} {t("dashboard.allBuildings")}
        </p>
      </div>

      {/* This Month Bills (gradient) */}
      <div className="bg-gradient-to-br from-[#0071e3] to-[#005bb5] rounded-[14px] p-5 border border-transparent">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/70 uppercase tracking-wider">
            {t("nav.invoices")}
          </span>
        </div>
        <p className="text-[32px] font-semibold tracking-tight text-white leading-none">
          <AnimatedNumber value={currentInvoiceCount} formatter={int} />
        </p>
        <p className="text-[11px] text-white/60 mt-3">
          {formatCurrency(monthlyRevenue)}
        </p>
      </div>

      {/* Buildings */}
      <div className="bg-white rounded-[14px] p-5 border border-divider-soft">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-[10px] bg-amber-50 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
            {t("dashboard.allBuildings")}
          </span>
        </div>
        <p className="text-[32px] font-semibold tracking-tight text-ink leading-none">
          <AnimatedNumber value={totalBuildings} formatter={int} />
        </p>
        <div className="flex gap-1.5 mt-3">
          {maintenanceRooms > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-medium text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {maintenanceRooms}{" "}
              {t("dashboard.roomsMaintenance")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
