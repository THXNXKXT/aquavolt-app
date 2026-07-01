import { pgTable, text, integer, numeric, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { rooms } from "./rooms";

export const meterReadings = pgTable("meter_readings", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  waterPrevious: numeric("water_previous", { precision: 10, scale: 2 }).default("0"),
  waterCurrent: numeric("water_current", { precision: 10, scale: 2 }).default("0"),
  electricPrevious: numeric("electric_previous", { precision: 10, scale: 2 }).default("0"),
  electricCurrent: numeric("electric_current", { precision: 10, scale: 2 }).default("0"),
  waterUsage: numeric("water_usage", { precision: 10, scale: 2 }).default("0"),
  electricUsage: numeric("electric_usage", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes").default(""),
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => ({
  roomMonthYearIdx: uniqueIndex("room_month_year_idx").on(table.roomId, table.month, table.year),
}));
