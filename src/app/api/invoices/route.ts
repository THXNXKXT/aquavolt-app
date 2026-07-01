import { db } from "@/db";
import { invoices } from "@/db/schema/invoices";
import { rooms } from "@/db/schema/rooms";
import { tenants } from "@/db/schema/tenants";
import { buildings } from "@/db/schema/buildings";
import { invoiceColumns, nextInvoiceNumber, selectInvoice, withTotal } from "@/db/queries";
import { and, eq, type SQL } from "drizzle-orm";
import { validate, invoiceCreate } from "@/lib/validation";
import { badRequest } from "@/lib/api-helper";
import { route } from "@/lib/route-handler";

export const GET = route(async (req: Request) => {
  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");
  const status = url.searchParams.get("status");

  const conditions: SQL[] = [];
  if (month) conditions.push(eq(invoices.month, parseInt(month, 10)));
  if (year) conditions.push(eq(invoices.year, parseInt(year, 10)));
  if (status && ["pending", "paid", "overdue", "cancelled"].includes(status)) {
    conditions.push(eq(invoices.status, status as "pending" | "paid" | "overdue" | "cancelled"));
  }

  const rows = await db
    .select(invoiceColumns)
    .from(invoices)
    .leftJoin(rooms, eq(invoices.roomId, rooms.id))
    .leftJoin(tenants, eq(invoices.tenantId, tenants.id))
    .leftJoin(buildings, eq(rooms.buildingId, buildings.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(invoices.createdAt)
    .limit(500);

  return Response.json(rows.map((r) => withTotal(r)));
});

export const POST = route(async (req: Request) => {
  const parsed = await validate(req, invoiceCreate);
  if (parsed instanceof Response) return parsed;
  const body = parsed;

  // Check for existing invoice for this room/month/year before creating.
  const [existing] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.roomId, body.roomId), eq(invoices.month, body.month), eq(invoices.year, body.year)));
  if (existing) return badRequest("Invoice already exists for this room and billing period");

  // #7 + #8: reserve the number and insert atomically inside one transaction.
  const created = await db.transaction(async (tx) => {
    const invoiceNumber = await nextInvoiceNumber(tx, body.year, body.month);
    const [row] = await tx
      .insert(invoices)
      .values({
        id: crypto.randomUUID(),
        roomId: body.roomId,
        tenantId: body.tenantId,
        meterReadingId: body.meterReadingId ?? null,
        month: body.month,
        year: body.year,
        rentalCost: String(body.rentalCost),
        waterCost: String(body.waterCost),
        electricCost: String(body.electricCost),
        serviceCharge: String(body.serviceCharge),
        wifiCost: String(body.wifiCost),
        status: "pending",
        dueDate: body.dueDate,
        paidDate: body.paidDate ?? null,
        invoiceNumber,
      })
      .returning();
    return row;
  });

  if (!created) return badRequest("Could not create invoice");
  const full = await selectInvoice(created.id);
  return Response.json(full, { status: 201 });
});
