import { db } from "@/db";
import { tenants } from "@/db/schema/tenants";
import { rooms } from "@/db/schema/rooms";
import { buildings } from "@/db/schema/buildings";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "@/lib/api-helper";
import { validate, tenantPatch } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [item] = await db
    .select({
      id: tenants.id,
      roomId: tenants.roomId,
      name: tenants.name,
      phone: tenants.phone,
      lineId: tenants.lineId,
      moveInDate: tenants.moveInDate,
      moveOutDate: tenants.moveOutDate,
      contractDuration: tenants.contractDuration,
      isActive: tenants.isActive,
      roomNumber: rooms.roomNumber,
      buildingName: buildings.name,
      wifiEnabled: tenants.wifiEnabled,
      createdAt: tenants.createdAt,
      updatedAt: tenants.updatedAt,
    })
    .from(tenants)
    .leftJoin(rooms, eq(tenants.roomId, rooms.id))
    .leftJoin(buildings, eq(rooms.buildingId, buildings.id))
    .where(eq(tenants.id, id));
  if (!item) return notFound();
  return Response.json(item);
});

export const PATCH = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const parsed = await validate(req, tenantPatch);
  if (parsed instanceof Response) return parsed;
  const set: Record<string, unknown> = { ...parsed };
  if (parsed.moveInDate) set.moveInDate = parsed.moveInDate;
  if (parsed.moveOutDate !== undefined) set.moveOutDate = parsed.moveOutDate ?? null;

  const updated = await db.transaction(async (tx) => {
    // Capture old room before the update so we can free it if the tenant moves.
    let oldRoomId: string | null = null;
    if (parsed.roomId) {
      const [old] = await tx.select({ roomId: tenants.roomId }).from(tenants).where(eq(tenants.id, id));
      oldRoomId = old?.roomId ?? null;
    }

    const [row] = await tx
      .update(tenants)
      .set(set)
      .where(eq(tenants.id, id))
      .returning();
    if (!row) return null;

    // Free the old room if the tenant moved to a different one.
    if (oldRoomId && oldRoomId !== row.roomId) {
      const [other] = await tx
        .select({ id: tenants.id })
        .from(tenants)
        .where(and(eq(tenants.roomId, oldRoomId), eq(tenants.isActive, true), isNull(tenants.moveOutDate)));
      if (!other) await tx.update(rooms).set({ status: "vacant" }).where(eq(rooms.id, oldRoomId));
    }

    // Sync current room occupancy — mutually exclusive: a tenant is either
    // being deactivated/moved-out OR being activated/moved-in, never both.
    if (parsed.isActive === false || parsed.moveOutDate) {
      const [other] = await tx
        .select({ id: tenants.id })
        .from(tenants)
        .where(and(eq(tenants.roomId, row.roomId), eq(tenants.isActive, true), isNull(tenants.moveOutDate)));
      if (!other) await tx.update(rooms).set({ status: "vacant" }).where(eq(rooms.id, row.roomId));
    } else if (parsed.isActive === true || parsed.roomId) {
      await tx.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, row.roomId));
    }
    return row;
  });
  if (!updated) return notFound();
  return Response.json(updated);
});

export const DELETE = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // Delete inside a transaction and sync the room: if the removed tenant was
  // active and no other active tenant remains in the room, free it.
  const deleted = await db.transaction(async (tx) => {
    const [row] = await tx
      .delete(tenants)
      .where(eq(tenants.id, id))
      .returning({ id: tenants.id, roomId: tenants.roomId, isActive: tenants.isActive });
    if (!row) return null;
    if (row.isActive) {
      const [other] = await tx
        .select({ id: tenants.id })
        .from(tenants)
        .where(and(eq(tenants.roomId, row.roomId), eq(tenants.isActive, true), isNull(tenants.moveOutDate)));
      if (!other) await tx.update(rooms).set({ status: "vacant" }).where(eq(rooms.id, row.roomId));
    }
    return row;
  });
  if (!deleted) return notFound();
  return Response.json({ success: true });
});
