import { db } from "@/db";
import { rooms } from "@/db/schema/rooms";
import { buildings } from "@/db/schema/buildings";
import { eq } from "drizzle-orm";
import { validate, roomCreate } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async () => {
  const data = await db
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
    .orderBy(rooms.roomNumber)
    .limit(500);
  return Response.json(data);
});

export const POST = route(async (req: Request) => {
  const parsed = await validate(req, roomCreate);
  if (parsed instanceof Response) return parsed;
  const [newItem] = await db
    .insert(rooms)
    .values({
      id: crypto.randomUUID(),
      buildingId: parsed.buildingId,
      roomNumber: parsed.roomNumber,
      floor: parsed.floor,
      status: parsed.status,
      rentalFee: parsed.rentalFee,
    })
    .returning();
  return Response.json(newItem, { status: 201 });
});
