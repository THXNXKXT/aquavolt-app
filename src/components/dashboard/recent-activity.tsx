"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Activity, ArrowRight, Gauge, FileText, Users, Building2 } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  detail: string;
  timestamp?: string;
  createdAt?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  timeAgo: (ts: string) => string;
}

export function RecentActivity({ activities, timeAgo }: RecentActivityProps) {
  const t = useTranslations();
  const router = useRouter();

  const activityIcon = (type: string) => {
    switch (type) {
      case "meter": return <Gauge className="w-4 h-4 text-primary" />;
      case "invoice": return <FileText className="w-4 h-4 text-amber-600" />;
      case "tenant": return <Users className="w-4 h-4 text-green-600" />;
      default: return <Building2 className="w-4 h-4 text-[#86868b]" />;
    }
  };

  return (
    <div className="bg-white rounded-[14px] px-4 pt-4 pb-5 border border-divider-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[#86868b]">
          {t("dashboard.recentActivity")}
        </h3>
        <button
          onClick={() => router.push("/activity")}
          className="text-[11px] text-primary hover:text-primary-focus transition-colors font-medium flex items-center gap-1"
        >
          {t("dashboard.viewAll")}
        </button>
      </div>
      <div className="space-y-1">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-center gap-3 py-2"
          >
            <div className="shrink-0">
              {activityIcon(act.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-ink truncate">{act.detail}</p>
            </div>
            <p className="text-[10px] text-[#86868b] shrink-0" suppressHydrationWarning>
              {timeAgo(act.timestamp || act.createdAt || "")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
