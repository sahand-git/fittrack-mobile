import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuotaService } from '../server/quota.ts';
import { defaultLimits } from '../server/app.ts';
import type { Store, Transaction } from '../server/quota.ts';
// Serialized in-memory transactions model atomic commits; production uses Firestore's transactions.
function memoryStore() {
  const data = new Map<string, Record<string, unknown>>();
  let queue = Promise.resolve();
  const store: Store = {
    get: async path => data.get(path),
    transaction: async work => {
      const previous = queue; let unlock!: () => void;
      queue = new Promise(resolve => { unlock = resolve; }); await previous;
      const staged = new Map<string, Record<string, unknown>>();
      try { const result = await work({ get: async path => data.get(path), set: (path, value) => { staged.set(path, value); } } as Transaction); staged.forEach((v, k) => data.set(k, v)); return result; } finally { unlock(); }
    },
  };
  return { data, store };
}
test('parallel reservations atomically respect global daily budget across accounts', async () => {
  const { data, store } = memoryStore();
  for (const uid of ['alice', 'bob']) data.set('accounts/' + uid, { aiEnabled: true, isPremium: true });
  const service = createQuotaService(store, { ...defaultLimits, globalDaily: 3 }, () => 1_800_000_000_000);
  const results = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => service.reserve(i % 2 ? 'alice' : 'bob')));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 3);
});
test('paid server entitlement required and expired entitlement denied', async () => {
  const { data, store } = memoryStore();
  const service = createQuotaService(store, defaultLimits, () => 1_800_000_000_000);
  for (const value of [{}, { aiEnabled: true, isPremium: false }, { aiEnabled: true, isPremium: true, expiresAt: 1_700_000_000_000 }, { aiEnabled: true, isPremium: true, expiresAt: 'invalid' }]) {
    data.set('accounts/alice', value);
    await assert.rejects(service.reserve('alice'), { message: 'ai_not_enabled' });
  }
});
test('durable minute limit resets with time while daily use remains', async () => {
  const { data, store } = memoryStore(); let now = 1_800_000_000_000;
  data.set('accounts/alice', { aiEnabled: true, isPremium: true });
  const service = createQuotaService(store, { ...defaultLimits, userMinute: 1 }, () => now);
  await service.reserve('alice');
  await assert.rejects(service.reserve('alice'), { message: 'rate_limited' });
  now += 60_000; await service.reserve('alice');
  assert.equal((await service.status('alice')).remaining, 18);
});
test('deleting accounts cannot reserve quota', async () => {
  const { data, store } = memoryStore();
  data.set('accounts/alice', { aiEnabled: true, isPremium: true });
  data.set('accountDeletions/alice', { expiresAt: Date.now() + 86_400_000 });
  await assert.rejects(createQuotaService(store, defaultLimits).reserve('alice'), { message: 'ai_not_enabled' });
});
