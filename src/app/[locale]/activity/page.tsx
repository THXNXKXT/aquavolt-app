"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { SubNav } from "@/components/layout/sub-nav";
import { SelectApple } from "@/components/shared/select-apple";
import { fetchActivities, type Activity } from "@/lib/api";
import { Reveal } from "@/components/shared/reveal";
import { Gauge, FileText, Users, Building2, Search, ArrowRight, Clock } from "lucide-react";

export default function ActivityPage() {
  const t = useTranslations();
  const locale = useLocale();

  const typeConfig: Record<string, { icon: React.ReactNode; bg: string; badge: string; label: string }> = {
    meter: {
      icon: <Gauge className="w-3.5 h-3.5" />,
      bg: "bg-[#f0f7ff]",
      badge: "text-primary bg-[#e6f2ff]",
      label: t("meters.title"),
    },
    invoice: {
      icon: <FileText className="w-3.5 h-3.5" />,
      bg: "bg-amber-50",
      badge: "text-amber-700 bg-amber-50",
      label: t("invoices.title"),
    },
    tenant: {
      icon: <Users className="w-3.5 h-3.5" />,
      bg: "bg-green-50",
      badge: "text-green-700 bg-green-50",
      label: t("tenants.title"),
    },
    room: {
      icon: <Building2 className="w-3.5 h-3.5" />,
      bg: "bg-canvas-parchment",
      badge: "text-[#6e6e73] bg-divider-soft",
      label: t("rooms.title"),
    },
  };

  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [activitiesData, setActivitiesData] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchActivities().then((d) => { setActivitiesData(d); setLoaded(true); }).catch(() => { setLoaded(true); });
  }, []);

  const getTs = (a: Activity) => a.createdAt;

  const timeAgo = (ts: string) => {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return "-";
    // eslint-disable-next-line react-hooks/purity -- time-ago display needs current time
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "short" });
  };

  const monthOptions = useMemo(() => {
    const months = new Set(activitiesData.map((a) => {
      const d = new Date(getTs(a));
      return `${d.getMonth() + 1}-${d.getFullYear()}`;
    }));
    return Array.from(months).sort().reverse().map((m) => {
      const [mo, yr] = m.split("-");
      return { value: m, label: `${getMonthName(parseInt(mo))} ${yr}` };
    });
  }, [activitiesData]);

  const filtered = useMemo(() => {
    return activitiesData
      .filter((a) => {
        if (filterType !== "all" && a.type !== filterType) return false;
        if (search && !a.detail.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterMonth !== "all") {
          const d = new Date(getTs(a));
          if (`${d.getMonth() + 1}-${d.getFullYear()}` !== filterMonth) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(getTs(b)).getTime() - new Date(getTs(a)).getTime());
  }, [filterType, search, filterMonth, activitiesData]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; items: Activity[] }[] = [];
    let currentLabel = "";
    let currentItems: Activity[] = [];
    filtered.forEach((a) => {
      const d = new Date(getTs(a));
      const label = d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
      if (label !== currentLabel) {
        if (currentItems.length > 0) groups.push({ label: currentLabel, items: currentItems });
        currentLabel = label;
        currentItems = [];
      }
      currentItems.push(a);
    });
    if (currentItems.length > 0) groups.push({ label: currentLabel, items: currentItems });
    return groups;
  }, [filtered, locale]);

  const typeFilters = [
    { value: "all", label: t("common.filter") },
    { value: "meter", label: t("meters.title") },
    { value: "invoice", label: t("invoices.title") },
    { value: "tenant", label: t("tenants.title") },
    { value: "room", label: t("rooms.title") },
  ];

  return (
    <div>
      <SubNav title={t("dashboard.recentActivity")}>
        <span className="text-xs text-[#86868b]">{filtered.length} {t("common.items")}</span>
      </SubNav>
      <Reveal className="max-w-200 mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a6]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="w-full pl-9 pr-4 py-2.5 rounded-full border border-hairline text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-1 p-1 bg-divider-soft rounded-full flex-wrap">
            {typeFilters.map((opt) => (
              <button key={opt.value} onClick={() => setFilterType(opt.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  filterType === opt.value ? "bg-white text-ink shadow-sm" : "text-[#86868b] hover:text-ink"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          <SelectApple
            value={filterMonth}
            onChange={setFilterMonth}
            options={[
              { value: "all", label: t("invoices.filterMonth") },
              ...monthOptions,
            ]}
            className="min-w-40"
          />
        </div>

        {/* Timeline Feed */}
        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-surface-chip border-t-primary rounded-full animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full bg-canvas-parchment flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-surface-chip" />
            </div>
            <p className="text-[13px] text-[#86868b]">{t("common.no_activity") || "No activity"}</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-4.75 top-3 bottom-3 w-px bg-hairline" />

            <div className="space-y-8">
              {grouped.map((group) => (
                <div key={group.label}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9.75 h-9.75 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm relative z-10">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-[13px] font-semibold text-ink">{group.label}</h3>
                    <span className="text-[11px] text-[#86868b]">{group.items.length} {t("common.items") || "items"}</span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 ml-12.75">
                    {group.items.map((act) => {
                      const cfg = typeConfig[act.type] || typeConfig.room;
                      return (
                        <div key={act.id}
                          className="relative flex items-start gap-3 px-4 py-3 rounded-[14px] border border-divider-soft bg-white hover:border-hairline transition-colors group">
                          {/* Time dot on timeline */}
                          <div className="absolute -left-8.75 top-4.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: act.type === "meter" ? "#0066cc" : act.type === "invoice" ? "#d97706" : act.type === "tenant" ? "#16a34a" : "#a1a1a6" }} />

                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                            {cfg.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                {cfg.label}
                              </span>
                              <span className="text-[11px] text-[#a1a1a6]" suppressHydrationWarning>{timeAgo(getTs(act))}</span>
                            </div>
                            <p className="text-[13px] text-ink">{act.detail}</p>
                          </div>

                          {/* Hover arrow */}
                          <ArrowRight className="w-4 h-4 text-surface-chip mt-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Reveal>
    </div>
  );
}
