"use client";

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { Invoice, MeterReading } from "@/types";

Font.register({
  family: "Sukhumvit",
  fonts: [
    { src: "/fonts/SukhumvitSet-Text.ttf", fontWeight: 400 },
    { src: "/fonts/SukhumvitSet-Bold.ttf", fontWeight: 700 },
  ],
});

// ponytail: mirror print template exactly — same colors, same structure, same spacing
const s = StyleSheet.create({
  page: { fontFamily: "Sukhumvit", fontSize: 9, color: "#1d1d1f", padding: "8mm 12mm", lineHeight: 1.4 },
  accentBar: { height: 2.5, backgroundColor: "#0071e3", marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  h1: { fontSize: 18, fontWeight: 700, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: 700, letterSpacing: -0.3 },
  muted9: { fontSize: 9, color: "#86868b" },
  muted8: { fontSize: 8, color: "#86868b" },
  muted7: { fontSize: 7, color: "#86868b" },
  bold9: { fontSize: 9, fontWeight: 700 },
  bold10: { fontSize: 10, fontWeight: 700 },
  label8: { fontSize: 8, fontWeight: 700, color: "#86868b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 },
  dashed: { borderBottomWidth: 0.5, borderBottomStyle: "dashed", borderBottomColor: "#d2d2d7", marginBottom: 12 },
  solid: { borderBottomWidth: 0.5, borderBottomColor: "#e0e0e0" },
  twoCol: { flexDirection: "row", gap: 12, marginBottom: 12 },
  panel: { flex: 1, backgroundColor: "#fbfbfd", borderRadius: 3, padding: 8 },
  row: { flexDirection: "row", marginBottom: 2 },
  rowLabel: { width: 50, color: "#86868b", fontSize: 10 },
  rowVal: { fontWeight: 700, fontSize: 10 },
  meterGrid: { flexDirection: "row", gap: 10, marginBottom: 12 },
  meterBox: { flex: 1, borderWidth: 1, borderRadius: 3, padding: 6 },
  meterWater: { borderColor: "#cce4ff", backgroundColor: "#f8fbff" },
  meterElec: { borderColor: "#ffe4b3", backgroundColor: "#fffdfa" },
  meterTitle: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  meterVals: { flexDirection: "row" },
  meterCol: { flex: 1, alignItems: "center" },
  meterColLabel: { fontSize: 8, color: "#86868b" },
  meterColVal: { fontSize: 10, fontWeight: 700 },
  th: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, paddingBottom: 4 },
  td: { fontSize: 10, paddingVertical: 3 },
  tfootLabel: { fontSize: 13, fontWeight: 700 },
  tfootVal: { fontSize: 15, fontWeight: 700, color: "#0071e3" },
  totalBorder: { borderTopWidth: 2, borderTopColor: "#0071e3", paddingTop: 4 },
  payPanel: { backgroundColor: "#fbfbfd", borderRadius: 3, padding: 8, marginBottom: 10 },
  payGrid: { flexDirection: "row", gap: 12 },
  payCol: { flex: 1 },
  payLabel: { fontSize: 9, fontWeight: 700 },
  payBold: { fontSize: 9, fontWeight: 700, marginTop: 2 },
  payMuted: { fontSize: 9, color: "#86868b" },
  notes: { fontSize: 8, color: "#86868b", marginBottom: 10, lineHeight: 1.6 },
  footer: { flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#86868b" },
});

interface InvoicePDFProps {
  invoice: Invoice;
  meterReading: MeterReading | null;
  settings: { dormitoryName: string; dormitoryAddress: string; phone: string; bankName?: string; bankAccount?: string; accountName?: string; promptpayNumber?: string };
  locale: "en" | "th";
  getMonthName: (m: number) => string;
  formatCurrency: (n: number) => string;
  formatDate: (d: string, l: string) => string;
  waterRate: number;
  electricRate: number;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, opts?: any) => string;
}

export function InvoicePDF({ invoice, meterReading, settings, locale, getMonthName, formatCurrency, formatDate, waterRate, electricRate, status, t }: InvoicePDFProps) {
  const rows = [
    { label: t("invoices.rentalCharge"), qty: t("invoices.printOneMonth"), rate: formatCurrency(Number(invoice.rentalCost) || 0), amount: formatCurrency(Number(invoice.rentalCost) || 0), show: Number(invoice.rentalCost) > 0 },
    { label: t("invoices.waterCharge"), qty: meterReading?.waterUsage ? `${meterReading.waterUsage} m³` : "-", rate: `${formatCurrency(waterRate)}/m³`, amount: formatCurrency(Number(invoice.waterCost) || 0), show: Number(invoice.waterCost) > 0 },
    { label: t("invoices.electricCharge"), qty: meterReading?.electricUsage ? `${meterReading.electricUsage} kWh` : "-", rate: `${formatCurrency(electricRate)}/kWh`, amount: formatCurrency(Number(invoice.electricCost) || 0), show: Number(invoice.electricCost) > 0 },
    { label: t("invoices.serviceCharge"), qty: t("invoices.printOneMonth"), rate: formatCurrency(Number(invoice.serviceCharge) || 0), amount: formatCurrency(Number(invoice.serviceCharge) || 0), show: Number(invoice.serviceCharge) > 0 },
    { label: t("invoices.wifiCharge") || "WiFi", qty: t("invoices.printOneMonth"), rate: formatCurrency(Number(invoice.wifiCost) || 0), amount: formatCurrency(Number(invoice.wifiCost) || 0), show: Number(invoice.wifiCost) > 0 },
  ].filter(r => r.show);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Accent Bar */}
        <View style={s.accentBar} />

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.h1}>{settings.dormitoryName}</Text>
            <Text style={[s.muted9, { marginTop: 2 }]}>{settings.dormitoryAddress}</Text>
            {settings.phone && <Text style={s.muted9}>{t("invoices.printTel")} {settings.phone}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.h2}>{t("invoices.invoiceTitle")}</Text>
            <Text style={[s.muted9, { marginTop: 2 }]}>{t("invoices.invoiceNumber")}: <Text style={{ fontWeight: 700, color: "#1d1d1f" }}>{invoice.invoiceNumber}</Text></Text>
          </View>
        </View>

        <View style={s.dashed} />

        {/* Billing Info — two panels */}
        <View style={s.twoCol}>
          {/* Tenant */}
          <View style={s.panel}>
            <Text style={s.label8}>{t("invoices.tenant")}</Text>
            <View style={s.row}><Text style={s.rowLabel}>{t("invoices.printName")}</Text><Text style={s.rowVal}>{String(invoice.tenantName || "-")}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>{t("invoices.printRoom")}</Text><Text style={s.rowVal}>{String(invoice.roomNumber || "-")}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>{t("invoices.printBuilding")}</Text><Text style={s.rowVal}>{String(invoice.buildingName || "-")}</Text></View>
          </View>
          {/* Details */}
          <View style={s.panel}>
            <Text style={s.label8}>{t("invoices.printDetails")}</Text>
            <View style={s.row}><Text style={s.rowLabel}>{t("invoices.printMonth")}</Text><Text style={s.rowVal}>{getMonthName(invoice.month)} {invoice.year}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>{t("invoices.printIssueDate")}</Text><Text style={s.rowVal}>{formatDate(invoice.issuedDate, locale)}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>{t("invoices.printDueDate")}</Text><Text style={s.rowVal}>{formatDate(invoice.dueDate, locale)}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>{t("invoices.printStatus")}</Text><Text style={[s.rowVal, { color: status === "paid" ? "#15803d" : "#b45309" }]}>{status === "paid" ? t("invoices.printPaid") : t("invoices.printPending")}</Text></View>
          </View>
        </View>

        {/* Meter Readings */}
        {meterReading && (
          <View style={s.meterGrid}>
            {/* Water */}
            <View style={[s.meterBox, s.meterWater]}>
              <Text style={[s.meterTitle, { color: "#0071e3" }]}>{t("invoices.printWaterMeter")}</Text>
              <View style={s.meterVals}>
                <View style={s.meterCol}><Text style={s.meterColLabel}>{t("invoices.printOld")}</Text><Text style={s.meterColVal}>{String(meterReading.waterPrevious ?? "-")}</Text></View>
                <View style={s.meterCol}><Text style={s.meterColLabel}>{t("invoices.printNew")}</Text><Text style={s.meterColVal}>{String(meterReading.waterCurrent ?? "-")}</Text></View>
                <View style={s.meterCol}><Text style={s.meterColLabel}>{t("invoices.printUnit")}</Text><Text style={[s.meterColVal, { color: "#0071e3" }]}>{String(meterReading.waterUsage ?? "-")}</Text></View>
                <View style={s.meterCol}><Text style={s.meterColLabel}>{t("invoices.printRate")}</Text><Text style={s.meterColVal}>{waterRate}</Text></View>
              </View>
            </View>
            {/* Electric */}
            <View style={[s.meterBox, s.meterElec]}>
              <Text style={[s.meterTitle, { color: "#d97706" }]}>{t("invoices.printElectricMeter")}</Text>
              <View style={s.meterVals}>
                <View style={s.meterCol}><Text style={s.meterColLabel}>{t("invoices.printOld")}</Text><Text style={s.meterColVal}>{String(meterReading.electricPrevious ?? "-")}</Text></View>
                <View style={s.meterCol}><Text style={s.meterColLabel}>{t("invoices.printNew")}</Text><Text style={s.meterColVal}>{String(meterReading.electricCurrent ?? "-")}</Text></View>
                <View style={s.meterCol}><Text style={s.meterColLabel}>{t("invoices.printUnit")}</Text><Text style={[s.meterColVal, { color: "#d97706" }]}>{String(meterReading.electricUsage ?? "-")}</Text></View>
                <View style={s.meterCol}><Text style={s.meterColLabel}>{t("invoices.printRate")}</Text><Text style={s.meterColVal}>{electricRate}</Text></View>
              </View>
            </View>
          </View>
        )}

        {/* Charges Table */}
        <View style={[s.solid, { borderBottomWidth: 1.5, borderBottomColor: "#1d1d1f", paddingBottom: 4, marginBottom: 0 }]}>
          <View style={{ flexDirection: "row" }}>
            <Text style={[s.th, { flex: 2 }]}>{t("invoices.printItem")}</Text>
            <Text style={[s.th, { width: 40, textAlign: "center" }]}>{t("invoices.printQty")}</Text>
            <Text style={[s.th, { width: 50, textAlign: "right" }]}>{t("invoices.printRate")}</Text>
            <Text style={[s.th, { width: 55, textAlign: "right" }]}>{t("invoices.printAmount")}</Text>
          </View>
        </View>
        {rows.map((r, i) => (
          <View key={i} style={[s.solid, { flexDirection: "row" }]}>
            <Text style={[s.td, { flex: 2 }]}>{r.label}</Text>
            <Text style={[s.td, { width: 40, textAlign: "center", color: "#86868b" }]}>{r.qty}</Text>
            <Text style={[s.td, { width: 50, textAlign: "right", color: "#86868b" }]}>{r.rate}</Text>
            <Text style={[s.td, { width: 55, textAlign: "right", fontWeight: 700 }]}>{r.amount}</Text>
          </View>
        ))}
        {/* Total */}
        <View style={[s.totalBorder, { flexDirection: "row" }]}>
          <Text style={[s.tfootLabel, { flex: 2.95, textAlign: "right" }]}>{t("invoices.printTotalDue")}</Text>
          <Text style={[s.tfootVal, { width: 55, textAlign: "right" }]}>{formatCurrency(Number(invoice.totalAmount) || 0)}</Text>
        </View>

        {/* Payment */}
        <View style={[s.payPanel, { marginTop: 12 }]}>
          <Text style={s.label8}>{t("invoices.printPaymentMethods")}</Text>
          <View style={s.payGrid}>
            {settings.bankAccount && (
              <View style={s.payCol}>
                <Text style={s.payLabel}>{settings.bankName}</Text>
                <Text style={s.payBold}>{settings.bankAccount}</Text>
                <Text style={s.payMuted}>{settings.accountName}</Text>
              </View>
            )}
            {settings.promptpayNumber && (
              <View style={s.payCol}>
                <Text style={s.payLabel}>{t("invoices.printPromptpay")}</Text>
                <Text style={s.payBold}>{settings.promptpayNumber}</Text>
                <Text style={s.payMuted}>{t("invoices.printPhoneLabel")}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        <View style={s.notes}>
          <Text>{t("invoices.printNote1")}</Text>
          <Text>{t("invoices.printNote2")}</Text>
        </View>

        <View style={s.dashed} />

        {/* Footer */}
        <View style={s.footer}>
          <Text>{settings.dormitoryName}</Text>
          <Text>{t("invoices.printAutoGen")}</Text>
        </View>
      </Page>
    </Document>
  );
}
