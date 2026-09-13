import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteServerAccount } from '../server/account.ts';

test('data deletion failure preserves identity and tombstone so deletion is retryable', async () => {
  const records = new Set(['fitnessBackups/alice', 'accounts/alice']);
  let identityExists = true, blocked = false, fail = true;
  const service = {
    markDeleting: async () => { blocked = true; },
    deleteTree: async (path: string) => { assert.equal(blocked, true); if (path === 'accounts/alice' && fail) throw new Error('temporary failure'); records.delete(path); },
    deleteIdentity: async () => { assert.equal(records.size, 0); identityExists = false; },
  };
  await assert.rejects(deleteServerAccount('alice', service), /temporary failure/);
  assert.equal(identityExists, true); assert.equal(blocked, true);
  fail = false;
  await deleteServerAccount('alice', service);
  assert.equal(identityExists, false); assert.equal(records.size, 0); assert.equal(blocked, true);
});
test('failed deletion marker prevents data or identity removal', async () => {
  let touched = false;
  await assert.rejects(deleteServerAccount('alice', {
    markDeleting: async () => { throw new Error('storage unavailable'); },
    deleteTree: async () => { touched = true; },
    deleteIdentity: async () => { touched = true; },
  }), /storage unavailable/);
  assert.equal(touched, false);
});
