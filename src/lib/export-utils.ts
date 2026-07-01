import * as XLSX from "xlsx";

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string; format?: (value: unknown) => string }[],
  filename: string
) {
  const rows = data.map((item) => {
    const row: Record<string, string> = {};
    for (const col of columns) {
      const value = item[col.key];
      row[col.label] = col.format ? col.format(value) : String(value ?? "");
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const colWidths = columns.map((col) => {
    const maxVal = rows.reduce((max, row) => Math.max(max, String(row[col.label] || "").length), col.label.length);
    return { wch: Math.min(maxVal + 4, 40) };
  });
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function printReport(title: string) {
  document.title = title;
  window.print();
}

export function formatExportDate(value: unknown): string {
  if (!value) return "-";
  try {
    const d = new Date(value as string);
    return d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(value);
  }
}

export function formatExportCurrency(value: unknown): string {
  const num = Number(value ?? 0);
  return num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
