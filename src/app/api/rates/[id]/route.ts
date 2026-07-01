import { db } from "@/db";
import { utilityRates } from "@/db/schema/utility-rates";
import { eq } from "drizzle-orm";
import { notFound } from "@/lib/api-helper";
import { validate, ratePatch } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const PATCH = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const parsed = await validate(req, ratePatch);
  if (parsed instanceof Response) return parsed;
  const set: Record<string, unknown> = { ...parsed };
  if (parsed.ratePerUnit !== undefined) set.ratePerUnit = String(parsed.ratePerUnit);
  const [updated] = await db
    .update(utilityRates)
    .set(set)
    .where(eq(utilityRates.id, id))
    .returning();
  if (!updated) return notFound();
  return Response.json(updated);
});

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await db.delete(utilityRates).where(eq(utilityRates.id, id));
  return Response.json({ success: true });
});
