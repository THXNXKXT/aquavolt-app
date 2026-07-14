"use client";

import { useTranslations, useLocale } from "next-intl";
import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { AnimatedNumber } from "@/components/shared/animated-number";
import type { Invoice } from "@/types";

interface RevenueBreakdownItem {
  label: string;
  value: number;
  color: string;
}

interface RevenueCardProps {
  invoicesData: Invoice[];
  revenueByMonth: { month: number; year: number; label: string; total: number; count: number }[];
  maxRevenue: number;
  currentMonth: number;
  currentYear: number;
  avg: number;
  diff: number;
  diffPct: number;
  loading: boolean;
}

export function RevenueCard({
  invoicesData,
  revenueByMonth,
  currentMonth,
  currentYear,
  avg,
  diff,
  diffPct,
  loading,
}: RevenueCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  // All paid invoices across all time (total revenue)
  const allPaidInvs = useMemo(
    () => invoicesData.filter((inv) => inv.status === "paid"),
    [invoicesData]
  );

  const data: RevenueBreakdownItem[] = useMemo(
    () => [
      {
        label: t("dashboard.revenueRent"),
        value: allPaidInvs.reduce((s, inv) => s + Number(inv.rentalCost || 0), 0),
        color: "#1d1d1f",
      },
      {
        label: t("dashboard.revenueWater"),
        value: allPaidInvs.reduce((s, inv) => s + Number(inv.waterCost || 0), 0),
        color: "#0066cc",
      },
      {
        label: t("dashboard.revenueElectric"),
        value: allPaidInvs.reduce((s, inv) => s + Number(inv.electricCost || 0), 0),
        color: "#d97706",
      },
      {
        label: t("dashboard.revenueService"),
        value: allPaidInvs.reduce((s, inv) => s + Number(inv.serviceCharge || 0), 0),
        color: "#86868b",
      },
      {
        label: t("dashboard.revenueWiFi"),
        value: allPaidInvs.reduce((s, inv) => s + Number(inv.wifiCost || 0), 0),
        color: "#8b5cf6",
      },
    ],
    [allPaidInvs, t]
  );

  const grand = useMemo(() => data.reduce((s: number, t) => s + t.value, 0), [data]);

  if (grand === 0 && !loading) return null;

  return (
    <div className="bg-white rounded-[14px] border border-divider-soft px-4 pt-4 pb-5">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-[#86868b]">
            {t("dashboard.totalRevenue")}
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[32px] font-semibold tabular-nums tracking-[-0.03em] text-ink">
              <AnimatedNumber
                value={grand}
                formatter={(v) => formatCurrency(v).replace(/\.00฿/, "฿")}
              />
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                diff >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}
            >
              {diff >= 0 ? "↑" : "↓"} {Math.abs(diffPct)}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#86868b]">
            {new Date().toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "short", year: "numeric" })}
          </p>
          <p className="text-[10px] text-[#86868b] mt-0.5">
            {t("dashboard.paidSummary", { paid: allPaidInvs.length, total: invoicesData.length })}
          </p>
        </div>
      </div>

      {/* ═══ Top Half: Bar Chart (left) + Donut (right) — 50/50 ═══ */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-[#86868b] mb-2">
            {t("dashboard.revenue6Months")}
          </p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart
              data={revenueByMonth}
              margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
              style={{ outline: "none" }}
            >
              <Bar dataKey="total" radius={[2, 2, 0, 0]}>
                {revenueByMonth.map((m, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      m.month === currentMonth && m.year === currentYear
                        ? "#0066cc"
                        : "#dce8f5"
                    }
                    strokeWidth={0}
                  />
                ))}
              </Bar>
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()} ฿`, t("dashboard.revenueLabel")]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e0e0e0" }}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 8, fill: "#86868b" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <PieChart width={130} height={130} style={{ outline: "none" }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={60}
              dataKey="value"
              paddingAngle={1.5}
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()} ฿`, ""]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e0e0e0" }}
            />
          </PieChart>
        </div>
      </div>

      {/* ═══ Bottom Half: Summary + Breakdown ═══ */}
      <div className="pt-3 border-t border-divider-soft space-y-3">
        {/* Summary pills */}
        {revenueByMonth.length >= 2 && (
          <div className="flex gap-2">
            <div className="flex-1 bg-[#f5f5f7] rounded-md px-3 py-2 text-center">
              <p className="text-[10px] text-[#86868b]">{t("dashboard.thisMonth")}</p>
              <p className="text-[13px] font-semibold text-primary">
                <AnimatedNumber
                  value={revenueByMonth[revenueByMonth.length - 1].total}
                  formatter={(v) => formatCurrency(v).replace(/\.00฿/, "฿")}
                />
              </p>
            </div>
            <div className="flex-1 bg-canvas-parchment rounded-md px-3 py-2 text-center">
              <p className="text-[10px] text-[#86868b]">{t("dashboard.lastMonth")}</p>
              <p className="text-[13px] font-semibold text-ink">
                <AnimatedNumber
                  value={revenueByMonth[revenueByMonth.length - 2].total}
                  formatter={(v) => formatCurrency(v).replace(/\.00฿/, "฿")}
                />
              </p>
              <p
                className={`text-[10px] font-medium ${
                  diff >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {diff >= 0 ? "↑" : "↓"} {Math.abs(diffPct)}%
              </p>
            </div>
            <div className="flex-1 bg-canvas-parchment rounded-md px-3 py-2 text-center">
              <p className="text-[10px] text-[#86868b]">{t("dashboard.avgPerMonth")}</p>
              <p className="text-[13px] font-semibold text-ink">
                <AnimatedNumber
                  value={avg}
                  formatter={(v) => formatCurrency(v).replace(/\.00฿/, "฿")}
                />
              </p>
            </div>
          </div>
        )}

        {/* Revenue grid */}
        <div className="grid grid-cols-2 gap-2">
          {data
            .filter((d) => d.value > 0)
            .map((entry) => (
              <div
                key={entry.label}
                className="bg-[#fafafa] rounded-md px-3 py-2.5 border border-divider-soft"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#86868b]">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.label}
                  </span>
                  <span className="text-[11px] font-semibold text-ink">
                    {Math.round((entry.value / grand) * 100)}%
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-ink ml-4.5">
                  <AnimatedNumber
                    value={entry.value}
                    formatter={(v) => formatCurrency(v).replace(/\.00฿/, "฿")}
                  />
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
