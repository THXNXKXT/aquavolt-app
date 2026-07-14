"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  vacant: "bg-blue-50 text-blue-700 border-blue-200",
  occupied: "bg-green-50 text-green-700 border-green-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-[#f5f5f7] text-[#86868b] border-divider-soft",
  active: "bg-green-50 text-green-700 border-green-200",
  inactive: "bg-[#f5f5f7] text-[#86868b] border-divider-soft",
};

// Map status key → i18n key
const statusLabels: Record<string, string> = {
  vacant: "rooms.vacant",
  occupied: "rooms.occupied",
  maintenance: "rooms.maintenance",
  pending: "invoices.pending",
  paid: "invoices.paid",
  overdue: "invoices.overdue",
  cancelled: "invoices.cancelled",
  active: "tenants.status.active",
  inactive: "tenants.status.inactive",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations();
  const label = statusLabels[status] ? t(statusLabels[status]) : status;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
        statusStyles[status] || "bg-[#f5f5f7] text-[#86868b] border-divider-soft",
        className
      )}
    >
      {label}
    </span>
  );
}
