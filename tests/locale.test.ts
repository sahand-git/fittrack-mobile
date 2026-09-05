import test from 'node:test';
import assert from 'node:assert/strict';
import { detectLocale, normalizeSearch, translateText } from '../src/utils/localeCore.ts';

test('recognizes Sorani and Arabic device locales with English fallback', () => {
  assert.equal(detectLocale('ckb-IQ'), 'ckb');
  assert.equal(detectLocale('ar-SA'), 'ar');
  assert.equal(detectLocale('fr-FR'), 'en');
});
test('translates known labels while preserving user-entered names and boundary whitespace', () => {
  const catalog = {Breakfast:'بەیانیانە'};
  assert.equal(translateText(' Breakfast ',catalog), ' بەیانیانە ');
  assert.equal(translateText('My homemade soup',catalog), 'My homemade soup');
});
test('search accepts Arabic/Persian letter variants and both numeral sets', () => {
  assert.equal(normalizeSearch('كیك ١٢۳'), normalizeSearch('کیک 123'));
  assert.equal(normalizeSearch('أَرُز'), normalizeSearch('ارز'));
});
