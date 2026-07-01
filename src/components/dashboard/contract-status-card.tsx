"use client";

import { useTranslations } from "next-intl";
import { ClipboardCheck } from "lucide-react";

interface ContractStats {
  active: number;
  expiring: number;
  expired: number;
  total: number;
}

interface ContractStatusCardProps {
  stats: ContractStats;
}

export function ContractStatusCard({ stats }: ContractStatusCardProps) {
  const t = useTranslations();

  return (
    <div className="bg-white rounded-[14px] p-4 border border-divider-soft mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          <h3 className="text-[13px] font-semibold text-ink">
            {t("dashboard.contractStatus")}
          </h3>
        </div>
        <span className="text-[11px] text-[#86868b]">
          {t("dashboard.tenantsTotal", { total: stats.total })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-md px-4 py-3 border border-green-100">
          <p className="text-[10px] font-medium text-green-700">
            {t("dashboard.contractNormal")}
          </p>
          <p className="text-[22px] font-bold text-green-700 mt-0.5">{stats.active}</p>
          <p className="text-[9px] text-green-600 mt-0.5">
            {t("dashboard.contractNotExpired")}
          </p>
        </div>
        <div className="bg-amber-50 rounded-md px-4 py-3 border border-amber-100">
          <p className="text-[10px] font-medium text-amber-700">
            {t("dashboard.contractExpiring")}
          </p>
          <p className="text-[22px] font-bold text-amber-700 mt-0.5">{stats.expiring}</p>
          <p className="text-[9px] text-amber-600 mt-0.5">
            {t("dashboard.contractExpiringDesc")}
          </p>
        </div>
        <div className="bg-red-50 rounded-md px-4 py-3 border border-red-100">
          <p className="text-[10px] font-medium text-red-700">
            {t("dashboard.contractExpired")}
          </p>
          <p className="text-[22px] font-bold text-red-700 mt-0.5">{stats.expired}</p>
          <p className="text-[9px] text-red-600 mt-0.5">
            {t("dashboard.contractExpiredDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
