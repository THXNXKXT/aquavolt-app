import { db } from "@/db";
import { buildings } from "@/db/schema/buildings";
import { rooms } from "@/db/schema/rooms";
import { tenants } from "@/db/schema/tenants";
import { invoices } from "@/db/schema/invoices";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "@/lib/api-helper";
import { validate, buildingPatch } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [item] = await db.select().from(buildings).where(eq(buildings.id, id));
  if (!item) return notFound();
  return Response.json(item);
});

export const PATCH = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const parsed = await validate(req, buildingPatch);
  if (parsed instanceof Response) return parsed;
  const [updated] = await db
    .update(buildings)
    .set(parsed)
    .where(eq(buildings.id, id))
    .returning();
  if (!updated) return notFound();
  return Response.json(updated);
});

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // Cascade: rooms have onDelete:cascade to buildings, but tenants/invoices only
  // reference rooms.id without a rule — clean them up explicitly so we never
  // leave dangling rows. All inside one transaction for atomicity.
  await db.transaction(async (tx) => {
    const roomIds = await tx.select({ id: rooms.id }).from(rooms).where(eq(rooms.buildingId, id));
    if (roomIds.length) {
      const ids = roomIds.map((r) => r.id);
      await tx.delete(invoices).where(inArray(invoices.roomId, ids));
      await tx.delete(tenants).where(inArray(tenants.roomId, ids));
      await tx.delete(rooms).where(eq(rooms.buildingId, id));
    }
    await tx.delete(buildings).where(eq(buildings.id, id));
  });
  return Response.json({ success: true });
});
