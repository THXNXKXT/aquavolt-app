import { db } from "@/db";
import { activities } from "@/db/schema/activities";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { validate, activityCreate } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async (req: Request) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);

  const conditions: SQL[] = [];
  if (type && ["meter", "invoice", "tenant", "room"].includes(type)) {
    conditions.push(eq(activities.type, type as "meter" | "invoice" | "tenant" | "room"));
  }

  const data = await db
    .select()
    .from(activities)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activities.createdAt))
    .limit(limit);

  return Response.json(data);
});

export const POST = route(async (req: Request) => {
  const parsed = await validate(req, activityCreate);
  if (parsed instanceof Response) return parsed;
  const [newItem] = await db
    .insert(activities)
    .values({
      id: crypto.randomUUID(),
      type: parsed.type,
      action: parsed.action,
      detail: parsed.detail,
    })
    .returning();
  return Response.json(newItem, { status: 201 });
});
