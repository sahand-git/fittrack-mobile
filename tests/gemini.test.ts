import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGemini, setGeminiKey, clearGeminiKey, parseMealResult, parseCoachResult } from '../src/utils/gemini.ts';

test('AI requires an explicitly supplied key, sends it only to Google in a header, and returns the actual answer', async () => {
  clearGeminiKey();
  await assert.rejects(generateGemini('hello', false, async () => { throw new Error('must not run'); }), /Set up Gemini/);
  setGeminiKey('test-only-key');
  assert.equal(await generateGemini('hello', false, async (url, headers, body: any) => {
    assert.equal(new URL(url).hostname, 'generativelanguage.googleapis.com');
    assert(!url.includes('test-only-key'));
    assert.equal(headers['x-goog-api-key'], 'test-only-key');
    assert.equal(body.contents[0].parts[0].text, 'hello');
    return { status: 200, data: { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Actual answer' }] } }] } };
  }), 'Actual answer');
  await assert.rejects(generateGemini('hello', false, async () => ({ status: 429, data: {} })), /quota/);
  await assert.rejects(generateGemini('hello', false, async () => ({ status: 403, data: {} })), /Google rejected/);
  clearGeminiKey();
});

test('meal estimates require valid quantities and compute totals from items', () => {
  const item = { name: 'Beef', portion: '100g cooked', servingGrams: 100, calories: 200, protein: 25, carbs: 0, fat: 10 };
  assert.equal(parseMealResult(JSON.stringify({ items: [item, item], totalCalories: 1 })).totalCalories, 400);
  assert.throws(() => parseMealResult(JSON.stringify({ items: [{ ...item, calories: -1 }] })), /valid food/);
  assert.throws(() => parseMealResult('{"items":[]}'), /valid food/);
  assert.throws(() => parseCoachResult('{}'), /incomplete/);
  assert.throws(() => parseCoachResult('not json'), /invalid/);
});
