import jsPDF from "jspdf";
import type { Invoice, MeterReading } from "@/types";

interface PDFSettings {
  dormitoryName: string;
  dormitoryAddress: string;
  phone: string;
}

let fontCache: { regular: string; bold: string } | null = null;

async function loadFonts(): Promise<{ regular: string; bold: string }> {
  if (fontCache) return fontCache;
  const [regRes, boldRes] = await Promise.all([
    fetch("/fonts/Sarabun-Regular.ttf"),
    fetch("/fonts/Sarabun-Bold.ttf"),
  ]);
  const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
  fontCache = {
    regular: arrayBufferToBase64(regBuf),
    bold: arrayBufferToBase64(boldBuf),
  };
  return fontCache;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]);
  }
  return btoa(binary);
}

export async function generateInvoicePDF(
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
  const fonts = await loadFonts();
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Embed Sarabun (supports Thai + Latin)
  doc.addFileToVFS("Sarabun.ttf", fonts.regular);
  doc.addFont("Sarabun.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", fonts.bold);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  const W = 210;
  const M = 15;
  let y = 0;

  const ink: [number, number, number] = [29, 29, 31];
  const muted: [number, number, number] = [134, 134, 139];
  const primary: [number, number, number] = [0, 113, 227];
  const line: [number, number, number] = [227, 227, 230];

  const setFont = (style: "normal" | "bold", size: number, color: [number, number, number] = ink) => {
    doc.setFont("Sarabun", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  // ── Header ──
  setFont("bold", 18);
  doc.text(settings.dormitoryName || "AquaVolt", M, (y += 18));

  setFont("normal", 8, muted);
  doc.text(settings.dormitoryAddress || "", M, (y += 6));
  if (settings.phone) doc.text(`${t("invoices.printTel")} ${settings.phone}`, M, (y += 4));

  setFont("bold", 14);
  doc.text(t("invoices.invoiceTitle"), W - M, 18, { align: "right" });

  setFont("normal", 9);
  doc.text(invoice.invoiceNumber, W - M, 24, { align: "right" });

  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.line(M, (y += 10), W - M, y);

  // ── Tenant info ──
  y += 8;
  setFont("bold", 8, primary);
  doc.text(t("invoices.printBillTo"), M, y);

  const tenantRows: [string, string][] = [
    [t("invoices.printName"), String(invoice.tenantName || "-")],
    [t("invoices.printRoom"), String(invoice.roomNumber || "-")],
    [t("invoices.printBuilding"), String(invoice.buildingName || "-")],
  ];
  y += 5;
  for (const [label, val] of tenantRows) {
    setFont("normal", 9, muted);
    doc.text(label, M, y);
    setFont("bold", 9);
    doc.text(val, M + 30, y);
    y += 5;
  }

  // ── Billing details (right column) ──
  let yr = y - 15;
  setFont("bold", 8, primary);
  doc.text(t("invoices.printDetails"), W - M - 70, yr);

  const detailRows: [string, string][] = [
    [t("invoices.printMonth"), `${getMonthName(invoice.month)} ${invoice.year}`],
    [t("invoices.printIssueDate"), formatDate(invoice.issuedDate, locale)],
    [t("invoices.printDueDate"), formatDate(invoice.dueDate, locale)],
  ];
  yr += 5;
  for (const [label, val] of detailRows) {
    setFont("normal", 9, muted);
    doc.text(label, W - M - 70, yr);
    setFont("bold", 9);
    doc.text(val, W - M, yr, { align: "right" });
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
        prev: String(meterReading.waterPrevious ?? "-"),
        curr: String(meterReading.waterCurrent ?? "-"),
        usage: String(meterReading.waterUsage ?? "-"),
        rate: `${waterRate}฿`,
        color: primary,
      },
      {
        label: t("invoices.printElectricMeter"),
        prev: String(meterReading.electricPrevious ?? "-"),
        curr: String(meterReading.electricCurrent ?? "-"),
        usage: String(meterReading.electricUsage ?? "-"),
        rate: `${electricRate}฿`,
        color: [217, 119, 6] as [number, number, number],
      },
    ];

    for (const m of meters) {
      setFont("bold", 8, m.color);
      doc.text(m.label, M, y);

      const cols = [
        { label: t("invoices.printOld"), val: m.prev },
        { label: t("invoices.printNew"), val: m.curr },
        { label: t("invoices.printUnit"), val: m.usage },
        { label: t("invoices.printRate"), val: m.rate },
      ];
      let x = M;
      const colW = (W - 2 * M) / 4;
      for (const c of cols) {
        setFont("normal", 9, muted);
        doc.text(c.label, x + 2, y + 5);
        setFont("bold", 9);
        doc.text(c.val, x + 2, y + 10);
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

  setFont("bold", 8, muted);
  doc.text(t("invoices.printItem"), M, y);
  doc.text(t("invoices.printQty"), M + 100, y, { align: "center" });
  doc.text(t("invoices.printRate"), M + 135, y, { align: "right" });
  doc.text(t("invoices.printAmount"), W - M, y, { align: "right" });

  y += 4;
  doc.line(M, y, W - M, y);
  y += 6;

  setFont("normal", 9);

  const items = [
    { label: t("invoices.rentalCharge"), amount: Number(invoice.rentalCost) || 0 },
    { label: t("invoices.waterCharge"), amount: Number(invoice.waterCost) || 0 },
    { label: t("invoices.electricCharge"), amount: Number(invoice.electricCost) || 0 },
    { label: t("invoices.serviceCharge"), amount: Number(invoice.serviceCharge) || 0 },
    { label: t("invoices.wifiCharge") || "WiFi", amount: Number(invoice.wifiCost) || 0 },
  ];

  for (const item of items) {
    if (item.amount === 0) continue;
    setFont("normal", 9);
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

  setFont("bold", 10);
  doc.text(t("invoices.printTotalDue"), W - M - 50, y);
  setFont("bold", 12, primary);
  doc.text(formatCurrency(Number(invoice.totalAmount) || 0), W - M, y, { align: "right" });

  // Footer
  setFont("normal", 7, muted);
  doc.text(t("invoices.printAutoGen"), W - M, 285, { align: "right" });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
