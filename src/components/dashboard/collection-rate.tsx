"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";

interface CollectionRateProps {
  collectionRate: number;
  paidCount: number;
  totalInvoices: number;
}

export const CollectionRate = memo(function CollectionRate({
  collectionRate,
  paidCount,
  totalInvoices,
}: CollectionRateProps) {
  const t = useTranslations();

  return (
    <div className="bg-white rounded-[14px] p-4 border border-divider-soft flex-1">
      <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
        {t("dashboard.collectionRate")}
      </span>
      <p className="text-[34px] font-semibold tabular-nums tracking-tight text-ink leading-none mt-3">
        <AnimatedNumber value={collectionRate} formatter={(v) => `${Math.round(v)}%`} />
      </p>
      <p className="text-[10px] text-[#86868b] mt-2">
        {t("dashboard.collectionDesc", { paid: paidCount, total: totalInvoices })}
      </p>
      <div className="mt-3 h-1.5">
        <AnimatedProgressBar value={collectionRate} fillClassName="bg-green-500" containerClassName="h-full bg-[#f5f5f7]" />
      </div>
    </div>
  );
});
