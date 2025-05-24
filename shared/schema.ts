import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Material type enum - デフォルトで用意されている材質タイプ
export const DefaultMaterialTypes = {
  SPC: "SPC",
  SECC: "SECC",
  SUS: "SUS", // 在庫一覧のモーダルでは非表示
  SUS_MIGAKI: "SUS-MIGAKI",
  SUS_HL: "SUS-HL",
  A5052: "A5052",
} as const;

// Material Schema
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  materialType: text("material_type").notNull(),
  thickness: text("thickness").notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  hidden: boolean("hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 材質マスタースキーマ - カスタム材質タイプを管理するためのテーブル
export const materialTypes = pgTable("material_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Usage History Schema
export const usageHistory = pgTable("usage_history", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull(),
  materialType: text("material_type").notNull(),
  thickness: text("thickness").notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  purpose: text("purpose"),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export const insertUsageHistorySchema = createInsertSchema(usageHistory).omit({
  id: true,
  usedAt: true,
});

export const insertMaterialTypeSchema = createInsertSchema(materialTypes).omit({
  id: true,
  createdAt: true,
});

// カスタム材質タイプを含む文字列として扱う
export const materialTypeSchema = z.string().min(1, "材質タイプを入力してください");

// Type definitions
export type DefaultMaterialType = keyof typeof DefaultMaterialTypes;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type MaterialType = typeof materialTypes.$inferSelect;
export type InsertMaterialType = z.infer<typeof insertMaterialTypeSchema>;
export type UsageHistory = typeof usageHistory.$inferSelect;
export type InsertUsageHistory = z.infer<typeof insertUsageHistorySchema>;
