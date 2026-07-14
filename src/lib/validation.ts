import { z } from "zod";
import { badRequest } from "@/lib/api-helper";

// ponytail: one money parser used everywhere. DB stores baht as numeric string;
// we coerce on the boundary so handlers never hand a string into arithmetic.
export const money = z.coerce.number().min(0);

export const buildingCreate = z.object({
  name: z.string().min(1).max(120),
  address: z.string().max(500).optional().default(""),
});

export const buildingPatch = z.object({
  name: z.string().min(1).max(120).optional(),
  address: z.string().max(500).optional(),
});

export const roomCreate = z.object({
  buildingId: z.string().min(1),
  roomNumber: z.string().min(1).max(40),
  floor: z.number().int().min(-10).max(200).optional().default(1),
  status: z.enum(["vacant", "occupied", "maintenance"]).optional().default("vacant"),
  rentalFee: z.number().int().min(0).optional().default(0),
});

export const roomPatch = z.object({
  buildingId: z.string().min(1).optional(),
  roomNumber: z.string().min(1).max(40).optional(),
  floor: z.number().int().min(-10).max(200).optional(),
  status: z.enum(["vacant", "occupied", "maintenance"]).optional(),
  rentalFee: z.number().int().min(0).optional(),
});

export const tenantCreate = z.object({
  roomId: z.string().min(1),
  name: z.string().min(1).max(120),
  phone: z.string().min(1).max(40),
  lineId: z.string().max(60).optional().default(""),
  moveInDate: z.coerce.date(),
  moveOutDate: z.coerce.date().nullable().optional(),
  contractDuration: z.number().int().min(1).max(120).optional().default(12),
  isActive: z.boolean().optional().default(true),
  wifiEnabled: z.boolean().optional().default(false),
});

export const tenantPatch = z.object({
  roomId: z.string().min(1).optional(),
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(1).max(40).optional(),
  lineId: z.string().max(60).optional(),
  moveInDate: z.coerce.date().optional(),
  moveOutDate: z.coerce.date().nullable().optional(),
  contractDuration: z.number().int().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
  wifiEnabled: z.boolean().optional(),
});

export const meterReading = z.object({
  roomId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1900).max(9999),
  waterPrevious: money.optional().default(0),
  waterCurrent: money.optional().default(0),
  electricPrevious: money.optional().default(0),
  electricCurrent: money.optional().default(0),
  notes: z.string().max(500).optional().default(""),
});

export const meterPatch = z.object({
  waterPrevious: money.optional(),
  waterCurrent: money.optional(),
  electricPrevious: money.optional(),
  electricCurrent: money.optional(),
  notes: z.string().max(500).optional(),
});

export const invoiceCreate = z.object({
  roomId: z.string().min(1),
  tenantId: z.string().min(1),
  meterReadingId: z.string().nullable().optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1900).max(9999),
  rentalCost: money,
  waterCost: money,
  electricCost: money,
  serviceCharge: money,
  wifiCost: money.optional().default(0),
  dueDate: z.coerce.date(),
  paidDate: z.coerce.date().nullable().optional(),
  invoiceNumber: z.string().min(1).max(60).optional(),
});

// Whitelist of fields a client may change after creation. status + paidDate cover
// the mark-paid flow; amounts are immutable post-issue.
export const invoicePatch = z.object({
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
  paidDate: z.coerce.date().nullable().optional(),
  dueDate: z.coerce.date().optional(),
});

export const rateCreate = z.object({
  name: z.string().min(1).max(80),
  unit: z.string().min(1).max(20),
  ratePerUnit: money,
  isActive: z.boolean().optional().default(true),
});

export const ratePatch = z.object({
  name: z.string().min(1).max(80).optional(),
  unit: z.string().min(1).max(20).optional(),
  ratePerUnit: money.optional(),
  isActive: z.boolean().optional(),
});

export const activityCreate = z.object({
  type: z.enum(["meter", "invoice", "tenant", "room"]),
  action: z.string().min(1).max(120),
  detail: z.string().max(500).optional().default(""),
});

export const settingsPatch = z
  .record(z.string().min(1), z.string().max(2000))
  .refine((o) => Object.keys(o).length > 0, { message: "empty settings" });

export type BuildingCreate = z.infer<typeof buildingCreate>;
export type BuildingPatch = z.infer<typeof buildingPatch>;
export type RoomCreate = z.infer<typeof roomCreate>;
export type RoomPatch = z.infer<typeof roomPatch>;
export type TenantCreate = z.infer<typeof tenantCreate>;
export type TenantPatch = z.infer<typeof tenantPatch>;
export type MeterReadingInput = z.infer<typeof meterReading>;
export type MeterPatch = z.infer<typeof meterPatch>;
export type InvoiceCreate = z.infer<typeof invoiceCreate>;
export type InvoicePatch = z.infer<typeof invoicePatch>;
export type RateCreate = z.infer<typeof rateCreate>;
export type RatePatch = z.infer<typeof ratePatch>;
export type ActivityCreate = z.infer<typeof activityCreate>;

/**
 * Validate a request body against a zod schema. On failure returns a 400 Response;
 * otherwise returns the parsed value. Caller must early-return on Response.
 *
 *   const parsed = await validate(req, roomCreate);
 *   if (parsed instanceof Response) return parsed;
 */
export async function validate<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<T | Response> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    return badRequest(first ? `${first.path.join(".")}: ${first.message}` : "Validation failed");
  }
  return result.data;
}
