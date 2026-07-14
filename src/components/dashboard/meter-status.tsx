"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Gauge } from "lucide-react";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";

interface MeterStatusProps {
  meterReadCount: number;
  meterUnreadCount: number;
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-ink">
          {t("dashboard.meterStatus")}
        </h3>
        <span className="text-[18px] font-semibold tabular-nums text-ink leading-none">{readPct}%</span>
      </div>

      <div className="h-1.5 mb-3">
        <AnimatedProgressBar
          value={readPct}
          fillClassName="bg-primary"
          containerClassName="h-full bg-[#f5f5f7]"
        />
      </div>

      {meterUnreadCount > 0 && (
        <button
          onClick={() => router.push("/meters")}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-medium text-white bg-primary rounded-full hover:bg-primary-focus transition-colors"
        >
          <Gauge className="w-3.5 h-3.5" />
          {t("dashboard.meterBtn", { count: meterUnreadCount })}
        </button>
      )}
    </div>
  );
});
