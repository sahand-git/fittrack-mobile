import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleMicronutrients, sumMicronutrients } from '../src/utils/micronutrients.ts';

test('scales known nutrients and keeps missing values missing', () => {
  const result = scaleMicronutrients({ calciumMg: 120, vitaminDmcg: 2, ironMg: undefined }, 1.5);
  assert.equal(result.calciumMg, 180);
  assert.equal(result.vitaminDmcg, 3);
  assert.equal(result.ironMg, undefined);
});

test('totals nutrients and reports how many foods supplied each value', () => {
  const result = sumMicronutrients([{ calciumMg: 100, ironMg: 2 }, { calciumMg: 50, vitaminCmg: 8 }]);
  assert.deepEqual(result.calciumMg, { value: 150, coverage: 2 });
  assert.deepEqual(result.ironMg, { value: 2, coverage: 1 });
  assert.deepEqual(result.vitaminCmg, { value: 8, coverage: 1 });
  assert.equal(result.zincMg, undefined);
});
