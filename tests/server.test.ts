import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, defaultLimits } from '../server/app.ts';
import type { Services } from '../server/app.ts';

async function harness(overrides: Partial<Services> = {}, timeoutMs = defaultLimits.timeoutMs) {
  const calls: string[] = [];
  const services: Services = {
    configured: true,
    verifyToken: async token => { if (token !== 'valid') throw new Error('secret token detail'); return { uid: 'alice', auth_time: Date.now() / 1000 }; },
    status: async () => ({ enabled: true, isPremium: true, remaining: 20, limit: 20 }),
    reserve: async () => { calls.push('reserve'); },
    generate: async () => { calls.push('generate'); return 'result'; },
    deleteAccount: async uid => { calls.push('delete:' + uid); },
    ...overrides,
  };
  const server = createApp(services, { allowedOrigins: ['https://fit.example'], limits: { ...defaultLimits, timeoutMs } }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  return { calls, request: (path: string, init: RequestInit = {}) => fetch(base + path, { ...init, headers: { Authorization: 'Bearer valid', 'Content-Type': 'application/json', ...init.headers } }), close: () => new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeAllConnections(); }) };
}
const payload = JSON.stringify({ prompt: 'Estimate lunch', json: true });

test('rejects missing and revoked credentials before any chargeable work', async () => {
  const h = await harness();
  try { for (const token of ['', 'Bearer revoked']) { const r = await h.request('/api/ai/generate', { method: 'POST', headers: { Authorization: token }, body: payload }); assert.equal(r.status, 401); assert.deepEqual(await r.json(), { error: 'unauthorized' }); } assert.deepEqual(h.calls, []); } finally { await h.close(); }
});
test('reserves budget before generation and returns bounded contract', async () => {
  const h = await harness();
  try { const r = await h.request('/api/ai/generate', { method: 'POST', body: payload }); assert.equal(r.status, 200); assert.deepEqual(await r.json(), { text: 'result' }); assert.deepEqual(h.calls, ['reserve', 'generate']); assert.equal(r.headers.get('cache-control'), 'no-store'); } finally { await h.close(); }
});
test('unconfigured server denies AI and reports disabled status', async () => {
  const h = await harness({ configured: false });
  try { assert.equal((await h.request('/api/ai/generate', { method: 'POST', body: payload })).status, 503); const r = await h.request('/api/ai/status'); assert.deepEqual(await r.json(), { enabled: false, isPremium: true, remaining: 20, limit: 20 }); assert.deepEqual(h.calls, []); } finally { await h.close(); }
});
test('rejects forged client entitlement fields and oversized prompts or invalid image', async () => {
  const h = await harness();
  try { for (const body of [{ prompt: 'ok', json: false, isPremium: true }, { prompt: 'x'.repeat(defaultLimits.promptChars + 1), json: true }, { prompt: 'ok', json: false, image: { mimeType: 'image/svg+xml', data: 'PHN2Zz4=' } }, { prompt: 'ok', json: false, image: { mimeType: 'image/png', data: 'not-base64' } }]) { assert.equal((await h.request('/api/ai/generate', { method: 'POST', body: JSON.stringify(body) })).status, 400); } assert.deepEqual(h.calls, []); } finally { await h.close(); }
});
test('entitlement or quota rejection cannot generate', async () => {
  const { ApiError } = await import('../server/app.ts');
  for (const [status, code] of [[403, 'ai_not_enabled'], [429, 'quota_exceeded']] as const) {
    const h = await harness({ reserve: async () => { throw new ApiError(status, code); } });
    try { const r = await h.request('/api/ai/generate', { method: 'POST', body: payload }); assert.equal(r.status, status); assert.deepEqual(h.calls, []); } finally { await h.close(); }
  }
});
test('provider errors are redacted and reservations are not refunded', async () => {
  const h = await harness({ generate: async () => { throw new Error('GEMINI_API_KEY=secret with user data'); } });
  try { const r = await h.request('/api/ai/generate', { method: 'POST', body: payload }); assert.equal(r.status, 503); assert.deepEqual(await r.json(), { error: 'service_unavailable' }); assert.deepEqual(h.calls, ['reserve']); } finally { await h.close(); }
});
test('CORS allowlist rejects unknown origins and serves explicit preflight', async () => {
  const h = await harness();
  try { assert.equal((await h.request('/api/ai/status', { headers: { Origin: 'https://evil.example' } })).status, 403); const r = await h.request('/api/ai/generate', { method: 'OPTIONS', headers: { Origin: 'https://fit.example' } }); assert.equal(r.status, 204); assert.equal(r.headers.get('access-control-allow-origin'), 'https://fit.example'); } finally { await h.close(); }
});
test('account deletion requires recent authentication before touching any data', async () => {
  const h = await harness({ verifyToken: async () => ({ uid: 'alice', auth_time: Date.now() / 1000 - 301 }) });
  try { const r = await h.request('/api/account', { method: 'DELETE' }); assert.equal(r.status, 401); assert.deepEqual(await r.json(), { error: 'recent_login_required' }); assert.deepEqual(h.calls, []); } finally { await h.close(); }
});
test('account deletion uses verified identity and returns no content', async () => {
  const h = await harness();
  try { const r = await h.request('/api/account', { method: 'DELETE' }); assert.equal(r.status, 204); assert.deepEqual(h.calls, ['delete:alice']); } finally { await h.close(); }
});
test('removed endpoints and API file paths return 404', async () => {
  const h = await harness();
  try { for (const path of ['/api/ai-chat', '/api/barcode/custom', '/api/server.cjs']) assert.equal((await h.request(path, { method: 'POST' })).status, 404); } finally { await h.close(); }
});

