import { db } from "@/db";
import { tenants } from "@/db/schema/tenants";
import { rooms } from "@/db/schema/rooms";
import { buildings } from "@/db/schema/buildings";
import { eq } from "drizzle-orm";
import { validate, tenantCreate } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async () => {
  const data = await db
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
    .orderBy(tenants.name);
  return Response.json(data);
});

export const POST = route(async (req: Request) => {
  const parsed = await validate(req, tenantCreate);
  if (parsed instanceof Response) return parsed;
  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(tenants)
      .values({
        id: crypto.randomUUID(),
        roomId: parsed.roomId,
        name: parsed.name,
        phone: parsed.phone,
        lineId: parsed.lineId,
        moveInDate: parsed.moveInDate,
        moveOutDate: parsed.moveOutDate ?? null,
        contractDuration: parsed.contractDuration,
        isActive: parsed.isActive,
        wifiEnabled: parsed.wifiEnabled,
      })
      .returning();
    // Keep room status in sync with tenancy — an active tenant marks the room occupied.
    if (parsed.isActive) {
      await tx.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, parsed.roomId));
    }
    return row;
  });
  return Response.json(created, { status: 201 });
});
