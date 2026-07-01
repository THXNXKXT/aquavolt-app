"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { Invoice } from "@/types";

interface OverdueAlertProps {
  overdueInvoices: Invoice[];
  maxDaysOverdue: number;
}

export function OverdueAlert({ overdueInvoices, maxDaysOverdue }: OverdueAlertProps) {
  const t = useTranslations();
  const router = useRouter();

  if (overdueInvoices.length === 0) return null;

  const totalOverdueAmount = overdueInvoices.reduce(
    (sum: number, inv: Invoice) =>
      sum +
      Number(inv.rentalCost || 0) +
      Number(inv.waterCost || 0) +
      Number(inv.electricCost || 0) +
      Number(inv.serviceCharge || 0),
    0
  );

  return (
    <div className="bg-red-50 rounded-[14px] p-4 border border-red-200 mb-8">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-red-100 shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-[13px] font-semibold text-red-800">
                {t("dashboard.overdueTitle")}
              </h3>
              <p className="text-[11px] text-red-600 mt-0.5">
                {t("dashboard.overdueDesc", {
                  count: overdueInvoices.length,
                  days: maxDaysOverdue,
                })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[18px] font-bold text-red-700">
                {formatCurrency(totalOverdueAmount)}
              </p>
              <button
                onClick={() => router.push("/invoices?status=overdue")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 transition-colors mt-0.5"
              >
                {t("dashboard.viewOverdue")}{" "}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
