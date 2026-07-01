import { db } from "@/db";
import { invoices } from "@/db/schema/invoices";
import { selectInvoice } from "@/db/queries";
import { eq } from "drizzle-orm";
import { notFound, badRequest } from "@/lib/api-helper";
import { validate, invoicePatch } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const item = await selectInvoice(id);
  if (!item) return notFound();
  return Response.json(item);
});

export const PATCH = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const parsed = await validate(req, invoicePatch);
  if (parsed instanceof Response) return parsed;

  // #2: only whitelisted fields (status, paidDate, dueDate) ever reach the DB.
  // Amounts are immutable after issue; the mark-paid flow sets status + paidDate.
  const set: Record<string, unknown> = { ...parsed };
  if (parsed.status === "paid" && !parsed.paidDate) {
    set.paidDate = new Date();
  }
  // Reopening a paid invoice clears the payment timestamp.
  if (parsed.status && parsed.status !== "paid" && parsed.paidDate === undefined) {
    set.paidDate = null;
  }

  const [updated] = await db
    .update(invoices)
    .set(set)
    .where(eq(invoices.id, id))
    .returning();
  if (!updated) return notFound();

  const full = await selectInvoice(id);
  if (!full) return badRequest("Invoice disappeared");
  return Response.json(full);
});
