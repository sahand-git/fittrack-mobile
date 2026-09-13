import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ckb = JSON.parse(readFileSync(new URL('../src/locales/ckb.json', import.meta.url), 'utf8')) as Record<string, string>;
const ar = JSON.parse(readFileSync(new URL('../src/locales/ar.json', import.meta.url), 'utf8')) as Record<string, string>;

test('catalog values are nonempty and preserve interpolation tokens', () => {
  const tokens = (s: string) => [...s.matchAll(/\{\{?\w+\}?\}|%[sd]/g)].map(m => m[0]).sort();
  for (const catalog of [ckb, ar]) for (const [key, value] of Object.entries(catalog)) {
    assert.ok(typeof value === 'string' && value.trim(), key);
    assert.deepEqual(tokens(value), tokens(key), key);
  }
});

test('Sorani text has no translation markers, wrong script variants or known semantic regressions', () => {
  for (const [key, value] of Object.entries(ckb)) {
    assert.doesNotMatch(value, /\[\[FT\d|�|[كيىة]/, key);
    if (!/[\[\]]/.test(key)) assert.doesNotMatch(value, /[\[\]]/, key);
    if (/Gemini/.test(key)) assert.doesNotMatch(value, /دووانە/, key);
    if (/serving|portion/i.test(key)) assert.doesNotMatch(value, /خزمەتگوزاری|پێشکەشکردن/, key);
  }
  assert.doesNotMatch(ckb.Disabled, /ئەندام/);
  assert.doesNotMatch(ckb['3. Watch'], /بینەر/);
  assert.doesNotMatch(ckb['Delete entry'], /ژوورەوە/);
  assert.match(ckb['Cloud backup checked.'], /پشکنرا/);
});

test('food categories and core nutrition terms use consistent Sorani wording', () => {
  for (const key of ['Dairy', 'Beverages', 'Grains', 'Meat', 'Bakery', 'Protein', 'Carbs', 'Calories', 'Fat']) {
    assert.equal(ckb[key], ckb[key.toLowerCase()], key);
  }
  assert.match(ckb['Portion Servings'], /بەش/);
  assert.equal(ckb.Workout, ckb.workout);
  assert.equal(ckb['privacy notice'], ckb['Privacy notice']);
});
