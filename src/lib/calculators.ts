/**
 * Calculate utility costs based on meter readings and rates
 */

/**
 * Coerce a DB money value (numeric → string | null) to a JS number.
 * ponytail: one parse boundary, used everywhere money crosses DB→app.
 */
export function toMoney(v: string | number | null | undefined): number {
  const n = typeof v === "number" ? v : parseFloat(v ?? "0");
  return Number.isFinite(n) ? n : 0;
}

/**
 * Sum every line on an invoice into a single total. The single source of truth
 * for "what does this invoice add up to" — used by routes and the dashboard so
 * the number can never drift between surfaces again.
 */
export function sumInvoice(inv: {
  rentalCost: string | number;
  waterCost: string | number;
  electricCost: string | number;
  serviceCharge: string | number;
  wifiCost?: string | number | null;
}): number {
  return (
    toMoney(inv.rentalCost) +
    toMoney(inv.waterCost) +
    toMoney(inv.electricCost) +
    toMoney(inv.serviceCharge) +
    toMoney(inv.wifiCost ?? 0)
  );
}

export interface CalculationInput {
  waterPrevious: number;
  waterCurrent: number;
  electricPrevious: number;
  electricCurrent: number;
  waterRate: number;
  electricRate: number;
  serviceCharge: number;
  rentalFee: number;          // ค่าห้องพักต่อเดือน
  wifiCost?: number;          // ค่า WiFi (ถ้ามี)
}

export interface CalculationResult {
  waterUsage: number;
  electricUsage: number;
  waterCost: number;
  electricCost: number;
  serviceCharge: number;
  rentalCost: number;         // ค่าห้องพัก
  wifiCost: number;           // ค่า WiFi
  totalAmount: number;
}

export function calculateUtilityCosts(input: CalculationInput): CalculationResult {
  const waterUsage = Math.max(0, input.waterCurrent - input.waterPrevious);
  const electricUsage = Math.max(0, input.electricCurrent - input.electricPrevious);
  const waterCost = waterUsage * input.waterRate;
  const electricCost = electricUsage * input.electricRate;
  const rentalCost = input.rentalFee;

  return {
    waterUsage,
    electricUsage,
    waterCost,
    electricCost,
    serviceCharge: input.serviceCharge,
    rentalCost,
    wifiCost: input.wifiCost ?? 0,
    totalAmount: waterCost + electricCost + input.serviceCharge + rentalCost + (input.wifiCost ?? 0),
  };
}

/**
 * Generate invoice number
 * Format: INV-YYYYMM-XXX
 */
export function generateInvoiceNumber(year: number, month: number, sequence: number): string {
  const seq = String(sequence).padStart(3, '0');
  return `INV-${year}${String(month).padStart(2, '0')}-${seq}`;
}

/**
 * Calculate due date (default: 15 days after issue date)
 */
export function calculateDueDate(issueDate: Date, days: number = 15): Date {
  const due = new Date(issueDate);
  due.setDate(due.getDate() + days);
  return due;
}
