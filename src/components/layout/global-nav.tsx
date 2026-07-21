"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Logo } from "@/components/shared/logo";
import { GlobalSearch } from "@/components/layout/global-search";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  Gauge,
  Receipt,
  Activity,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

interface NavGroup {
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { href: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: "nav.management",
    icon: Building2,
    items: [
      { href: "/buildings", labelKey: "nav.buildings", icon: Building2 },
      { href: "/rooms", labelKey: "nav.rooms", icon: DoorOpen },
      { href: "/tenants", labelKey: "nav.tenants", icon: Users },
    ],
  },
  {
    labelKey: "nav.reports",
    icon: Receipt,
    items: [
      { href: "/meters", labelKey: "nav.meters", icon: Gauge },
      { href: "/invoices", labelKey: "nav.invoices", icon: Receipt },
      { href: "/activity", labelKey: "nav.activity", icon: Activity },
      { href: "/reports", labelKey: "nav.reports", icon: FileText },
    ],
  },
];

const standaloneItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
];

const settingsItem = { href: "/settings", labelKey: "nav.settings", icon: Settings };

export function GlobalNav() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleLogout = () => { logout(); router.push("/login"); };
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close mobile menu on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!openGroup) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!Object.values(groupRefs.current).some((ref) => ref?.contains(target))) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openGroup]);

  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => pathname.startsWith(item.href));

  return (
    <nav className="no-print fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-divider-soft">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/dashboard"
          className="flex items-center gap-2.5 shrink-0 group">
          <Logo size={32} className="" />
          <span className="text-[15px] font-semibold tracking-[-0.03em] text-ink">AquaVolt</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {standaloneItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#0071e3]/8 text-primary"
                    : "text-[#86868b] hover:text-ink hover:bg-[#0071e3]/5"
                }`}>
                <Icon className="w-4 h-4" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}

          {navGroups.map((group) => {
            const active = isGroupActive(group);
            const GroupIcon = group.icon;
            return (
              <div key={group.labelKey} ref={(el) => { groupRefs.current[group.labelKey] = el; }} className="relative">
                <button
                  onClick={() => setOpenGroup(openGroup === group.labelKey ? null : group.labelKey)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium transition-all whitespace-nowrap ${
                    active
                      ? "bg-[#0071e3]/8 text-primary"
                      : "text-[#86868b] hover:text-ink hover:bg-[#0071e3]/5"
                  }`}>
                  <GroupIcon className="w-4 h-4" />
                  <span>{t(group.labelKey)}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openGroup === group.labelKey ? "rotate-180" : ""}`} />
                </button>

                {openGroup === group.labelKey && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-[14px] shadow-xl border border-hairline py-2 overflow-hidden">
                    {group.items.map((item) => {
                      const isItemActive = pathname.startsWith(item.href);
                      const ItemIcon = item.icon;
                      return (
                        <Link key={item.href} href={item.href}
                          onClick={() => setOpenGroup(null)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors ${
                            isItemActive
                              ? "bg-[#0071e3]/8 text-primary font-medium"
                              : "text-[#86868b] hover:text-ink hover:bg-canvas-parchment"
                          }`}>
                          <ItemIcon className="w-4 h-4" />
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {(() => {
            const isActive = pathname.startsWith(settingsItem.href);
            const Icon = settingsItem.icon;
            return (
              <Link key={settingsItem.href} href={settingsItem.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#0071e3]/8 text-primary"
                    : "text-[#86868b] hover:text-ink hover:bg-[#0071e3]/5"
                }`}>
                <Icon className="w-4 h-4" />
                <span>{t(settingsItem.labelKey)}</span>
              </Link>
            );
          })()}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <GlobalSearch />
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-px h-5 bg-hairline" />
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-[13px] text-[#86868b] hover:text-ink transition-colors" title={t("nav.logout")}>
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">{t("nav.logout")}</span>
            </button>
          </div>
          <div className="w-px h-5 bg-hairline" />
          <LocaleSwitcher />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#86868b] hover:text-ink transition-colors p-1" aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-divider-soft shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-0.5">
            {standaloneItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors ${
                    isActive ? "bg-[#0071e3]/8 text-primary font-medium" : "text-[#86868b] hover:text-ink hover:bg-canvas-parchment/50"
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}

            {navGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.labelKey}>
                  <div className="flex items-center gap-2 px-3 py-2 mt-2 mb-0.5">
                    <GroupIcon className="w-3.5 h-3.5 text-[#86868b]" />
                    <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-[0.08em]">{t(group.labelKey)}</span>
                  </div>
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const ItemIcon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 pl-10 rounded-[10px] text-[14px] transition-colors ${
                          isActive ? "bg-[#0071e3]/8 text-primary font-medium" : "text-[#86868b] hover:text-ink hover:bg-canvas-parchment/50"
                        }`}>
                        <ItemIcon className="w-4 h-4" />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}

            {(() => {
              const isActive = pathname.startsWith(settingsItem.href);
              const Icon = settingsItem.icon;
              return (
                <div className="pt-2 mt-2 border-t border-divider-soft">
                  <Link href={settingsItem.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors ${
                      isActive ? "bg-[#0071e3]/8 text-primary font-medium" : "text-[#86868b] hover:text-ink hover:bg-canvas-parchment/50"
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span>{t(settingsItem.labelKey)}</span>
                  </Link>
                </div>
              );
            })()}

            <div className="border-t border-divider-soft pt-2 mt-2">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] text-[#86868b] hover:text-ink hover:bg-canvas-parchment/50 w-full transition-colors">
                <LogOut className="w-4 h-4" />
                <span>{t("nav.logout")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
