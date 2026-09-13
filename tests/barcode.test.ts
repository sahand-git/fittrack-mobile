import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupBarcode, normalizeProduct } from '../src/utils/barcode.ts';

const code = '3017620422003';
const product = { product_name: 'Test cereal', brands: 'Example', serving_size: '30 g', serving_quantity: 30,
  nutriments: { 'energy-kcal_100g': 400, proteins_100g: 10, carbohydrates_100g: 70, fat_100g: 8,
    fiber_100g: 5, sugars_100g: 12, sodium_100g: 0.2 } };

test('native barcode uses the public HTTPS food API without a local server', async () => {
  let requested = '';
  const food = await lookupBarcode(code, [], { native: true, nativeGet: async options => {
    requested = options.url;
    assert.equal(options.responseType, 'json');
    return { status: 200, data: { status: 1, product }, headers: {}, url: requested };
  }, fetch: async () => { throw new Error('Native lookup must use native HTTP'); } });
  assert.equal(new URL(requested).origin, 'https://world.openfoodfacts.org');
  assert.equal(food.name, 'Test cereal');
  assert.equal(food.calories, 120);
  assert.equal(food.protein, 3);
  assert.equal(food.fiber, 1.5);
  assert.equal(food.sodium, 60);
});

test('browser barcode lookup also works without an Express backend', async () => {
  const food = await lookupBarcode(code, [], { native: false, fetch: async url => {
    assert.match(String(url), /^https:\/\/world\.openfoodfacts\.org\/api\/v2\/product\//);
    return new Response(JSON.stringify({ status: 1, product }), { status: 200 });
  } });
  assert.equal(food.carbs, 21);
});

test('previously saved food can be scanned offline with its original nutrients', async () => {
  const food = normalizeProduct(code, product);
  const result = await lookupBarcode(` ${code} `, [food], { native: false,
    fetch: async () => { throw new Error('No network should be needed'); } });
  assert.deepEqual(result, food);
});

test('zero nutrients stay zero and every nutrient uses the same serving', () => {
  const food = normalizeProduct(code, { ...product, nutriments: { ...product.nutriments, 'energy-kcal_100g': 0, proteins_100g: 0, sodium_100g: 0 } });
  assert.equal(food.calories, 0);
  assert.equal(food.protein, 0);
  assert.equal(food.sodium, 0);
  assert.equal(food.sugars, 3.6);
});

test('missing serving weight falls back to a clearly labelled 100 g portion', () => {
  const food = normalizeProduct(code, { ...product, serving_quantity: undefined, serving_size: 'one bowl' });
  assert.equal(food.servingSize, '100 g');
  assert.equal(food.servingGrams, 100);
  assert.equal(food.calories, 400);
});

test('rejects incomplete nutrition instead of inventing zero values', () => {
  assert.throws(() => normalizeProduct(code, { ...product, nutriments: { 'energy-kcal_100g': 10 } }), /nutrition.*incomplete/i);
});

test('invalid codes and different service failures have useful errors', async () => {
  const offline = async () => { throw new Error('offline'); };
  await assert.rejects(lookupBarcode('https://example.com', [], { fetch: offline }), /barcode number/i);
  for (const [status, pattern] of [[404, /not found/i], [429, /too many/i], [503, /temporarily unavailable/i]] as const) {
    await assert.rejects(lookupBarcode(code, [], { native: false, fetch: async () => new Response('{}', { status }) }), pattern);
  }
  await assert.rejects(lookupBarcode(code, [], { native: false, fetch: offline }), /could not reach/i);
  await assert.rejects(lookupBarcode(code, [], { native: false, fetch: async () => new Response('<html>app</html>') }), /invalid response/i);
});
