import express, { Express } from "express";
import { Server } from "http";

export function log(message: string, source = "express") {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  console.log(`${timeString} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  // 開発環境の場合のみViteの設定を行う
  try {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "custom",
    });

    app.use(vite.middlewares);
    log("Vite middleware configured");
  } catch (error) {
    console.error("Failed to setup Vite:", error);
  }
}

export function serveStatic(app: Express) {
  // 本番環境の場合は静的ファイルを提供
  if (process.env.NODE_ENV === "production") {
    // 絶対パスで指定
    const staticPath = '/opt/render/project/src/client/dist';
    app.use(express.static(staticPath));
    log(`Serving static files from: ${staticPath}`);
  }
}
