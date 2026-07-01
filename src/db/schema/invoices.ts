import { pgTable, text, integer, numeric, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { rooms } from "./rooms";
import { tenants } from "./tenants";
import { meterReadings } from "./meter-readings";

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  meterReadingId: text("meter_reading_id").references(() => meterReadings.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  rentalCost: numeric("rental_cost", { precision: 10, scale: 2 }).notNull(),
  waterCost: numeric("water_cost", { precision: 10, scale: 2 }).notNull(),
  electricCost: numeric("electric_cost", { precision: 10, scale: 2 }).notNull(),
  serviceCharge: numeric("service_charge", { precision: 10, scale: 2 }).notNull(),
  wifiCost: numeric("wifi_cost", { precision: 10, scale: 2 }).default("0"),
  status: text("status", { enum: ["pending", "paid", "overdue", "cancelled"] }).default("pending").notNull(),
  issuedDate: timestamp("issued_date").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  invoiceNumber: text("invoice_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => ({
  roomMonthYearIdx: uniqueIndex("invoice_room_month_year_idx").on(table.roomId, table.month, table.year),
}));
