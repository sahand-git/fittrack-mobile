import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMealResult, parseCoachResult } from '../src/utils/gemini.ts';

test('meal estimates require valid quantities and compute totals from items', () => {
  const item = { name: 'Beef', portion: '100g cooked', servingGrams: 100, calories: 200, protein: 25, carbs: 0, fat: 10 };
  assert.equal(parseMealResult(JSON.stringify({ items: [item, item], totalCalories: 1 })).totalCalories, 400);
  assert.throws(() => parseMealResult(JSON.stringify({ items: [{ ...item, calories: -1 }] })), /valid food/);
  assert.throws(() => parseMealResult('{"items":[]}'), /valid food/);
  assert.throws(() => parseCoachResult('{}'), /incomplete/);
  assert.throws(() => parseCoachResult('not json'), /invalid/);
});
