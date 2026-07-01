"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Gauge } from "lucide-react";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";

interface MeterStatusProps {
  /** Number of meters read */
  meterReadCount: number;
  /** Number of meters not yet read */
  meterUnreadCount: number;
  /** Number of occupied rooms */
  occupiedRoomCount: number;
}

export const MeterStatus = memo(function MeterStatus({
  meterReadCount,
  meterUnreadCount,
  occupiedRoomCount,
}: MeterStatusProps) {
  const t = useTranslations();
  const router = useRouter();

  const readPct =
    occupiedRoomCount > 0
      ? Math.round((meterReadCount / occupiedRoomCount) * 100)
      : 0;

  return (
    <div className="bg-white rounded-[14px] p-4 border border-divider-soft flex-1">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="text-[13px] font-semibold text-ink">
          {t("dashboard.meterStatus")}
        </h3>
      </div>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-[#86868b]">
              {t("dashboard.meterRead", { count: meterReadCount })}
            </span>
            <span className="font-semibold text-primary">{readPct}%</span>
          </div>
          <div className="h-2">
            <AnimatedProgressBar
              value={readPct}
              fillClassName="bg-primary"
              containerClassName="h-full bg-[#f0f7ff]"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-[#86868b]">
          <span className="w-2 h-2 rounded-full bg-primary" />{" "}
          {t("dashboard.meterRead", { count: meterReadCount })}
        </span>
        {meterUnreadCount > 0 && (
          <span className="flex items-center gap-1.5 text-[#a1a1a6]">
            <span className="w-2 h-2 rounded-full bg-surface-chip" />{" "}
            {t("dashboard.meterUnread", { count: meterUnreadCount })}
          </span>
        )}
      </div>
      {meterUnreadCount > 0 && (
        <button
          onClick={() => router.push("/meters")}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-medium text-white bg-primary rounded-full hover:bg-primary-focus transition-all"
        >
          <Gauge className="w-3.5 h-3.5" />{" "}
          {t("dashboard.meterBtn", { count: meterUnreadCount })}
        </button>
      )}
    </div>
  );
});
