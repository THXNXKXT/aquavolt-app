"use client";

import { useTranslations } from "next-intl";

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
  const { active, expiring, expired, total } = stats;

  // Calculate bar widths
  const activePct = total > 0 ? (active / total) * 100 : 0;
  const expiringPct = total > 0 ? (expiring / total) * 100 : 0;
  const expiredPct = total > 0 ? (expired / total) * 100 : 0;

  return (
    <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-ink">
          {t("dashboard.contractStatus")}
        </h3>
        <span className="text-[10px] text-[#86868b]">
          {t("dashboard.tenantsTotal", { total })}
        </span>
      </div>

      {/* Segmented progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-[#f5f5f7] mb-4">
        {activePct > 0 && (
          <div className="bg-green-500" style={{ width: `${activePct}%` }} />
        )}
        {expiringPct > 0 && (
          <div className="bg-amber-400" style={{ width: `${expiringPct}%` }} />
        )}
        {expiredPct > 0 && (
          <div className="bg-red-500" style={{ width: `${expiredPct}%` }} />
        )}
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[18px] font-semibold tabular-nums text-ink leading-none">{active}</span>
          <span className="text-[10px] text-[#86868b]">{t("dashboard.contractNormal")}</span>
        </div>
        {expiring > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[18px] font-semibold tabular-nums text-ink leading-none">{expiring}</span>
            <span className="text-[10px] text-[#86868b]">{t("dashboard.contractExpiring")}</span>
          </div>
        )}
        {expired > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[18px] font-semibold tabular-nums text-ink leading-none">{expired}</span>
            <span className="text-[10px] text-[#86868b]">{t("dashboard.contractExpired")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
