"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { fetchInvoice, fetchMeters, updateInvoice, createActivity } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { SubNav } from "@/components/layout/sub-nav";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useSettings } from "@/hooks/use-settings";
import { ArrowLeft, Printer, Send, CheckCircle, Droplets, Zap, Building2, Home, CreditCard, Landmark, User, Calendar, Smartphone, QrCode, Receipt, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { PromptPayQR } from "@/components/shared/promptpay-qr";
import type { Invoice, MeterReading } from "@/types";

export default function InvoiceDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [meterReadingsData, setMeterReadingsData] = useState<MeterReading[]>([]);

  const router = useRouter();
  const params = useParams();
  const { settings } = useSettings();
  const { waterRate, electricRate } = settings;

  useEffect(() => {
    const id = params.id;
    Promise.all([
      fetchInvoice(id as string),
      fetchMeters(),
    ]).then(([inv, metersData]) => {
      setInvoiceData(inv);
      setMeterReadingsData(metersData);
    }).catch((e) => console.warn("API:", e));
  }, [params.id]);

  const invoice = invoiceData;

  const meterReading = invoice
    ? meterReadingsData.find((m) => m.id === invoice.meterReadingId)
    : null;

  const [status, setStatus] = useState("pending");
  const [, setMarkingPaid] = useState(false);

  // Sync local status from loaded invoice data
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (invoice) setStatus(invoice.status);
  }, [invoice]);

  if (!invoice) {
    return (
      <div className="max-w-300 mx-auto px-6 py-10">
        <p className="text-zinc-500">{t("common.noData")}</p>
      </div>
    );
  }

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
      month: locale === "th" ? "long" : "short",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPaid = async () => {
    setMarkingPaid(true);
    try {
      const paidDate = new Date().toISOString();
      await updateInvoice(invoice.id, { status: "paid", paidDate });
      setStatus("paid");
      toast.success(t("toast.invoicePaid"));
      createActivity({ type: "invoice", action: "ชำระเงิน", detail: `${invoice.invoiceNumber} · ${invoice.tenantName} · ${formatCurrency(invoice.totalAmount)}` }).catch((e) => console.warn("activity:", e));
    } catch (e) {
      console.error("Failed to mark invoice as paid:", e);
    }
    setMarkingPaid(false);
  };

  return (
    <div>
      <SubNav title={t("invoices.title")}>
        <button
          onClick={() => router.push("/invoices")}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </button>
      </SubNav>

      {/* Normal View */}
      <div className="no-print">
        <div className="max-w-[800px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
          {/* ── Header: Invoice number + Actions ── */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#f0f7ff] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-[17px] font-bold text-ink">{invoice.invoiceNumber}</h1>
                <p className="text-xs text-[#86868b] mt-0.5">{getMonthName(invoice.month)} {invoice.year}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#6e6e73] bg-white border border-hairline rounded-full hover:bg-canvas-parchment active:scale-[0.97] transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                {t("invoices.print")}
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#06c755] rounded-full hover:bg-[#05b54c] active:scale-[0.97] transition-all">
                <Send className="w-3.5 h-3.5" />
                {t("invoices.sendLine")}
              </button>
              {status === "pending" && (
                <button
                  onClick={handleMarkPaid}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary rounded-full hover:bg-primary-focus active:scale-[0.97] transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t("invoices.markPaid")}
                </button>
              )}
            </div>
          </div>

          {/* ── Status Bar ── */}
          <div className={`rounded-md p-3 mb-6 flex items-center justify-between ${
            status === "paid" ? "bg-green-50" : status === "overdue" ? "bg-red-50" : "bg-amber-50"
          }`}>
            <div className="flex items-center gap-2.5 text-[13px]">
              <StatusBadge status={status} />
              {status === "pending" && <span className="text-[#6e6e73]">{t("invoices.dueDateLabel")}: {formatDate(invoice.dueDate, locale === "th" ? "th" : "en")}</span>}
              {status === "paid" && <span className="text-green-700 font-medium">{t("invoices.paidDate")}: {formatDate(invoice.paidDate || invoice.issuedDate, locale === "th" ? "th" : "en")}</span>}
              {/* eslint-disable-next-line react-hooks/purity -- overdue days needs current time */}
              {status === "overdue" && <span className="text-red-600">{t("invoices.overdueDaysCount", { days: Math.ceil((Date.now() - new Date(invoice.dueDate).getTime()) / (1000*60*60*24)) })}</span>}
            </div>
          </div>

          {/* ── Customer + Period Info ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-[14px] border border-divider-soft p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-canvas-parchment flex items-center justify-center">
                  <User className="w-5 h-5 text-[#6e6e73]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{invoice.tenantName}</p>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    {t("invoices.room")} {invoice.roomNumber} · {invoice.buildingName}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[14px] border border-divider-soft p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-canvas-parchment flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#6e6e73]" />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <span className="text-[#86868b]">{t("invoices.issueDate")}</span>
                  <span className="font-medium text-ink">{formatDate(invoice.issuedDate, locale === "th" ? "th" : "en")}</span>
                  <span className="text-[#86868b]">{t("invoices.dueDateLabel")}</span>
                  <span className="font-medium text-ink">{formatDate(invoice.dueDate, locale === "th" ? "th" : "en")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Meter Readings Card ── */}
          {meterReading && (
            <div className="bg-white rounded-[14px] border border-divider-soft p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-[13px] font-semibold text-ink">{t("meters.title")}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f8fbff] rounded-md p-3 border border-[#cce4ff]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Droplets className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-semibold text-primary">{t("meters.water")}</span>
                  </div>
                  <div className="flex gap-1 text-[10px] text-center">
                    <div className="flex-1"><p className="text-[#86868b]">← {t("invoices.printOld")}</p><p className="font-bold text-ink text-[11px]">{meterReading.waterPrevious}</p></div>
                    <div className="flex-1"><p className="text-[#86868b]">→ {t("invoices.printNew")}</p><p className="font-bold text-ink text-[11px]">{meterReading.waterCurrent}</p></div>
                    <div className="flex-1"><p className="text-primary font-semibold">{t("invoices.printUnit")}</p><p className="font-bold text-primary text-[11px]">{meterReading.waterUsage}</p></div>
                    <div className="flex-1"><p className="text-[#86868b]">{t("invoices.printRate")}</p><p className="font-bold text-ink text-[11px]">{waterRate}฿</p></div>
                  </div>
                </div>
                <div className="bg-[#fffdfa] rounded-md p-3 border border-[#ffe4b3]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-[#d97706]" />
                    <span className="text-[11px] font-semibold text-[#d97706]">{t("meters.electric")}</span>
                  </div>
                  <div className="flex gap-1 text-[10px] text-center">
                    <div className="flex-1"><p className="text-[#86868b]">← {t("invoices.printOld")}</p><p className="font-bold text-ink text-[11px]">{meterReading.electricPrevious}</p></div>
                    <div className="flex-1"><p className="text-[#86868b]">→ {t("invoices.printNew")}</p><p className="font-bold text-ink text-[11px]">{meterReading.electricCurrent}</p></div>
                    <div className="flex-1"><p className="text-[#d97706] font-semibold">{t("invoices.printUnit")}</p><p className="font-bold text-[#d97706] text-[11px]">{meterReading.electricUsage}</p></div>
                    <div className="flex-1"><p className="text-[#86868b]">{t("invoices.printRate")}</p><p className="font-bold text-ink text-[11px]">{electricRate}฿</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Charges Breakdown ── */}
          <div className="bg-white rounded-[14px] border border-divider-soft overflow-hidden">
            <div className="px-5 py-3.5 border-b border-divider-soft flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">{t("invoices.printItem")}</span>
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">{t("invoices.printAmount")}</span>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-[13px] text-ink">
                  <Home className="w-4 h-4 text-[#6e6e73]" />
                  {t("invoices.rentalCharge")}
                </span>
                <span className="text-[13px] font-semibold text-ink">{formatCurrency(invoice.rentalCost)}</span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-[13px] text-ink">
                  <Droplets className="w-4 h-4 text-primary" />
                  {t("invoices.waterCharge")}
                  <span className="text-[11px] text-[#86868b]">({meterReading?.waterUsage ?? "-"} m³ × {waterRate}฿)</span>
                </span>
                <span className="text-[13px] font-semibold text-ink">{formatCurrency(invoice.waterCost)}</span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-[13px] text-ink">
                  <Zap className="w-4 h-4 text-[#d97706]" />
                  {t("invoices.electricCharge")}
                  <span className="text-[11px] text-[#86868b]">({meterReading?.electricUsage ?? "-"} kWh × {electricRate}฿)</span>
                </span>
                <span className="text-[13px] font-semibold text-ink">{formatCurrency(invoice.electricCost)}</span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-[13px] text-ink">
                  <Building2 className="w-4 h-4 text-[#6e6e73]" />
                  {t("invoices.serviceCharge")}
                </span>
                <span className="text-[13px] font-semibold text-ink">{formatCurrency(invoice.serviceCharge)}</span>
              </div>
              {Number(invoice.wifiCost) > 0 && (
                <div className="px-5 py-3 flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-[13px] text-ink">
                    <span className="w-4 h-4 flex items-center justify-center font-bold text-[10px] text-primary">WiFi</span>
                    {t("invoices.wifiCharge")}
                  </span>
                  <span className="text-[13px] font-semibold text-ink">{formatCurrency(invoice.wifiCost || 0)}</span>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t-2 border-ink flex items-center justify-between bg-[#fafafa]">
              <span className="text-[15px] font-bold text-ink">{t("invoices.total")}</span>
              <span className="text-[18px] font-bold text-primary">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>

          {/* ── Payment Methods Card ── */}
          <div className="bg-white rounded-[14px] border border-divider-soft p-4 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="text-[13px] font-semibold text-ink">{t("invoices.printPaymentMethods")}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-canvas-parchment rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Landmark className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-ink">{settings.bankName}</span>
                </div>
                <p className="font-bold text-ink">{settings.bankAccount}</p>
                <p className="text-[#86868b]">{settings.accountName}</p>
              </div>
              <div className="bg-canvas-parchment rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Smartphone className="w-3.5 h-3.5 text-green-600" />
                  <span className="font-semibold text-ink">{t("invoices.printPromptpay")}</span>
                </div>
                <p className="font-bold text-ink">{settings.promptpayNumber}</p>
                <p className="text-[#86868b]">{t("invoices.printPhoneLabel")}</p>
              </div>
              <div className="bg-canvas-parchment rounded-md p-3 flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <QrCode className="w-3.5 h-3.5 text-ink" />
                  <span className="font-semibold text-ink">{t("invoices.printScanQR")}</span>
                </div>
                <PromptPayQR phoneNumber={settings.promptpayNumber} size={80} className="mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PRINT VIEW — Professional Bill (A4, 1 page) ===== */}
      <div className="print-only">
        <div className="max-w-[210mm] mx-auto" style={{ padding: "8mm 12mm" }}>
          {/* ── Top Accent Bar ── */}
          <div className="h-[2.5px] bg-primary w-full mb-4" style={{ borderRadius: "2px" }} />

          {/* ── Header ── */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-[18px] font-bold text-ink tracking-tight">{settings.dormitoryName}</h1>
              <p className="text-[9px] text-[#86868b] mt-0.5">{settings.dormitoryAddress}</p>
              {settings.phone && (
                <p className="text-[9px] text-[#86868b]">{t("invoices.printTel")} {settings.phone}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-[20px] font-bold text-ink tracking-tight">{t("invoices.invoiceTitle")}</h2>
              <p className="text-[10px] text-[#86868b] mt-0.5">
                {t("invoices.invoiceNumber")}:{" "}
                <span className="font-semibold text-ink">{invoice.invoiceNumber}</span>
              </p>
            </div>
          </div>

          <div className="border-t border-dashed border-surface-chip mb-4" />

          {/* ── Billing Info ── */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-canvas-parchment rounded p-2.5">
              <p className="text-[8px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                <User className="w-2.5 h-2.5 inline mr-1" />{t("invoices.tenant")}
              </p>
              <table className="w-full text-[10px]">
                <tbody>
                  <tr><td className="text-[#86868b] pr-2 py-0.5 w-[55px]">{t("invoices.printName")}</td><td className="font-semibold text-ink">{invoice.tenantName}</td></tr>
                  <tr><td className="text-[#86868b] pr-2 py-0.5">{t("invoices.printRoom")}</td><td className="font-semibold text-ink">{invoice.roomNumber}</td></tr>
                  <tr><td className="text-[#86868b] pr-2 py-0.5">{t("invoices.printBuilding")}</td><td className="font-semibold text-ink">{invoice.buildingName}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="bg-canvas-parchment rounded p-2.5">
              <p className="text-[8px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                <Calendar className="w-2.5 h-2.5 inline mr-1" />{t("invoices.printDetails")}
              </p>
              <table className="w-full text-[10px]">
                <tbody>
                  <tr><td className="text-[#86868b] pr-2 py-0.5 w-[55px]">{t("invoices.printMonth")}</td><td className="font-semibold text-ink">{getMonthName(invoice.month)} {invoice.year}</td></tr>
                  <tr><td className="text-[#86868b] pr-2 py-0.5">{t("invoices.printIssueDate")}</td><td className="font-semibold text-ink">{formatDate(invoice.issuedDate, locale === "th" ? "th" : "en")}</td></tr>
                  <tr><td className="text-[#86868b] pr-2 py-0.5">{t("invoices.printDueDate")}</td><td className="font-semibold text-ink">{formatDate(invoice.dueDate, locale === "th" ? "th" : "en")}</td></tr>
                  <tr><td className="text-[#86868b] pr-2 py-0.5">{t("invoices.printStatus")}</td><td className={`font-semibold ${status === "paid" ? "text-green-700" : "text-amber-700"}`}>{status === "paid" ? t("invoices.printPaid") : t("invoices.printPending")}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Meter Readings ── */}
          {meterReading && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border border-[#cce4ff] rounded p-2 bg-[#f8fbff]">
                <div className="flex items-center gap-1 mb-1.5">
                  <Droplets className="w-3 h-3 text-primary" />
                  <p className="text-[8px] font-semibold text-primary uppercase tracking-wider">{t("invoices.printWaterMeter")}</p>
                </div>
                <div className="flex text-[10px] text-center">
                  <div className="flex-1"><p className="text-[#86868b] text-[8px]">{t("invoices.printOld")}</p><p className="font-bold text-ink">{meterReading.waterPrevious}</p></div>
                  <div className="flex-1"><p className="text-[#86868b] text-[8px]">{t("invoices.printNew")}</p><p className="font-bold text-ink">{meterReading.waterCurrent}</p></div>
                  <div className="flex-1"><p className="text-[#86868b] text-[8px]">{t("invoices.printUnit")}</p><p className="font-bold text-primary">{meterReading.waterUsage}</p></div>
                  <div className="flex-1"><p className="text-[#86868b] text-[8px]">{t("invoices.printRate")}</p><p className="font-bold text-ink">{waterRate}</p></div>
                </div>
              </div>
              <div className="border border-[#ffe4b3] rounded p-2 bg-[#fffdfa]">
                <div className="flex items-center gap-1 mb-1.5">
                  <Zap className="w-3 h-3 text-[#d97706]" />
                  <p className="text-[8px] font-semibold text-[#d97706] uppercase tracking-wider">{t("invoices.printElectricMeter")}</p>
                </div>
                <div className="flex text-[10px] text-center">
                  <div className="flex-1"><p className="text-[#86868b] text-[8px]">{t("invoices.printOld")}</p><p className="font-bold text-ink">{meterReading.electricPrevious}</p></div>
                  <div className="flex-1"><p className="text-[#86868b] text-[8px]">{t("invoices.printNew")}</p><p className="font-bold text-ink">{meterReading.electricCurrent}</p></div>
                  <div className="flex-1"><p className="text-[#86868b] text-[8px]">{t("invoices.printUnit")}</p><p className="font-bold text-[#d97706]">{meterReading.electricUsage}</p></div>
                  <div className="flex-1"><p className="text-[#86868b] text-[8px]">{t("invoices.printRate")}</p><p className="font-bold text-ink">{electricRate}</p></div>
                </div>
              </div>
            </div>
          )}

          {/* ── Charges Table ── */}
          <table className="w-full text-[10px] mb-3" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #1d1d1f" }}>
                <th className="text-left pb-1.5 font-bold text-ink text-[9px] uppercase tracking-wider" style={{ width: "50%" }}>{t("invoices.printItem")}</th>
                <th className="text-center pb-1.5 font-bold text-ink text-[9px] uppercase tracking-wider" style={{ width: "15%" }}>{t("invoices.printQty")}</th>
                <th className="text-right pb-1.5 font-bold text-ink text-[9px] uppercase tracking-wider" style={{ width: "17%" }}>{t("invoices.printRate")}</th>
                <th className="text-right pb-1.5 font-bold text-ink text-[9px] uppercase tracking-wider" style={{ width: "18%" }}>{t("invoices.printAmount")}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td className="py-1.5 text-ink"><Home className="w-3 h-3 inline mr-1 text-[#6e6e73]" />{t("invoices.rentalCharge")}</td>
                <td className="py-1.5 text-center text-[#86868b]">{t("invoices.printOneMonth")}</td>
                <td className="py-1.5 text-right text-[#86868b]">{formatCurrency(invoice.rentalCost)}</td>
                <td className="py-1.5 text-right font-semibold text-ink">{formatCurrency(invoice.rentalCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td className="py-1.5 text-ink"><Droplets className="w-3 h-3 inline mr-1 text-primary" />{t("invoices.waterCharge")}</td>
                <td className="py-1.5 text-center text-[#86868b]">{meterReading?.waterUsage ?? "-"} m³</td>
                <td className="py-1.5 text-right text-[#86868b]">{formatCurrency(waterRate)}/m³</td>
                <td className="py-1.5 text-right font-semibold text-ink">{formatCurrency(invoice.waterCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td className="py-1.5 text-ink"><Zap className="w-3 h-3 inline mr-1 text-[#d97706]" />{t("invoices.electricCharge")}</td>
                <td className="py-1.5 text-center text-[#86868b]">{meterReading?.electricUsage ?? "-"} kWh</td>
                <td className="py-1.5 text-right text-[#86868b]">{formatCurrency(electricRate)}/kWh</td>
                <td className="py-1.5 text-right font-semibold text-ink">{formatCurrency(invoice.electricCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td className="py-1.5 text-ink"><Building2 className="w-3 h-3 inline mr-1 text-[#6e6e73]" />{t("invoices.serviceCharge")}</td>
                <td className="py-1.5 text-center text-[#86868b]">{t("invoices.printOneMonth")}</td>
                <td className="py-1.5 text-right text-[#86868b]">{formatCurrency(invoice.serviceCharge)}</td>
                <td className="py-1.5 text-right font-semibold text-ink">{formatCurrency(invoice.serviceCharge)}</td>
              </tr>
              {Number(invoice.wifiCost) > 0 && (
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td className="py-1.5 text-ink"><span className="w-3 h-3 inline mr-1 text-primary font-bold text-[8px]">WiFi</span>{t("invoices.wifiCharge")}</td>
                  <td className="py-1.5 text-center text-[#86868b]">{t("invoices.printOneMonth")}</td>
                  <td className="py-1.5 text-right text-[#86868b]">{formatCurrency(invoice.wifiCost || 0)}</td>
                  <td className="py-1.5 text-right font-semibold text-ink">{formatCurrency(invoice.wifiCost || 0)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-1.5 text-right font-bold text-[13px] text-ink">{t("invoices.printTotalDue")}</td>
                <td className="pt-1.5 text-right font-bold text-[15px] text-primary" style={{ borderTop: "2px solid #0066cc" }}>{formatCurrency(invoice.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* ── Payment Information ── */}
          <div className="bg-canvas-parchment rounded p-2.5 mb-3">
            <p className="text-[8px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <CreditCard className="w-2.5 h-2.5" />{t("invoices.printPaymentMethods")}
            </p>
            <div className="grid grid-cols-3 gap-3 text-[9px]">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <Landmark className="w-3 h-3 text-primary" />
                  <p className="font-semibold text-ink">{settings.bankName}</p>
                </div>
                <p className="font-bold text-ink mt-0.5">{settings.bankAccount}</p>
                <p className="text-[#86868b]">{settings.accountName}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <Smartphone className="w-3 h-3 text-green-600" />
                  <p className="font-semibold text-ink">{t("invoices.printPromptpay")}</p>
                </div>
                <p className="font-bold text-ink mt-0.5">{settings.promptpayNumber}</p>
                <p className="text-[#86868b]">{t("invoices.printPhoneLabel")}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-0.5">
                  <QrCode className="w-3 h-3 text-ink" />
                  <p className="font-semibold text-ink">{t("invoices.printScanQR")}</p>
                </div>
                <PromptPayQR phoneNumber={settings.promptpayNumber} size={60} className="mt-0.5" />
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="text-[8px] text-[#86868b] mb-3 leading-relaxed">
            <p>{t("invoices.printNote1")}</p>
            <p>{t("invoices.printNote2")}</p>
          </div>

          <div className="border-t border-dashed border-surface-chip mb-3" />

          {/* ── Footer ── */}
          <div className="flex justify-between items-center text-[8px] text-[#a1a1a6]">
            <p>{settings.dormitoryName} · {t("app.tagline")}</p>
            <p className="text-right">{t("invoices.printAutoGen")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
