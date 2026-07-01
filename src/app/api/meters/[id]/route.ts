import { db } from "@/db";
import { meterReadings } from "@/db/schema/meter-readings";
import { eq } from "drizzle-orm";
import { notFound } from "@/lib/api-helper";
import { validate, meterPatch } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const PATCH = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const parsed = await validate(req, meterPatch);
  if (parsed instanceof Response) return parsed;

  // Recompute usage against existing rows when any endpoint moves.
  const [existing] = await db
    .select()
    .from(meterReadings)
    .where(eq(meterReadings.id, id));
  if (!existing) return notFound();

  const wp = parsed.waterPrevious ?? Number(existing.waterPrevious ?? 0);
  const wc = parsed.waterCurrent ?? Number(existing.waterCurrent ?? 0);
  const ep = parsed.electricPrevious ?? Number(existing.electricPrevious ?? 0);
  const ec = parsed.electricCurrent ?? Number(existing.electricCurrent ?? 0);

  const set: Record<string, unknown> = {};
  if (parsed.waterPrevious !== undefined) set.waterPrevious = String(parsed.waterPrevious);
  if (parsed.waterCurrent !== undefined) set.waterCurrent = String(parsed.waterCurrent);
  if (parsed.electricPrevious !== undefined) set.electricPrevious = String(parsed.electricPrevious);
  if (parsed.electricCurrent !== undefined) set.electricCurrent = String(parsed.electricCurrent);
  if (parsed.notes !== undefined) set.notes = parsed.notes;
  set.waterUsage = String(Math.max(0, wc - wp));
  set.electricUsage = String(Math.max(0, ec - ep));

  const [updated] = await db
    .update(meterReadings)
    .set(set)
    .where(eq(meterReadings.id, id))
    .returning();
  return Response.json(updated);
});

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await db.delete(meterReadings).where(eq(meterReadings.id, id));
  return Response.json({ success: true });
});
