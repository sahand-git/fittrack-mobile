import test from 'node:test';
import assert from 'node:assert/strict';
import { detectLocale, normalizeSearch, translateText } from '../src/utils/localeCore.ts';

test('recognizes Sorani and Arabic device locales with English fallback', () => {
  assert.equal(detectLocale('ckb-IQ'), 'ckb');
  assert.equal(detectLocale('ar-SA'), 'ar');
  assert.equal(detectLocale('fr-FR'), 'en');
  assert.equal(detectLocale('ku-Arab-IQ'), 'ckb');
  assert.equal(detectLocale('ckb-invalid'), 'ckb');
  assert.equal(detectLocale('ckbfoo'), 'en');
});
test('translates known labels while preserving user-entered names and boundary whitespace', () => {
  const catalog = {Breakfast:'بەیانیانە'};
  assert.equal(translateText(' Breakfast ',catalog), ' بەیانیانە ');
  assert.equal(translateText('My homemade soup',catalog), 'My homemade soup');
});
test('search accepts Arabic/Persian letter variants and both numeral sets', () => {
  assert.equal(normalizeSearch('كیك ١٢۳'), normalizeSearch('کیک 123'));
  assert.equal(normalizeSearch('أَرُز'), normalizeSearch('ارز'));
  assert.equal(normalizeSearch('باد\u200cەم'), normalizeSearch('بادەم'));
});

test('locale catalogs (ckb.json and ar.json) have full key parity', async () => {
  const { readFileSync } = await import('node:fs');
  const ckb = JSON.parse(readFileSync(new URL('../src/locales/ckb.json', import.meta.url), 'utf8'));
  const ar = JSON.parse(readFileSync(new URL('../src/locales/ar.json', import.meta.url), 'utf8'));
  const ckbKeys = Object.keys(ckb).sort();
  const arKeys = Object.keys(ar).sort();
  const missingInAr = ckbKeys.filter(k => !(k in ar));
  const missingInCkb = arKeys.filter(k => !(k in ckb));
  assert.deepEqual(missingInAr, [], `ar.json is missing keys from ckb.json: ${missingInAr.join(', ')}`);
  assert.deepEqual(missingInCkb, [], `ckb.json is missing keys from ar.json: ${missingInCkb.join(', ')}`);
});
