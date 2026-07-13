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
    <div className="bg-white rounded-[14px] p-5 border border-divider-soft mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#0071e3]/8 flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-[13px] font-semibold text-ink">
            {t("dashboard.contractStatus")}
          </h3>
        </div>
        <span className="text-[11px] text-[#86868b]">
          {t("dashboard.tenantsTotal", { total: stats.total })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-[12px] px-4 py-3.5 border border-green-100">
          <p className="text-[10px] font-medium text-green-700">
            {t("dashboard.contractNormal")}
          </p>
          <p className="text-[24px] font-bold text-green-700 mt-0.5 leading-none">{stats.active}</p>
          <p className="text-[9px] text-green-600 mt-1.5">
            {t("dashboard.contractNotExpired")}
          </p>
        </div>
        <div className="bg-amber-50 rounded-[12px] px-4 py-3.5 border border-amber-100">
          <p className="text-[10px] font-medium text-amber-700">
            {t("dashboard.contractExpiring")}
          </p>
          <p className="text-[24px] font-bold text-amber-700 mt-0.5 leading-none">{stats.expiring}</p>
          <p className="text-[9px] text-amber-600 mt-1.5">
            {t("dashboard.contractExpiringDesc")}
          </p>
        </div>
        <div className="bg-red-50 rounded-[12px] px-4 py-3.5 border border-red-100">
          <p className="text-[10px] font-medium text-red-700">
            {t("dashboard.contractExpired")}
          </p>
          <p className="text-[24px] font-bold text-red-700 mt-0.5 leading-none">{stats.expired}</p>
          <p className="text-[9px] text-red-600 mt-1.5">
            {t("dashboard.contractExpiredDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
