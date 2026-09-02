import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readHealthSteps } from '../src/utils/health.ts';

// SDK doubles isolate native permission/data responses; the real reader is exercised.
function health(overrides: Record<string, unknown> = {}) {
  return {
    isAvailable: async () => ({ available: true }),
    requestAuthorization: async (options: unknown) => {
      assert.deepEqual(options, { read: ['steps'], write: [] });
      return { readAuthorized: ['steps'], readDenied: [], writeAuthorized: [], writeDenied: [] };
    },
    queryAggregated: async (options: any) => {
      assert.equal(options.dataType, 'steps');
      assert.equal(options.aggregation, 'sum');
      const from = new Date(options.startDate), to = new Date(options.endDate);
      assert.equal(from.getHours(), 0);
      assert.equal(from.getDate(), 1);
      assert.equal(to.getDate(), 2);
      return { samples: [{ value: 1234 }] };
    },
    ...overrides,
  } as any;
}

test('web cannot report native health access', async () => {
  await assert.rejects(readHealthSteps('2026-09-01', 'web', health()), /installed/);
});
test('unavailable Android provider leaves the caller without a total', async () => {
  await assert.rejects(readHealthSteps('2026-09-01', 'android', health({isAvailable: async () => ({available:false})})), /unavailable/);
});
test('denied Android permission must not read or return steps', async () => {
  await assert.rejects(readHealthSteps('2026-09-01', 'android', health({
    requestAuthorization: async () => ({readAuthorized:[],readDenied:['steps']}),
    queryAggregated: async () => {throw Error('Unexpected read');},
  })), /not granted/);
});
test('reads a local calendar day and returns an absolute total on both platforms', async () => {
  for (const platform of ['android','ios']) {
    assert.equal(await readHealthSteps('2026-09-01', platform, health()),1234);
    assert.equal(await readHealthSteps('2026-09-01', platform, health()),1234);
  }
});
test('iOS empty data is not proof of read authorization and does not produce zero', async () => {
  assert.equal(await readHealthSteps('2026-09-01','ios',health({
    requestAuthorization: async () => ({readAuthorized:[],readDenied:['steps']}),
    queryAggregated: async () => ({samples:[]}),
  })),null);
});
test('zero results and bad samples cannot erase or corrupt a saved total', async () => {
  assert.equal(await readHealthSteps('2026-09-01','ios',health({queryAggregated: async () => ({samples:[{value:0}]})})),null);
  for (const value of [-1, NaN, Infinity]) {
    await assert.rejects(readHealthSteps('2026-09-01','android',health({queryAggregated: async () => ({samples:[{value}]})})), /invalid/);
  }
});
