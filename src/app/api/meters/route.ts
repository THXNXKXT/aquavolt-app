import { db } from "@/db";
import { meterReadings } from "@/db/schema/meter-readings";
import { rooms } from "@/db/schema/rooms";
import { buildings } from "@/db/schema/buildings";
import { and, eq, type SQL } from "drizzle-orm";
import { validate, meterReading } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async (req: Request) => {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId");
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  const conditions: SQL[] = [];
  if (roomId) conditions.push(eq(meterReadings.roomId, roomId));
  if (month) conditions.push(eq(meterReadings.month, parseInt(month, 10)));
  if (year) conditions.push(eq(meterReadings.year, parseInt(year, 10)));

  const data = await db
    .select({
      id: meterReadings.id,
      roomId: meterReadings.roomId,
      month: meterReadings.month,
      year: meterReadings.year,
      waterPrevious: meterReadings.waterPrevious,
      waterCurrent: meterReadings.waterCurrent,
      electricPrevious: meterReadings.electricPrevious,
      electricCurrent: meterReadings.electricCurrent,
      waterUsage: meterReadings.waterUsage,
      electricUsage: meterReadings.electricUsage,
      notes: meterReadings.notes,
      recordedAt: meterReadings.recordedAt,
      roomNumber: rooms.roomNumber,
      buildingName: buildings.name,
      createdAt: meterReadings.createdAt,
      updatedAt: meterReadings.updatedAt,
    })
    .from(meterReadings)
    .leftJoin(rooms, eq(meterReadings.roomId, rooms.id))
    .leftJoin(buildings, eq(rooms.buildingId, buildings.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(meterReadings.year, meterReadings.month);

  return Response.json(data);
});

export const POST = route(async (req: Request) => {
  const parsed = await validate(req, meterReading);
  if (parsed instanceof Response) return parsed;

  // Warn (not block) when readings go backwards — likely a recording error.
  const warnings: string[] = [];
  if (parsed.waterCurrent < parsed.waterPrevious)
    warnings.push("Water meter current is lower than previous — please verify");
  if (parsed.electricCurrent < parsed.electricPrevious)
    warnings.push("Electric meter current is lower than previous — please verify");

  const waterUsage = Math.max(0, parsed.waterCurrent - parsed.waterPrevious);
  const electricUsage = Math.max(0, parsed.electricCurrent - parsed.electricPrevious);
  const [newItem] = await db
    .insert(meterReadings)
    .values({
      id: crypto.randomUUID(),
      roomId: parsed.roomId,
      month: parsed.month,
      year: parsed.year,
      waterPrevious: String(parsed.waterPrevious),
      waterCurrent: String(parsed.waterCurrent),
      waterUsage: String(waterUsage),
      electricPrevious: String(parsed.electricPrevious),
      electricCurrent: String(parsed.electricCurrent),
      electricUsage: String(electricUsage),
      notes: parsed.notes,
    })
    .returning();
  return Response.json({ ...newItem, warnings: warnings.length > 0 ? warnings : undefined }, { status: 201 });
});
