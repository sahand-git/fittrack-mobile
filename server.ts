import path from 'node:path';
import express from 'express';
import dotenv from 'dotenv';
import { createApp } from './server/app.ts';
import { createProductionServices, readLimits } from './server/services.ts';

dotenv.config();
async function start() {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  const limits = readLimits(process.env);
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || (process.env.NODE_ENV === 'production' ? '' : `http://localhost:${port},http://127.0.0.1:${port}`)).split(',').map(s => s.trim()).filter(Boolean);
  const app = createApp(createProductionServices(process.env, limits), { allowedOrigins, limits });
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    // Never expose dist/server.cjs, source maps, secrets, or the repository root.
    const clientDirectory = path.resolve(process.cwd(), 'dist', 'client');
    app.use(express.static(clientDirectory, { dotfiles: 'deny' }));
    app.get('*', (_req, res) => { res.sendFile(path.join(clientDirectory, 'index.html')); });
  }
  const server = app.listen(port, '0.0.0.0', () => console.log(`FitTrack server listening on port ${port}`));
  server.requestTimeout = 45000;
  server.headersTimeout = 15000;
}
start().catch(() => { console.error('Server startup failed. Check server configuration.'); process.exitCode = 1; });
