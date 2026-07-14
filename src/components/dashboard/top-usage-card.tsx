"use client";

import { useTranslations, useLocale } from "next-intl";
import { Zap, Droplets } from "lucide-react";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";
import type { MeterReading } from "@/types";

interface TopUsageCardProps {
  topElectric: MeterReading[];
  topWater: MeterReading[];
  currentMonth: number;
}

export function TopUsageCard({ topElectric, topWater, currentMonth }: TopUsageCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  const monthName = new Date(
    new Date().getFullYear(),
    currentMonth - 1,
    1
  ).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long" });

  return (
    <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-ink">
          {t("dashboard.topUsage")}
        </h3>
        <span className="text-[10px] text-[#86868b]">
          {t("dashboard.monthlyLabel", { month: monthName })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Electric */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-medium text-[#86868b] uppercase tracking-wider">
              {t("dashboard.electric")}
            </span>
          </div>
          {topElectric.length > 0 ? (
            <div className="space-y-2">
              {topElectric.map((r, i) => {
                const maxVal = Number(topElectric[0].electricUsage) || 0;
                const pct = maxVal > 0 ? Math.round((Number(r.electricUsage) / maxVal) * 100) : 0;
                return (
                  <div key={r.id}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-ink font-medium">{r.roomNumber}</span>
                      <span className="font-semibold tabular-nums text-ink">
                        {Number(r.electricUsage) || 0}
                      </span>
                    </div>
                    <div className="h-1.5">
                      <AnimatedProgressBar
                        value={pct}
                        fillClassName="bg-amber-500"
                        containerClassName="h-full bg-[#f5f5f7]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-[#86868b] py-4 text-center">—</p>
          )}
        </div>
        {/* Water */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Droplets className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-[#86868b] uppercase tracking-wider">
              {t("dashboard.water")}
            </span>
          </div>
          {topWater.length > 0 ? (
            <div className="space-y-2">
              {topWater.map((r, i) => {
                const maxVal = Number(topWater[0].waterUsage) || 0;
                const pct = maxVal > 0 ? Math.round((Number(r.waterUsage) / maxVal) * 100) : 0;
                return (
                  <div key={r.id}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-ink font-medium">{r.roomNumber}</span>
                      <span className="font-semibold tabular-nums text-ink">
                        {Number(r.waterUsage) || 0}
                      </span>
                    </div>
                    <div className="h-1.5">
                      <AnimatedProgressBar
                        value={pct}
                        fillClassName="bg-primary"
                        containerClassName="h-full bg-[#f5f5f7]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-[#86868b] py-4 text-center">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
