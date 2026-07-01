import { db } from "@/db";
import { invoices } from "@/db/schema/invoices";
import { rooms } from "@/db/schema/rooms";
import { tenants } from "@/db/schema/tenants";
import { buildings } from "@/db/schema/buildings";
import { activities } from "@/db/schema/activities";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { sumInvoice } from "@/lib/calculators";

// A drizzle handle that can run selects — either the live db or a tx callback arg.
type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Shared invoice projection: the columns + joins both GET /invoices (list) and
 * GET /invoices/:id (detail) need, plus the computed totalAmount. One shape,
 * two callers — #12 was they had drifted into a copy-paste pair.
 */
export const invoiceColumns = {
  id: invoices.id,
  roomId: invoices.roomId,
  tenantId: invoices.tenantId,
  meterReadingId: invoices.meterReadingId,
  month: invoices.month,
  year: invoices.year,
  rentalCost: invoices.rentalCost,
  waterCost: invoices.waterCost,
  electricCost: invoices.electricCost,
  serviceCharge: invoices.serviceCharge,
  wifiCost: invoices.wifiCost,
  status: invoices.status,
  issuedDate: invoices.issuedDate,
  dueDate: invoices.dueDate,
  paidDate: invoices.paidDate,
  invoiceNumber: invoices.invoiceNumber,
  roomNumber: rooms.roomNumber,
  tenantName: tenants.name,
  buildingName: buildings.name,
  createdAt: invoices.createdAt,
  updatedAt: invoices.updatedAt,
} as const;

export type InvoiceRow = {
  id: string;
  roomId: string;
  tenantId: string;
  meterReadingId: string | null;
  month: number;
  year: number;
  rentalCost: string;
  waterCost: string;
  electricCost: string;
  serviceCharge: string;
  wifiCost: string | null;
  status: "pending" | "paid" | "overdue" | "cancelled";
  issuedDate: Date | null;
  dueDate: Date;
  paidDate: Date | null;
  invoiceNumber: string;
  roomNumber: string | null;
  tenantName: string | null;
  buildingName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

/** Add computed totalAmount to a raw invoice row (DB returns money as strings). */
export function withTotal<T extends InvoiceRow>(row: T): T & { totalAmount: string } {
  return { ...row, totalAmount: String(sumInvoice(row)) };
}

export async function selectInvoice(id: string): Promise<(InvoiceRow & { totalAmount: string }) | null> {
  const [row] = await db
    .select(invoiceColumns)
    .from(invoices)
    .leftJoin(rooms, eq(invoices.roomId, rooms.id))
    .leftJoin(tenants, eq(invoices.tenantId, tenants.id))
    .leftJoin(buildings, eq(rooms.buildingId, buildings.id))
    .where(eq(invoices.id, id));
  return row ? withTotal(row as InvoiceRow) : null;
}

/**
 * Atomically reserve the next invoice number for a billing period, inside the
 * caller's transaction. #7: `invoices.length + 1` raced and collided on the
 * unique invoice_number; counting live rows under the row lock the insert holds
 * serialises concurrent generators. Format: INV-YYYYMM-NNN.
 */
export async function nextInvoiceNumber(
  tx: DbOrTx,
  year: number,
  month: number,
): Promise<string> {
  const period = `${year}${String(month).padStart(2, "0")}`;
  const [row] = await tx
    .select({ n: count() })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} like ${`INV-${period}-%`}`);
  const n = Number(row?.n ?? 0) + 1;
  return `INV-${period}-${String(n).padStart(3, "0")}`;
}

/**
 * Flip pending invoices past their dueDate to overdue. #10: the "overdue"
 * status existed in the schema but nothing ever set it — OverdueAlert pointed
 * at data that could only exist via the seed.
 *
 * Called on dashboard read; cheap bounded update. ponytail: not a cron job —
 * lazy evaluation on read is fine for a single-dorm system, add a pg_cron
 * schedule if it ever needs to be prompt at midnight.
 */
export async function markOverdue(): Promise<number> {
  const now = new Date();
  const result = await db
    .update(invoices)
    .set({ status: "overdue" })
    .where(and(eq(invoices.status, "pending"), sql`${invoices.dueDate} < ${now}`))
    .returning({ id: invoices.id });
  return result.length;
}

export async function recentActivities(limit = 6) {
  return db
    .select()
    .from(activities)
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}
