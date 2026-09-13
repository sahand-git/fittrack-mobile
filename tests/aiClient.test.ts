import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIClient } from '../src/utils/aiClient.ts';

test('AI requires an account and consent before sending any personal data', async () => {
  let calls = 0;
  const client = createAIClient(async () => { calls++; return {status:200, data:{text:'answer'}}; });
  await assert.rejects(client.generate('meal', false), /Sign in/);
  client.setAccount('a', async () => 'token-a');
  await assert.rejects(client.generate('meal', false), /consent/);
  assert.equal(calls, 0);
  client.setConsent(true);
  assert.equal(await client.generate('meal',false), 'answer');
});

test('client sends a Firebase bearer token to its own API and never a Gemini key', async () => {
  const client = createAIClient(async (path,headers,body) => {
    assert.equal(path, '/api/ai/generate');
    assert.deepEqual(headers, {'Content-Type':'application/json', Authorization:'Bearer firebase-token'});
    assert.deepEqual(body,{prompt:'rice',json:true});
    return {status:200,data:{text:'real reply'}};
  });
  client.setAccount('a',async ()=>'firebase-token');client.setConsent(true);
  assert.equal(await client.generate('rice',true),'real reply');
});

test('account switch clears consent and ignores a prior account response', async () => {
  let finish!: (v:any)=>void;
  const client = createAIClient(async () => new Promise(resolve=>{finish=resolve;}));
  client.setAccount('a', async ()=>'a');client.setConsent(true);
  const pending=client.generate('meal',false);
  await new Promise(resolve=>setImmediate(resolve));
  client.setAccount('b',async ()=>'b');
  finish({status:200,data:{text:'private answer'}});
  await assert.rejects(pending,/account changed/);
  assert.equal(client.getStatus().consent,false);
  assert.equal(client.getStatus().isPremium,false);
});

test('failed, limited or malformed AI responses never become fabricated success', async () => {
  for(const reply of [{status:429,data:{error:'quota_exceeded'}},{status:500,data:{error:'AIza-secret'}},{status:200,data:{}}]) {
    const client=createAIClient(async()=>reply);client.setAccount('a',async()=>'a');client.setConsent(true);
    await assert.rejects(client.generate('meal',false),error=>error instanceof Error && !error.message.includes('AIza'));
  }
});

test('stale status never grants the next account premium access', async()=>{
  let finish!: (v:any)=>void;
  const client=createAIClient(async()=>new Promise(resolve=>{finish=resolve;}));
  client.setAccount('a',async()=>'a');const pending=client.refresh();
  await new Promise(resolve=>setImmediate(resolve));client.setAccount('b',async()=>'b');
  finish({status:200,data:{enabled:true,isPremium:true,remaining:10,limit:10}});
  await assert.rejects(pending,/account changed/);assert.equal(client.getStatus().isPremium,false);
});
