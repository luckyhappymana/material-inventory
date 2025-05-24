import express from "express";
import { json } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// データベース初期化の進行状況を追跡する変数
let databaseInitializing = false;
let databaseInitialized = false;

async function main() {
  const app = express();
  
  // ミドルウェアの設定
  app.use(json());
  
  // 静的ファイルの提供設定
  log("Setting up static file serving...");
  serveStatic(app);
  
  // データベースの初期化
  log("データベースの初期化を開始します...");
  databaseInitializing = true;
  
  try {
    // データベースの初期化コードをここに記述
    // すでに初期化されているかチェック
    if (databaseInitialized) {
      log("データベースは既に初期化されています。");
    } else {
      // テーブルが存在するかチェック
      const { storage } = await import("./storage");
      try {
        await storage.getMaterialTypes();
        log("データベースは既に初期化されています。");
      } catch (error: any) {
        // テーブルが存在しない場合はマイグレーションを実行
        if (error.code === '42P01') { // relation does not exist
          log("テーブルが存在しません。マイグレーションを実行します...");
          const { migrate } = await import("../migrations/setup");
          await migrate();
          log("データベースマイグレーションが完了しました。");
        } else {
          throw error;
        }
      }
      databaseInitialized = true;
    }
  } catch (error) {
    console.error("データベースの初期化中にエラーが発生しました:", error);
  } finally {
    databaseInitializing = false;
  }
  
  // 開発環境の場合はViteを設定
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app);
  }
  
  // ルーティングの設定
  try {
    const httpServer = await registerRoutes(app);
    
    // サーバーのポート設定
    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
      log(`Server listening on port ${port}...`);
    });
    
    return httpServer;
  } catch (error) {
    console.error("Failed to start server:", error);
    throw error;
  }
}

// メイン関数の実行
main().catch(console.error);
