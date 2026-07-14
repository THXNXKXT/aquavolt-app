"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";

interface CollectionRateProps {
  /** Collection rate percentage */
  collectionRate: number;
  /** Number of paid invoices */
  paidCount: number;
  /** Total invoices for current month */
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
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-[10px] bg-green-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
          {t("dashboard.collectionRate")}
        </span>
      </div>
      <p className="text-[32px] font-semibold tracking-tight text-ink leading-none">
        <AnimatedNumber value={collectionRate} formatter={(v) => `${Math.round(v)}%`} />
      </p>
      <p className="text-[11px] text-[#86868b] mt-2">
        {t("dashboard.collectionDesc", { paid: paidCount, total: totalInvoices })}
      </p>
      <div className="mt-3 h-1.5">
        <AnimatedProgressBar value={collectionRate} fillClassName="bg-green-500" containerClassName="h-full bg-divider-soft" />
      </div>
    </div>
  );
});
