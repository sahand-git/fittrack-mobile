import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NUTRIENT_META,
  combineNutrientTotals,
  parseNutrientAmount,
  scaleMicronutrients,
  sumMicronutrients,
  sumNutrientEntries
} from '../src/utils/micronutrients.ts';

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

test('validates manual nutrient amounts without replacing an empty draft', () => {
  assert.equal(parseNutrientAmount('12.5'), 12.5);
  for (const value of ['', '0', '-2', 'word', 'Infinity']) {
    assert.equal(parseNutrientAmount(value), null);
  }
});

test('separates food, manual, and supplement nutrient totals', () => {
  const added = sumNutrientEntries([
    {
      id: 'a',
      nutrient: 'vitaminDmcg',
      amount: 10,
      unit: 'mcg',
      sourceType: 'manual',
      loggedAt: '2026-09-07T09:00:00.000Z'
    },
    {
      id: 'b',
      nutrient: 'ironMg',
      amount: 5,
      unit: 'mg',
      sourceType: 'supplement',
      sourceName: 'Iron tablet',
      loggedAt: '2026-09-07T10:00:00.000Z'
    }
  ]);
  const total = combineNutrientTotals(
    { ironMg: { value: 3, coverage: 1 } },
    added,
    {}
  );
  assert.deepEqual(total.ironMg, {
    food: 3,
    manual: 0,
    supplement: 5,
    total: 8,
    coverage: 1
  });
  assert.equal(NUTRIENT_META.vitaminDmcg.group, 'vitamin');
  assert.equal(NUTRIENT_META.vitaminDmcg.unit, 'mcg');
});
