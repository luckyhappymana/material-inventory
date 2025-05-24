import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const DefaultMaterialTypes = {
  "SPC": "#9E9E9E",
  "SECC": "#2196F3",
  "SUS": "#673AB7",
  "SUS-MIGAKI": "#FF9800",
  "SUS-HL": "#795548",
  "A5052": "#607D8B"
};
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  materialType: text("material_type").notNull(),
  thickness: text("thickness").notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  hidden: boolean("hidden").default(false).notNull(),
});
export const materialTypes = pgTable("material_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const usageHistory = pgTable("usage_history", {
  id: serial("id").primaryKey(),
  materialType: text("material_type").notNull(),
  thickness: text("thickness").notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  action: text("action").notNull(), // "use", "add", "reduce"
});
export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
  hidden: true,
});
export const insertUsageHistorySchema = createInsertSchema(usageHistory).omit({
  id: true,
  createdAt: true,
});
export const insertMaterialTypeSchema = createInsertSchema(materialTypes).omit({
  id: true,
  createdAt: true,
});
export const materialTypeSchema = z.string().min(1, "材質タイプを入力してください");
export type DefaultMaterialType = keyof typeof DefaultMaterialTypes;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type MaterialType = typeof materialTypes.$inferSelect;
export type InsertMaterialType = z.infer<typeof insertMaterialTypeSchema>;
export type UsageHistory = typeof usageHistory.$inferSelect;
export type InsertUsageHistory = z.infer<typeof insertUsageHistorySchema>;
