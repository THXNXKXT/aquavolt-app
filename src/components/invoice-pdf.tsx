"use client";

import { Document, Page, Text, View, StyleSheet, Font, Link } from "@react-pdf/renderer";
import type { Invoice, MeterReading } from "@/types";

// ponytail: Sukhumvit Set from system — same fonts as the web app
Font.register({
  family: "Sukhumvit",
  fonts: [
    { src: "/fonts/SukhumvitSet-Text.ttf", fontWeight: 400 },
    { src: "/fonts/SukhumvitSet-Bold.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: { fontFamily: "Sukhumvit", fontSize: 9, color: "#1d1d1f", padding: 30, lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end" },
  dormName: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  dormAddr: { fontSize: 8, color: "#86868b" },
  invoiceTitle: { fontSize: 14, fontWeight: 700 },
  invoiceNum: { fontSize: 9, color: "#86868b", marginTop: 2 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#e3e3e6", marginVertical: 10 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 8, fontWeight: 700, color: "#0071e3", textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 60, color: "#86868b" },
  value: { fontWeight: 700 },
  twoCol: { flexDirection: "row", justifyContent: "space-between" },
  rightCol: { width: "45%", alignItems: "flex-end" },
  meterRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  meterCol: { flex: 1 },
  meterLabel: { fontSize: 7, color: "#86868b", marginBottom: 2 },
  meterVal: { fontSize: 9, fontWeight: 700 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e3e3e6", paddingBottom: 4, marginBottom: 4 },
  tableHeaderCell: { fontSize: 7, fontWeight: 700, color: "#86868b", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 3 },
  tableCell: { fontSize: 9 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#0071e3", paddingTop: 6, marginTop: 4 },
  totalLabel: { fontSize: 10, fontWeight: 700 },
  totalVal: { fontSize: 12, fontWeight: 700, color: "#0071e3" },
  footer: { position: "absolute", bottom: 20, right: 30, fontSize: 7, color: "#86868b" },
  paymentSection: { marginTop: 12 },
  paymentTitle: { fontSize: 8, fontWeight: 700, color: "#0071e3", textTransform: "uppercase", marginBottom: 4 },
  paymentRow: { flexDirection: "row", gap: 12 },
});

interface PDFFooterProps {
  t: (key: string, opts?: any) => string;
}

interface InvoicePDFProps {
  invoice: Invoice;
  meterReading: MeterReading | null;
  settings: { dormitoryName: string; dormitoryAddress: string; phone: string };
  locale: "en" | "th";
  getMonthName: (m: number) => string;
  formatCurrency: (n: number) => string;
  formatDate: (d: string, l: string) => string;
  waterRate: number;
  electricRate: number;
  t: (key: string, opts?: any) => string;
}

export function InvoicePDF({ invoice, meterReading, settings, locale, getMonthName, formatCurrency, formatDate, waterRate, electricRate, t }: InvoicePDFProps) {
  const items = [
    { label: t("invoices.rentalCharge"), amount: Number(invoice.rentalCost) || 0 },
    { label: t("invoices.waterCharge"), amount: Number(invoice.waterCost) || 0 },
    { label: t("invoices.electricCharge"), amount: Number(invoice.electricCost) || 0 },
    { label: t("invoices.serviceCharge"), amount: Number(invoice.serviceCharge) || 0 },
    { label: t("invoices.wifiCharge") || "WiFi", amount: Number(invoice.wifiCost) || 0 },
  ].filter((i) => i.amount > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dormName}>{settings.dormitoryName || "AquaVolt"}</Text>
            <Text style={styles.dormAddr}>{settings.dormitoryAddress}</Text>
            {settings.phone && <Text style={styles.dormAddr}>{t("invoices.printTel")} {settings.phone}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>{t("invoices.invoiceTitle")}</Text>
            <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill To + Details */}
        <View style={styles.twoCol}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("invoices.printBillTo")}</Text>
            <View style={styles.row}><Text style={styles.label}>{t("invoices.printName")}</Text><Text style={styles.value}>{String(invoice.tenantName || "-")}</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t("invoices.printRoom")}</Text><Text style={styles.value}>{String(invoice.roomNumber || "-")}</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t("invoices.printBuilding")}</Text><Text style={styles.value}>{String(invoice.buildingName || "-")}</Text></View>
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.sectionTitle}>{t("invoices.printDetails")}</Text>
            <View style={styles.row}><Text style={styles.label}>{t("invoices.printMonth")}</Text><Text style={styles.value}>{getMonthName(invoice.month)} {invoice.year}</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t("invoices.printIssueDate")}</Text><Text style={styles.value}>{formatDate(invoice.issuedDate, locale)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t("invoices.printDueDate")}</Text><Text style={styles.value}>{formatDate(invoice.dueDate, locale)}</Text></View>
          </View>
        </View>

        {/* Meters */}
        {meterReading && (
          <View style={styles.section}>
            <View style={styles.meterRow}>
              <View style={styles.meterCol}>
                <Text style={[styles.sectionTitle, { color: "#0071e3" }]}>{t("invoices.printWaterMeter")}</Text>
                <View style={styles.meterRow}>
                  <View style={styles.meterCol}><Text style={styles.meterLabel}>{t("invoices.printOld")}</Text><Text style={styles.meterVal}>{String(meterReading.waterPrevious ?? "-")}</Text></View>
                  <View style={styles.meterCol}><Text style={styles.meterLabel}>{t("invoices.printNew")}</Text><Text style={styles.meterVal}>{String(meterReading.waterCurrent ?? "-")}</Text></View>
                  <View style={styles.meterCol}><Text style={styles.meterLabel}>{t("invoices.printUnit")}</Text><Text style={styles.meterVal}>{String(meterReading.waterUsage ?? "-")}</Text></View>
                  <View style={styles.meterCol}><Text style={styles.meterLabel}>{t("invoices.printRate")}</Text><Text style={styles.meterVal}>{waterRate}฿</Text></View>
                </View>
              </View>
            </View>
            <View style={styles.meterRow}>
              <View style={styles.meterCol}>
                <Text style={[styles.sectionTitle, { color: "#d97706" }]}>{t("invoices.printElectricMeter")}</Text>
                <View style={styles.meterRow}>
                  <View style={styles.meterCol}><Text style={styles.meterLabel}>{t("invoices.printOld")}</Text><Text style={styles.meterVal}>{String(meterReading.electricPrevious ?? "-")}</Text></View>
                  <View style={styles.meterCol}><Text style={styles.meterLabel}>{t("invoices.printNew")}</Text><Text style={styles.meterVal}>{String(meterReading.electricCurrent ?? "-")}</Text></View>
                  <View style={styles.meterCol}><Text style={styles.meterLabel}>{t("invoices.printUnit")}</Text><Text style={styles.meterVal}>{String(meterReading.electricUsage ?? "-")}</Text></View>
                  <View style={styles.meterCol}><Text style={styles.meterLabel}>{t("invoices.printRate")}</Text><Text style={styles.meterVal}>{electricRate}฿</Text></View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Line items */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>{t("invoices.printItem")}</Text>
          <Text style={[styles.tableHeaderCell, { width: 30, textAlign: "center" }]}>{t("invoices.printQty")}</Text>
          <Text style={[styles.tableHeaderCell, { width: 60, textAlign: "right" }]}>{t("invoices.printAmount")}</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.label}</Text>
            <Text style={[styles.tableCell, { width: 30, textAlign: "center" }]}>1</Text>
            <Text style={[styles.tableCell, { width: 60, textAlign: "right" }]}>{formatCurrency(item.amount)}</Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t("invoices.printTotalDue")}</Text>
          <Text style={styles.totalVal}>{formatCurrency(Number(invoice.totalAmount) || 0)}</Text>
        </View>

        {/* Payment */}
        {(settings.phone || invoice.buildingName) && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>{t("invoices.printPaymentMethods")}</Text>
            <View style={styles.paymentRow}>
              <View>
                <Text style={styles.meterLabel}>{t("invoices.printPromptpay")}</Text>
                <Text style={styles.value}>{settings.phone}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.footer} fixed>{t("invoices.printAutoGen")}</Text>
      </Page>
    </Document>
  );
}
