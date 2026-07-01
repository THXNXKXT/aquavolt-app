import { db } from "@/db";
import { rooms } from "@/db/schema/rooms";
import { buildings } from "@/db/schema/buildings";
import { tenants } from "@/db/schema/tenants";
import { invoices } from "@/db/schema/invoices";
import { meterReadings } from "@/db/schema/meter-readings";
import { eq } from "drizzle-orm";
import { notFound } from "@/lib/api-helper";
import { validate, roomPatch } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [item] = await db
    .select({
      id: rooms.id,
      buildingId: rooms.buildingId,
      roomNumber: rooms.roomNumber,
      floor: rooms.floor,
      status: rooms.status,
      rentalFee: rooms.rentalFee,
      buildingName: buildings.name,
      createdAt: rooms.createdAt,
      updatedAt: rooms.updatedAt,
    })
    .from(rooms)
    .leftJoin(buildings, eq(rooms.buildingId, buildings.id))
    .where(eq(rooms.id, id));
  if (!item) return notFound();
  return Response.json(item);
});

export const PATCH = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const parsed = await validate(req, roomPatch);
  if (parsed instanceof Response) return parsed;
  const [updated] = await db
    .update(rooms)
    .set(parsed)
    .where(eq(rooms.id, id))
    .returning();
  if (!updated) return notFound();
  return Response.json(updated);
});

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // No FK cascade on invoices/tenants/meters → rooms, so remove dependents first.
  // All deletes run inside one transaction so a partial failure can't leave
  // orphaned invoices/meters behind a deleted room.
  await db.transaction(async (tx) => {
    await tx.delete(invoices).where(eq(invoices.roomId, id));
    await tx.delete(meterReadings).where(eq(meterReadings.roomId, id));
    await tx.delete(tenants).where(eq(tenants.roomId, id));
    await tx.delete(rooms).where(eq(rooms.id, id));
  });
  return Response.json({ success: true });
});
