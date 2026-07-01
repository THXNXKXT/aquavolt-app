import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["meter", "invoice", "tenant", "room"] }).notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
