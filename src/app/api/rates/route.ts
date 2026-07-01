import { db } from "@/db";
import { utilityRates } from "@/db/schema/utility-rates";
import { validate, rateCreate } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async () => {
  const data = await db.select().from(utilityRates).orderBy(utilityRates.name);
  return Response.json(data);
});

export const POST = route(async (req: Request) => {
  const parsed = await validate(req, rateCreate);
  if (parsed instanceof Response) return parsed;
  const [newItem] = await db
    .insert(utilityRates)
    .values({
      id: crypto.randomUUID(),
      name: parsed.name,
      unit: parsed.unit,
      ratePerUnit: String(parsed.ratePerUnit),
      isActive: parsed.isActive,
    })
    .returning();
  return Response.json(newItem, { status: 201 });
});
