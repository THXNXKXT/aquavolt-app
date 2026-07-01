import { pgTable, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const utilityRates = pgTable("utility_rates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  ratePerUnit: numeric("rate_per_unit", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  effectiveFrom: timestamp("effective_from").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
