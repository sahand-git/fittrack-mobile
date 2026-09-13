import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KURDISH_FOODS } from '../src/data/kurdishFoods.ts';
import { normalizeSearch } from '../src/utils/localeCore.ts';

const catalogs = ['ckb', 'ar'].map(locale => JSON.parse(readFileSync(new URL(`../src/locales/${locale}.json`, import.meta.url), 'utf8')) as Record<string, string>);

test('regional recipes have distinct IDs, explicit estimated provenance and plausible portions', () => {
  assert.equal(new Set(KURDISH_FOODS.map(food => food.id)).size, KURDISH_FOODS.length);
  assert.ok(KURDISH_FOODS.length >= 39);
  for (const food of KURDISH_FOODS) {
    assert.equal(food.source, 'custom', food.name);
    assert.ok(food.servingGrams! > 0 && food.servingGrams! <= 500, food.name);
    for (const key of ['calories', 'protein', 'carbs', 'fat'] as const) assert.ok(Number.isFinite(food[key]) && food[key] >= 0, `${food.id}: ${key}`);
    assert.ok(food.protein + food.carbs + food.fat <= food.servingGrams!, food.name);
    // Broad plausibility check, not a claim that calculated energy verifies a recipe.
    const energy = food.protein * 4 + food.carbs * 4 + food.fat * 9;
    assert.ok(Math.abs(food.calories - energy) <= Math.max(30, food.calories * 0.15), food.name);
  }
});

test('every regional name, portion and source label is localized in both languages', () => {
  for (const catalog of catalogs) for (const food of KURDISH_FOODS) {
    for (const label of [food.name, food.brand!, food.servingSize, food.category!]) {
      assert.ok(catalog[label]?.trim(), `Missing: ${label}`);
      assert.match(catalog[label], /[\u0600-\u06ff]/, label);
    }
  }
});

test('familiar Sorani food terms can find localized recipe names', () => {
  for (const term of ['یاپراخ', 'بریانی', 'کەلانە', 'شفتە', 'بامیە', 'دۆ', 'سەموون']) {
    assert.ok(KURDISH_FOODS.some(food => normalizeSearch(catalogs[0][food.name]).includes(normalizeSearch(term))), term);
  }
});

test('preparation names distinguish boiled kubba, cream without honey, and unsweetened tea', () => {
  assert.match(KURDISH_FOODS.find(f => f.id === 'kurdish_kubba_mosul')!.name, /boiled/);
  assert.doesNotMatch(KURDISH_FOODS.find(f => f.id === 'kurdish_kubba_mosul')!.name, /fried/);
  assert.match(KURDISH_FOODS.find(f => f.id === 'kurdish_qaymax')!.name, /without honey/);
  assert.ok(KURDISH_FOODS.find(f => f.id === 'iraqi_black_tea')!.calories < KURDISH_FOODS.find(f => f.id === 'kurdish_chai')!.calories);
});
