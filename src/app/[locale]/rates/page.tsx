"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { SubNav } from "@/components/layout/sub-nav";
import { useSettings } from "@/hooks/use-settings";
import { formatCurrency } from "@/lib/formatters";
import { Reveal } from "@/components/shared/reveal";
import { Droplets, Zap, Building2, Settings, ArrowRight } from "lucide-react";

export default function RatesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { settings } = useSettings();
  const { waterRate, electricRate, serviceCharge } = settings;

  const rateItems = [
    {
      icon: Droplets,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      name: t("rates.water"),
      rate: waterRate,
      unit: t("rates.perCubicMeter"),
    },
    {
      icon: Zap,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      name: t("rates.electric"),
      rate: electricRate,
      unit: t("rates.perKwh"),
    },
    {
      icon: Building2,
      iconBg: "bg-[#f5f5f7]",
      iconColor: "text-[#86868b]",
      name: t("rates.service"),
      rate: serviceCharge,
      unit: t("rates.perMonth"),
    },
  ];

  return (
    <div>
      <SubNav title={t("rates.title")}>
        <button
          onClick={() => router.push("/settings")}
          className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:text-primary-focus transition-colors"
        >
          <Settings className="w-4 h-4" />
          {t("settings.title")}
        </button>
      </SubNav>
      <Reveal className="max-w-[800px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Rates summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-[13px] text-[#86868b]">
            {waterRate} ฿/m³ · {electricRate} ฿/kWh · บริการ {serviceCharge} ฿
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-medium rounded-full hover:bg-primary-focus active:scale-[0.97] transition-colors"
          >
            <Settings className="w-4 h-4" />
            {t("settings.title")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {rateItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="bg-white rounded-[14px] p-4 border border-divider-soft text-center"
              >
                <div
                  className={`p-3 rounded-full ${item.iconBg} w-fit mx-auto mb-3`}
                >
                  <Icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <p className="text-[13px] text-[#86868b] mb-1">{item.name}</p>
                <p className="text-[28px] font-semibold tracking-tight text-ink">
                  {formatCurrency(item.rate)}
                </p>
                <p className="text-[11px] text-[#86868b] mt-0.5">{item.unit}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[14px] p-6 border border-divider-soft">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[17px] font-semibold text-ink">
                {t("rates.title")}
              </h3>
              <p className="text-[13px] text-[#86868b] mt-0.5">
                {t("common.total")}:{" "}
                <span className="font-semibold text-primary">
                  {formatCurrency(waterRate + electricRate + serviceCharge)}
                </span>
                /{t("rates.perMonth")}
              </p>
            </div>
            <button
              onClick={() => router.push("/settings")}
              className="inline-flex items-center gap-1 text-[13px] text-primary hover:text-primary-focus transition-colors"
            >
              {t("common.edit")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
