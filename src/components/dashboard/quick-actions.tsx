"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { DoorOpen, Gauge, FileText, Users } from "lucide-react";

export const QuickActions = memo(function QuickActions() {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="bg-white rounded-[14px] border border-divider-soft p-3">
      <p className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
        {t("dashboard.quickActions")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            icon: Gauge,
            label: t("dashboard.recordMeter"),
            color: "bg-[#f0f7ff]",
            iconColor: "text-primary",
            path: "/meters",
          },
          {
            icon: FileText,
            label: t("dashboard.createBill"),
            color: "bg-amber-50",
            iconColor: "text-amber-600",
            path: "/invoices",
          },
          {
            icon: Users,
            label: t("dashboard.tenantsManage"),
            color: "bg-green-50",
            iconColor: "text-green-600",
            path: "/tenants",
          },
          {
            icon: DoorOpen,
            label: t("rooms.title"),
            color: "bg-divider-soft",
            iconColor: "text-[#6e6e73]",
            path: "/rooms",
          },
        ].map(({ icon: Icon, label, color, iconColor, path }) => (
          <button
            key={path}
            onClick={() => router.push(path)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${color} hover:opacity-80 transition-all text-left`}
          >
            <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
            <span className="text-[11px] font-medium text-ink">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
