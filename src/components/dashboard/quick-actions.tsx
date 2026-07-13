"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { DoorOpen, Gauge, FileText, Users } from "lucide-react";

export const QuickActions = memo(function QuickActions() {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="bg-white rounded-[14px] border border-divider-soft p-5">
      <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
        {t("dashboard.quickActions")}
      </p>
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { icon: Gauge, label: t("dashboard.recordMeter"), tile: "bg-[#0071e3]/8", iconColor: "text-primary", path: "/meters" },
          { icon: FileText, label: t("dashboard.createBill"), tile: "bg-amber-50", iconColor: "text-amber-600", path: "/invoices" },
          { icon: Users, label: t("dashboard.tenantsManage"), tile: "bg-green-50", iconColor: "text-green-600", path: "/tenants" },
          { icon: DoorOpen, label: t("rooms.title"), tile: "bg-[#0071e3]/5", iconColor: "text-[#6e6e73]", path: "/rooms" },
        ].map(({ icon: Icon, label, tile, iconColor, path }) => (
          <button
            key={path}
            onClick={() => router.push(path)}
            className="flex flex-col items-center gap-2 py-3 rounded-[12px] hover:bg-canvas-parchment transition-all group"
          >
            <div className={`w-10 h-10 rounded-[12px] ${tile} flex items-center justify-center group-hover:scale-105 transition-transform`}>
              <Icon className={`w-4.5 h-4.5 ${iconColor}`} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium text-[#6e6e73] text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
