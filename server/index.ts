import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { log, setupVite, serveStatic } from "./vite";
import { registerRoutes } from "./routes";
import { db } from "./db";
import { materialTypes, DefaultMaterialTypes } from "@shared/schema";
import { DatabaseStorage } from "./DatabaseStorage";
async function main() {
  const app = express();
  const server = createServer(app);
  if (process.env.NODE_ENV === "development") {
    log("Setting up Vite development middleware...");
    await setupVite(app, server);
  } else {
    log("Setting up static file serving...");
    serveStatic(app);
  }
  // Handle JSON bodies
  app.use(express.json());
  // データベースの初期化
  try {
    log("データベースの初期化を開始します...");
    
    // material_typesテーブルが存在するか確認
    const checkTable = async () => {
      try {
        await db.query.materialTypes.findFirst();
        return true;
      } catch (error) {
        return false;
      }
    };
    
    const tableExists = await checkTable();
    
    if (!tableExists) {
      log("テーブルが存在しません。マイグレーションを実行します...");
      
      // material_typesテーブルを作成
      await db.execute(`
        CREATE TABLE IF NOT EXISTS material_types (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      
      // materialsテーブルを作成
      await db.execute(`
        CREATE TABLE IF NOT EXISTS materials (
          id SERIAL PRIMARY KEY,
          material_type TEXT NOT NULL,
          thickness TEXT NOT NULL,
          width_mm INTEGER NOT NULL,
          height_mm INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          hidden BOOLEAN DEFAULT FALSE NOT NULL
        );
      `);
      
      // usage_historyテーブルを作成
      await db.execute(`
        CREATE TABLE IF NOT EXISTS usage_history (
          id SERIAL PRIMARY KEY,
          material_type TEXT NOT NULL,
          thickness TEXT NOT NULL,
          width_mm INTEGER NOT NULL,
          height_mm INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          action TEXT NOT NULL
        );
      `);
      
      // デフォルトの材質タイプを追加
      for (const [name, color] of Object.entries(DefaultMaterialTypes)) {
        await db.insert(materialTypes).values({
          name,
          color,
        }).onConflictDoNothing();
      }
      
      log("データベースマイグレーションが完了しました。");
    } else {
      log("データベースは既に初期化されています。");
    }
  } catch (error) {
    console.error("データベースの初期化中にエラーが発生しました:", error);
  }
  // Initialize server state
  await registerRoutes(app);
  // Error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({
      error: "サーバーエラーが発生しました。",
      message: err.message,
    });
  });
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server listening on port ${PORT}...`);
  });
}
main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
