import express, { type Express, Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes.js';
import { log, setupVite } from './vite.js';
import { storage } from './storage.js';

async function main() {
  const app: Express = express();
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 10000;
  
  log('Setting up static file serving...');
  
  if (isProduction) {
    // 本番環境では静的ファイルを直接提供
    log('Serving static files from: client/dist');
    app.use(express.static('client/dist'));
    
    // すべてのルートに対してindex.htmlを返す
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile('client/dist/index.html', { root: '.' });
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