test('malformed JSON has a redacted 400 response and does not reserve quota', async () => {
  const h = await harness();
  try { const r = await h.request('/api/ai/generate', { method: 'POST', body: '{bad private payload' }); assert.equal(r.status, 400); assert.deepEqual(await r.json(), { error: 'invalid_request' }); assert.deepEqual(h.calls, []); } finally { await h.close(); }
});
test('oversized model output is rejected instead of forwarded', async () => {
  const h = await harness({ generate: async () => 'x'.repeat(defaultLimits.outputChars + 1) });
  try { const r = await h.request('/api/ai/generate', { method: 'POST', body: payload }); assert.equal(r.status, 502); assert.deepEqual(await r.json(), { error: 'invalid_ai_response' }); } finally { await h.close(); }
});
test('valid maximum-size image is accepted while an oversized image is rejected', async () => {
  const h = await harness();
  try {
    const image = { mimeType: 'image/jpeg', data: Buffer.alloc(defaultLimits.imageBytes).toString('base64') };
    const r = await h.request('/api/ai/generate', { method: 'POST', body: JSON.stringify({ prompt: 'Estimate', json: true, image }) });
    assert.equal(r.status, 200);
    image.data = Buffer.alloc(defaultLimits.imageBytes + 1).toString('base64');
    const oversized = await h.request('/api/ai/generate', { method: 'POST', body: JSON.stringify({ prompt: 'Estimate', json: true, image }) });
    assert.equal(oversized.status, 400);
  } finally { await h.close(); }
});


test('generation timeout aborts provider work and preserves the spent reservation', async () => {
  let aborted = false;
  const h = await harness({ generate: async (_input, signal) => {
    signal.addEventListener('abort', () => { aborted = true; });
    return new Promise<string>(() => {});
  } }, 20);
  try {
    const r = await h.request('/api/ai/generate', { method: 'POST', body: payload });
    assert.equal(r.status, 504); assert.deepEqual(await r.json(), { error: 'generation_timeout' });
    assert.equal(aborted, true); assert.deepEqual(h.calls, ['reserve']);
  } finally { await h.close(); }
});
