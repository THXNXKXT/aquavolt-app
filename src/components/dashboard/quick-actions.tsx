"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { DoorOpen, Gauge, FileText, Users } from "lucide-react";

export const QuickActions = memo(function QuickActions() {
  const t = useTranslations();
  const router = useRouter();

  const actions = [
    { icon: Gauge, label: t("dashboard.recordMeter"), color: "text-primary", path: "/meters" },
    { icon: FileText, label: t("dashboard.createBill"), color: "text-amber-600", path: "/invoices" },
    { icon: Users, label: t("dashboard.tenantsManage"), color: "text-green-600", path: "/tenants" },
    { icon: DoorOpen, label: t("rooms.title"), color: "text-[#86868b]", path: "/rooms" },
  ];

  return (
    <div className="bg-white rounded-[14px] border border-divider-soft p-3">
      <div className="grid grid-cols-4 gap-1">
        {actions.map(({ icon: Icon, label, color, path }) => (
          <button
            key={path}
            onClick={() => router.push(path)}
            className="flex flex-col items-center gap-2 py-2.5 px-1 rounded-[10px] hover:bg-canvas-parchment transition-colors"
          >
            <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
            <span className="text-[10px] font-medium text-[#86868b] text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
