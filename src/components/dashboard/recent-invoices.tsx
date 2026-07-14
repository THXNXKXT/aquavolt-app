"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceItem {
  id: string;
  roomNumber: string;
  tenantName: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  issuedDate?: string;
  createdAt?: string;
}

interface RecentInvoicesProps {
  invoices: InvoiceItem[];
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const t = useTranslations();
  const router = useRouter();

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const aDate = new Date(a.issuedDate || a.createdAt || "").getTime();
      const bDate = new Date(b.issuedDate || b.createdAt || "").getTime();
      return bDate - aDate;
    });
  }, [invoices]);

  return (
    <div className="bg-white rounded-[14px] px-4 pt-4 pb-5 border border-divider-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[#86868b]">
          {t("dashboard.recentInvoices")}
        </h3>
        <button
          onClick={() => router.push("/invoices")}
          className="text-[11px] text-primary hover:text-primary-focus transition-colors font-medium flex items-center gap-1"
        >
          {t("dashboard.viewAll")}
        </button>
      </div>
      {sortedInvoices.length > 0 ? (
        <div className="space-y-1">
          {sortedInvoices.slice(0, 5).map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 py-2 hover:bg-canvas-parchment/50 rounded-[8px] px-2 -mx-2 transition-colors cursor-pointer"
              onClick={() => router.push(`/invoices/${inv.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-ink truncate">
                  {inv.roomNumber} · {inv.tenantName}
                </p>
                <p className="text-[10px] text-[#86868b]">{inv.invoiceNumber}</p>
              </div>
              <p className="text-[11px] font-semibold tabular-nums text-ink">
                {formatCurrency(inv.totalAmount)}
              </p>
              <StatusBadge status={inv.status} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-[11px] text-[#86868b]">{t("invoices.noInvoices")}</p>
        </div>
      )}
    </div>
  );
}
