import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { buildings } from "./buildings";

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  buildingId: text("building_id").notNull().references(() => buildings.id, { onDelete: "cascade" }),
  roomNumber: text("room_number").notNull(),
  floor: integer("floor").default(1),
  status: text("status", { enum: ["vacant", "occupied", "maintenance"] }).default("vacant").notNull(),
  rentalFee: integer("rental_fee").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
