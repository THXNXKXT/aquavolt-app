import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { rooms } from "./rooms";

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  lineId: text("line_id").default(""),
  moveInDate: timestamp("move_in_date").notNull(),
  moveOutDate: timestamp("move_out_date"),
  contractDuration: integer("contract_duration").default(12).notNull(),
  isActive: boolean("is_active").default(true),
  wifiEnabled: boolean("wifi_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
