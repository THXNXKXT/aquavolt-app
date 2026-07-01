import { db } from "@/db";
import { settings } from "@/db/schema/settings";
import { validate, settingsPatch } from "@/lib/validation";
import { route } from "@/lib/route-handler";

export const GET = route(async () => {
  const data = await db.select().from(settings);
  const map: Record<string, string> = {};
  data.forEach((s) => { map[s.key] = s.value; });
  return Response.json(map);
});

export const PATCH = route(async (req: Request) => {
  const parsed = await validate(req, settingsPatch);
  if (parsed instanceof Response) return parsed;
  // Wrap all upserts in a single transaction so the settings update is atomic —
  // a failure part-way through can't leave some keys updated and others stale.
  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(parsed)) {
      await tx
        .insert(settings)
        .values({ id: crypto.randomUUID(), key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } });
    }
  });
  return Response.json(parsed);
});
