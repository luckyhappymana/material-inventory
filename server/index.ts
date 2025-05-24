import express, { type Express, Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes.js';
import { log, setupVite } from './vite.js';
import { storage } from './storage.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { dirname, join } from 'path';

async function main() {
  const app: Express = express();
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 10000;
  
  log('Setting up static file serving...');
  
  if (isProduction) {
    // 本番環境では静的ファイルを直接提供
    // 正しいパスを指定
    const staticPath = '../dist/public';
    log(`Serving static files from: ${staticPath}`);
    app.use(express.static(staticPath));
    
    // すべてのルートに対してindex.htmlを返す
    const indexPath = join(staticPath, 'index.html');
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      // ファイルが存在するか確認してから送信
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, { root: '.' });
      } else {
        log(`Error: index.html not found at ${indexPath}`);
        res.status(404).send('Index file not found');
      }
    });
  } else {
    // 開発環境ではViteを使用
    await setupVite(app);
  }
  
  // データベースの初期化
  log('データベースの初期化を開始します...');
  try {
    await storage.initializeDefaultMaterialTypes();
    log('データベースは既に初期化されています。');
  } catch (error) {
    log('データベースの初期化中にエラーが発生しました: ' + error);
  }
  
  // APIルートの登録
  const server = await registerRoutes(app);
  
  // エラーハンドリング
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  });
  
  // サーバー起動
  server.listen(port, '0.0.0.0', () => {
    log(`Server listening on port ${port}...`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
