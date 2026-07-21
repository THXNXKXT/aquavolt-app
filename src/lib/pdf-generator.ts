import jsPDF from "jspdf";
import type { Invoice, MeterReading } from "@/types";

interface PDFSettings {
  dormitoryName: string;
  dormitoryAddress: string;
  phone: string;
}

export function generateInvoicePDF(
  invoice: Invoice,
  meterReading: MeterReading | null,
  settings: PDFSettings,
  locale: "en" | "th",
  getMonthName: (m: number) => string,
  formatCurrency: (n: number) => string,
  formatDate: (d: string, l: string) => string,
  waterRate: number,
  electricRate: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, opts?: any) => string,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 15; // margin
  let y = 0;

  const ink: [number, number, number] = [29, 29, 31];
  const muted: [number, number, number] = [134, 134, 139];
  const primary: [number, number, number] = [0, 113, 227];
  const line: [number, number, number] = [227, 227, 230];

  // ── Header ──
  doc.setFontSize(18);
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.text(settings.dormitoryName || "AquaVolt", M, (y += 18));

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.text(settings.dormitoryAddress || "", M, (y += 6));
  if (settings.phone) doc.text(`${t("invoices.printTel")} ${settings.phone}`, M, (y += 4));

  doc.setFontSize(14);
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.text(t("invoices.invoiceTitle"), W - M, 18, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoiceNumber, W - M, 24, { align: "right" });

  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.line(M, (y += 10), W - M, y);

  // ── Tenant info ──
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.text(t("invoices.printBillTo"), M, y);

  const tenantRows = [
    [t("invoices.printName"), invoice.tenantName || "-"],
    [t("invoices.printRoom"), invoice.roomNumber || "-"],
    [t("invoices.printBuilding"), invoice.buildingName || "-"],
  ];
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  y += 5;
  for (const [label, val] of tenantRows) {
    doc.setTextColor(...muted);
    doc.text(label, M, y);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.text(String(val), M + 30, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  }

  // ── Billing period (right column) ──
  let yr = y - 15;
  doc.setFontSize(8);
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.text(t("invoices.printDetails"), W - M - 70, yr);

  const detailRows = [
    [t("invoices.printMonth"), `${getMonthName(invoice.month)} ${invoice.year}`],
    [t("invoices.printIssueDate"), formatDate(invoice.issuedDate, locale)],
    [t("invoices.printDueDate"), formatDate(invoice.dueDate, locale)],
  ];
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  yr += 5;
  for (const [label, val] of detailRows) {
    doc.setTextColor(...muted);
    doc.text(label, W - M - 70, yr);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.text(val, W - M, yr, { align: "right" });
    doc.setFont("helvetica", "normal");
    yr += 5;
  }

  // ── Meter readings ──
  if (meterReading) {
    y += 5;
    doc.setDrawColor(...line);
    doc.line(M, y, W - M, y);
    y += 8;

    const meters = [
      {
        label: t("invoices.printWaterMeter"),
        prev: meterReading.waterPrevious,
        curr: meterReading.waterCurrent,
        usage: meterReading.waterUsage,
        rate: waterRate,
        color: primary,
      },
      {
        label: t("invoices.printElectricMeter"),
        prev: meterReading.electricPrevious,
        curr: meterReading.electricCurrent,
        usage: meterReading.electricUsage,
        rate: electricRate,
        color: [217, 119, 6] as [number, number, number],
      },
    ];

    for (const m of meters) {
      doc.setFontSize(8);
      doc.setTextColor(...m.color);
      doc.setFont("helvetica", "bold");
      doc.text(m.label, M, y);

      const cols = [
        { label: t("invoices.printOld"), val: m.prev },
        { label: t("invoices.printNew"), val: m.curr },
        { label: t("invoices.printUnit"), val: m.usage },
        { label: t("invoices.printRate"), val: `${m.rate}฿` },
      ];
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      let x = M;
      const colW = (W - 2 * M) / 4;
      for (const c of cols) {
        doc.setTextColor(...muted);
        doc.text(c.label, x + 2, y + 5);
        doc.setTextColor(...ink);
        doc.setFont("helvetica", "bold");
        doc.text(String(c.val), x + 2, y + 10);
        doc.setFont("helvetica", "normal");
        x += colW;
      }
      y += 15;
    }
  }

  // ── Line items table ──
  y += 3;
  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.text(t("invoices.printItem"), M, y);
  doc.text(t("invoices.printQty"), M + 100, y, { align: "center" });
  doc.text(t("invoices.printRate"), M + 135, y, { align: "right" });
  doc.text(t("invoices.printAmount"), W - M, y, { align: "right" });

  y += 4;
  doc.line(M, y, W - M, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const items = [
    { label: t("invoices.rentalCharge"), amount: Number(invoice.rentalCost) || 0 },
    { label: t("invoices.waterCharge"), amount: Number(invoice.waterCost) || 0 },
    { label: t("invoices.electricCharge"), amount: Number(invoice.electricCost) || 0 },
    { label: t("invoices.serviceCharge"), amount: Number(invoice.serviceCharge) || 0 },
    { label: t("invoices.wifiCharge") || "WiFi", amount: Number(invoice.wifiCost) || 0 },
  ];

  for (const item of items) {
    if (item.amount === 0) continue;
    doc.setTextColor(...ink);
    doc.text(item.label, M, y);
    doc.text("1", M + 100, y, { align: "center" });
    doc.text(formatCurrency(item.amount), M + 135, y, { align: "right" });
    doc.text(formatCurrency(item.amount), W - M, y, { align: "right" });
    y += 6;
  }

  // Total
  y += 2;
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.8);
  doc.line(M, y, W - M, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ink);
  doc.text(t("invoices.printTotalDue"), W - M - 50, y);
  doc.setTextColor(...primary);
  doc.setFontSize(12);
  doc.text(formatCurrency(Number(invoice.totalAmount) || 0), W - M, y, { align: "right" });

  // ── Footer ──
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.text(t("invoices.printAutoGen"), W - M, 285, { align: "right" });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
