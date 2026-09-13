import express from 'express';
import type { Request, Response, NextFunction } from 'express';

export const defaultLimits = { promptChars: 24000, imageBytes: 4 * 1024 * 1024, outputChars: 32000, outputTokens: 2048, timeoutMs: 30000, userDaily: 20, globalDaily: 500, userMinute: 4, globalMinute: 30 };
export type Limits = typeof defaultLimits;
export type AiInput = { prompt: string; json: boolean; image?: { data: string; mimeType: string } };
export type Capability = { enabled: boolean; isPremium: boolean; remaining: number; limit: number };
export interface Services {
  configured: boolean;
  verifyToken(token: string): Promise<{ uid: string; auth_time: number }>;
  status(uid: string): Promise<Capability>;
  reserve(uid: string): Promise<void>;
  generate(input: AiInput, signal: AbortSignal): Promise<string>;
  deleteAccount(uid: string): Promise<void>;
}
export class ApiError extends Error {
  status: number;
  constructor(status: number, code: string) { super(code); this.status = status; }
}
export function parseInput(body: unknown, limits: Limits): AiInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'invalid_request');
  const b = body as Record<string, unknown>;
  if (Object.keys(b).some(k => !['prompt', 'json', 'image'].includes(k)) || typeof b.prompt !== 'string' || !b.prompt.trim() || b.prompt.length > limits.promptChars || typeof b.json !== 'boolean') throw new ApiError(400, 'invalid_request');
  if (b.image !== undefined) {
    if (!b.image || typeof b.image !== 'object' || Array.isArray(b.image)) throw new ApiError(400, 'invalid_request');
    const i = b.image as Record<string, unknown>;
    if (Object.keys(i).some(k => !['data', 'mimeType'].includes(k)) || typeof i.mimeType !== 'string' || !['image/jpeg', 'image/png', 'image/webp'].includes(i.mimeType) || typeof i.data !== 'string' || !i.data || i.data.length > Math.ceil(limits.imageBytes / 3) * 4 || Buffer.from(i.data, 'base64').toString('base64') !== i.data || Buffer.from(i.data, 'base64').length > limits.imageBytes) throw new ApiError(400, 'invalid_request');
  }
  return b as AiInput;
}
export function createApp(services: Services, options: { allowedOrigins: string[]; limits?: Limits }) {
  const app = express();
  const limits = options.limits ?? defaultLimits;
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', 'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()', 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' });
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    const origin = req.get('Origin');
    if (origin) {
      if (!options.allowedOrigins.includes(origin)) return res.status(403).json({ error: 'origin_not_allowed' });
      res.set({ 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' });
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  const asyncRoute = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { void fn(req, res).catch(next); };
  const authenticate = async (req: Request) => {
    const match = /^Bearer ([^\s]+)$/.exec(req.get('Authorization') ?? '');
    if (!match || match[1].length > 8192) throw new ApiError(401, 'unauthorized');
    try { return await services.verifyToken(match[1]); } catch { throw new ApiError(401, 'unauthorized'); }
  };
  app.get('/api/health', (_req, res) => { res.json({ status: 'ok' }); });
  // Authenticate before allocating memory for potentially large image bodies.
  app.use(['/api/ai', '/api/account'], (req, res, next) => { void authenticate(req).then(identity => { res.locals.identity = identity; next(); }).catch(next); });
  app.use(express.json({ limit: Math.ceil(limits.imageBytes * 4 / 3) + limits.promptChars * 6 + 1024 }));
  app.get('/api/ai/status', asyncRoute(async (_req, res) => {
    const status = await services.status(res.locals.identity.uid);
    res.json({ ...status, enabled: services.configured && status.enabled });
  }));
  app.post('/api/ai/generate', asyncRoute(async (req, res) => {
    const input = parseInput(req.body, limits);
    if (!services.configured) throw new ApiError(503, 'ai_unavailable');
    await services.reserve(res.locals.identity.uid);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new ApiError(504, 'generation_timeout')); }, limits.timeoutMs); });
      const text = await Promise.race([services.generate(input, controller.signal), timeout]);
      if (!text || text.length > limits.outputChars) throw new ApiError(502, 'invalid_ai_response');
      res.json({ text });
    } finally { clearTimeout(timer); }
  }));
  app.delete('/api/account', asyncRoute(async (_req, res) => {
    const identity = res.locals.identity;
    const age = Date.now() / 1000 - identity.auth_time;
    if (!Number.isFinite(age) || age < -30 || age > 300) throw new ApiError(401, 'recent_login_required');
    await services.deleteAccount(identity.uid);
    res.sendStatus(204);
  }));
  app.use('/api', (_req, res) => { res.status(404).json({ error: 'not_found' }); });
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ApiError) { if (error.status === 429) res.set('Retry-After', '60'); res.status(error.status).json({ error: error.message }); return; }
    const parseError = error as { type?: string };
    if (parseError.type === 'entity.too.large') { res.status(413).json({ error: 'request_too_large' }); return; }
    if (parseError.type === 'entity.parse.failed') { res.status(400).json({ error: 'invalid_request' }); return; }
    res.status(503).json({ error: 'service_unavailable' });
  });
  return app;
}


