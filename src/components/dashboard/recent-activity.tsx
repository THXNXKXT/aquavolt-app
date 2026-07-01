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
      case "meter": return <Gauge className="w-3 h-3 text-primary" />;
      case "invoice": return <FileText className="w-3 h-3 text-amber-600" />;
      case "tenant": return <Users className="w-3 h-3 text-green-600" />;
      default: return <Building2 className="w-3 h-3 text-[#6e6e73]" />;
    }
  };

  const activityBg = (type: string) => {
    switch (type) {
      case "meter": return "bg-[#f0f7ff]";
      case "invoice": return "bg-amber-50";
      case "tenant": return "bg-green-50";
      default: return "bg-canvas-parchment";
    }
  };

  return (
    <div className="bg-white rounded-[14px] p-4 border border-divider-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-[13px] font-semibold text-ink">
            {t("dashboard.recentActivity")}
          </h3>
        </div>
        <button
          onClick={() => router.push("/activity")}
          className="text-[11px] text-primary hover:text-primary-focus transition-colors font-medium flex items-center gap-1"
        >
          {t("dashboard.viewAll")} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-1.5">
        {activities.map((act: any) => (
          <div
            key={act.id}
            className="flex items-start gap-2.5 px-2 py-2 rounded-md hover:bg-canvas-parchment transition-colors"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${activityBg(act.type)}`}
            >
              {activityIcon(act.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-ink truncate">{act.detail}</p>
              <p className="text-[9px] text-[#a1a1a6] mt-0.5" suppressHydrationWarning>
                {timeAgo(act.timestamp || act.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
