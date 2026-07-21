"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { InvoicePDF } from "@/components/invoice-pdf";
import type { Invoice, MeterReading } from "@/types";

interface PDFDownloadProps {
  invoice: Invoice;
  meterReading: MeterReading | null;
  settings: { dormitoryName: string; dormitoryAddress: string; phone: string };
  locale: "en" | "th";
  getMonthName: (m: number) => string;
  formatCurrency: (n: number) => string;
  formatDate: (d: string, l: string) => string;
  waterRate: number;
  electricRate: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, opts?: any) => string;
}

export function PDFDownload(props: PDFDownloadProps) {
  return (
    <PDFDownloadLink
      document={<InvoicePDF {...props} />}
      fileName={`${props.invoice.invoiceNumber}.pdf`}
      style={{ textDecoration: "none" }}
    >
      {({ loading }) => (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-white bg-primary rounded-full hover:bg-primary-focus active:scale-[0.97] transition-colors">
          <Download className="w-3.5 h-3.5" />
          {loading ? "..." : props.t("invoices.downloadPDF")}
        </span>
      )}
    </PDFDownloadLink>
  );
}
