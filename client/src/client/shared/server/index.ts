import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { log, setupVite, serveStatic } from "./vite";
import { registerRoutes } from "./routes";
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
  server.listen(PORT, () => {
    log(`Server listening on port ${PORT}...`);
  });
}
main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
