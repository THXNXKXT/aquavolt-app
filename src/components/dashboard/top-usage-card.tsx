"use client";

import { useTranslations, useLocale } from "next-intl";
import { Trophy, Zap, Droplets } from "lucide-react";
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
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#d97706]" />
          <h3 className="text-[13px] font-semibold text-ink">
            {t("dashboard.topUsage")}
          </h3>
        </div>
        <span className="text-[10px] text-[#86868b]">
          {t("dashboard.monthlyLabel", { month: monthName })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Electric side */}
        <div className="border border-divider-soft rounded-md p-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
              <Zap className="w-3 h-3 text-[#d97706]" /> {t("dashboard.electric")}
            </span>
            <span className="text-[9px] text-[#a1a1a6] ml-auto">{t("dashboard.unitKwh")}</span>
          </div>
          {topElectric.length > 0 ? (
            <div className="space-y-2.5">
              {topElectric.map((r, i) => {
                const maxVal = Number(topElectric[0].electricUsage) || 0;
                const pct = maxVal > 0 ? Math.round((Number(r.electricUsage) / maxVal) * 100) : 0;
                return (
                  <div key={r.id}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                            i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-blue-400"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-ink font-medium">{r.roomNumber}</span>
                      </div>
                      <span className="font-semibold text-ink">
                        {Number(r.electricUsage) || 0}
                      </span>
                    </div>
                    <div className="h-1.5">
                      <AnimatedProgressBar
                        value={pct}
                        fillClassName="bg-[#d97706]"
                        containerClassName="h-full bg-divider-soft"
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
        {/* Water side */}
        <div className="border border-divider-soft rounded-md p-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
              <Droplets className="w-3 h-3 text-primary" /> {t("dashboard.water")}
            </span>
            <span className="text-[9px] text-[#a1a1a6] ml-auto">{t("dashboard.unitM3")}</span>
          </div>
          {topWater.length > 0 ? (
            <div className="space-y-2.5">
              {topWater.map((r, i) => {
                const maxVal = Number(topWater[0].waterUsage) || 0;
                const pct = maxVal > 0 ? Math.round((Number(r.waterUsage) / maxVal) * 100) : 0;
                return (
                  <div key={r.id}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                            i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-blue-400"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-ink font-medium">{r.roomNumber}</span>
                      </div>
                      <span className="font-semibold text-ink">
                        {Number(r.waterUsage) || 0}
                      </span>
                    </div>
                    <div className="h-1.5">
                      <AnimatedProgressBar
                        value={pct}
                        fillClassName="bg-primary"
                        containerClassName="h-full bg-divider-soft"
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
