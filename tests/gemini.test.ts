import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGemini, setGeminiKey, clearGeminiKey, parseMealResult, parseCoachResult, geminiResponseError, availableGeminiModels, connectGemini, hasGeminiKey } from '../src/utils/gemini.ts';

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
  await assert.rejects(generateGemini('hello', false, async () => ({ status: 403, data: {} })), /not allowed/);
  clearGeminiKey();
});

test('404 is not mislabeled temporary and Google details redact the key', () => {
  const err=geminiResponseError(404,{error:{message:'Model unavailable for my-secret-key'}},'my-secret-key');
  assert.match(err.message,/HTTP 404/); assert.match(err.message,/model is unavailable/); assert(!err.message.includes('my-secret-key'));
});

test('temporary errors retry with backoff; exhausted quota does not retry', async () => {
  setGeminiKey('test-key'); let calls=0; const waits:number[]=[];
  const result=await generateGemini('hello',false,async()=> (++calls<3 ? {status:503,data:{error:{message:'overloaded'}}} : {status:200,data:{candidates:[{content:{parts:[{text:'OK'}]}}]}}),async ms=>{waits.push(ms);});
  assert.equal(result,'OK'); assert.equal(calls,3); assert.deepEqual(waits,[750,1500]);
  calls=0; await assert.rejects(generateGemini('hello',false,async()=>{calls++;return {status:429,data:{}};},async()=>{}),/quota/);assert.equal(calls,1);clearGeminiKey();
});

test('model discovery filters media models and connection succeeds only after generation', async () => {
  const models=await availableGeminiModels('test-key',async(_url,_headers,_body,method)=>{assert.equal(method,'GET');return {status:200,data:{models:[{name:'models/gemini-2.5-flash',supportedGenerationMethods:['generateContent']},{name:'models/gemini-3.5-flash-lite',supportedGenerationMethods:['generateContent']},{name:'models/gemini-3-pro-image',supportedGenerationMethods:['generateContent']}]}};});
  assert.deepEqual(models,['gemini-3.5-flash-lite','gemini-2.5-flash']);clearGeminiKey();
  await assert.rejects(connectGemini('bad-key',models[0],async()=>({status:403,data:{}})),/not allowed/);assert.equal(hasGeminiKey(),false);
  await connectGemini('valid-test-key',models[0],async()=>({status:200,data:{candidates:[{content:{parts:[{text:'OK'}]}}]}}));assert.equal(hasGeminiKey(),true);clearGeminiKey();
});

test('meal estimates require valid quantities and compute totals from items', () => {
  const item = { name: 'Beef', portion: '100g cooked', servingGrams: 100, calories: 200, protein: 25, carbs: 0, fat: 10 };
  assert.equal(parseMealResult(JSON.stringify({ items: [item, item], totalCalories: 1 })).totalCalories, 400);
  assert.throws(() => parseMealResult(JSON.stringify({ items: [{ ...item, calories: -1 }] })), /valid food/);
  assert.throws(() => parseMealResult('{"items":[]}'), /valid food/);
  assert.throws(() => parseCoachResult('{}'), /incomplete/);
  assert.throws(() => parseCoachResult('not json'), /invalid/);
});
