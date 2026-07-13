"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
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
    <div className="lg:col-span-2 bg-white rounded-[14px] border border-divider-soft overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-divider-soft">
        <h3 className="text-[13px] font-semibold text-ink">
          {t("dashboard.recentInvoices")}
        </h3>
        <button
          onClick={() => router.push("/invoices")}
          className="text-[11px] text-primary hover:text-primary-focus transition-colors font-medium flex items-center gap-1"
        >
          {t("dashboard.viewAll")} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      {sortedInvoices.length > 0 ? (
        <div className="divide-y divide-divider-soft">
          {sortedInvoices.slice(0, 5).map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas-parchment/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/invoices/${inv.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink truncate">
                  {inv.roomNumber} · {inv.tenantName}
                </p>
                <p className="text-[10px] text-[#86868b]">{inv.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-ink">
                  {formatCurrency(inv.totalAmount)}
                </p>
              </div>
              <StatusBadge status={inv.status} />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-xs text-[#86868b]">
          {t("invoices.noInvoices")}
        </div>
      )}
    </div>
  );
}
