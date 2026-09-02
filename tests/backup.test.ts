import test from 'node:test';
import assert from 'node:assert/strict';
import { exportBackupFile } from '../src/utils/backup.ts';

test('native export writes a UTF-8 file and hands its real URI to the share sheet', async () => {
  const calls: string[] = [];
  const json = JSON.stringify({profile:{name:'علي'},dailyLogs:{},customFoods:[],weightHistory:[]});
  const result = await exportBackupFile(json, { native:true,
    writeFile: async options => { calls.push('write');assert.equal(options.data,json);assert.equal(options.encoding,'utf8');assert.equal(options.directory,'CACHE');return {uri:'file:///cache/backup.json'}; },
    share: async options => { calls.push('share');assert.deepEqual(options.files,['file:///cache/backup.json']);return {}; }
  });
  assert.equal(result,'share');assert.deepEqual(calls,['write','share']);
});
test('failed file creation does not report success or open sharing', async () => {
  await assert.rejects(exportBackupFile('{}',{native:true,writeFile:async()=>{throw Error('Storage full');},share:async()=>{assert.fail('Must not share an unwritten file');}}),/Storage full/);
});
test('share cancellation is not reported as a saved backup', async () => {
  await assert.rejects(exportBackupFile('{}',{native:true,writeFile:async()=>({uri:'file:///cache/backup.json'}),share:async()=>{throw Error('Share canceled');}}),/canceled/);
});
