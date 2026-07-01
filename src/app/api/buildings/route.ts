import { db } from "@/db";
import { buildings } from "@/db/schema/buildings";
import { rooms } from "@/db/schema/rooms";
import { eq, count } from "drizzle-orm";
import { validate, buildingCreate } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async () => {
  const data = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      address: buildings.address,
      totalRooms: count(rooms.id).as("total_rooms"),
      createdAt: buildings.createdAt,
      updatedAt: buildings.updatedAt,
    })
    .from(buildings)
    .leftJoin(rooms, eq(rooms.buildingId, buildings.id))
    .groupBy(buildings.id)
    .orderBy(buildings.name)
    .limit(500);
  return Response.json(data);
});

export const POST = route(async (req: Request) => {
  const parsed = await validate(req, buildingCreate);
  if (parsed instanceof Response) return parsed;
  const [newItem] = await db
    .insert(buildings)
    .values({ id: crypto.randomUUID(), name: parsed.name, address: parsed.address })
    .returning();
  return Response.json(newItem, { status: 201 });
});
