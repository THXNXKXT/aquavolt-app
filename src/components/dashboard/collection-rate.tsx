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
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
          {t("dashboard.collectionRate")}
        </span>
        <div className="p-1.5 rounded-full bg-green-50">
          <svg
            className="w-3.5 h-3.5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
      <p className="text-[24px] font-semibold tracking-tight text-ink">
        <AnimatedNumber
          value={collectionRate}
          formatter={(v) => `${Math.round(v)}%`}
        />
      </p>
      <p className="text-[11px] text-[#86868b] mt-0.5">
        {t("dashboard.collectionDesc", { paid: paidCount, total: totalInvoices })}
      </p>
      <div className="mt-2 h-1.5">
        <AnimatedProgressBar
          value={collectionRate}
          fillClassName="bg-green-500"
          containerClassName="h-full bg-divider-soft"
        />
      </div>
    </div>
  );
});
