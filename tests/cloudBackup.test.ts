import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBackup, serializeBackup, nextRevision, validateCloudDocument, CLOUD_MAX_BYTES } from '../src/utils/cloudBackupCore.ts';
import { readFileSync } from 'node:fs';

const sample = () => ({version:'2.0',exportedAt:'2026-09-03T00:00:00.000Z', profile:{name:'Test',email:'test@example.com',gender:'male',age:26,heightCm:175,weightKg:75,targetWeightKg:70,activityLevel:'moderate',goal:'maintenance',includeStepsInCalorieBudget:true,stepGoal:10000,waterGoalMl:2500,bmr:1700,tdee:2600,targetCalories:2600,targetProtein:150,targetCarbs:300,targetFat:80,profileCompleted:true,isGoogleConnected:false,onboardingVersion:1},dailyLogs:{'2026-09-03':{date:'2026-09-03',meals:{breakfast:[],lunch:[],dinner:[],snack:[]},waterMl:250,steps:10,stepCaloriesBurned:1,workouts:[]}},customFoods:[],weightHistory:[{date:'2026-09-03',weightKg:75}]});

test('backup round trip retains fitness records',()=>{
 const result=parseBackup(serializeBackup(sample()));
 assert.equal(result.dailyLogs['2026-09-03'].waterMl,250);
 assert.equal(result.weightHistory[0].weightKg,75);
 assert.equal(result.profile.onboardingVersion,1);
});
test('secret and unknown fields cannot enter cloud or file backup',()=>{
 const value:any=sample();value.apiKey='secret-top';value.profile.password='secret-password';value.dailyLogs['2026-09-03'].geminiKey='secret-nested';
 const result=serializeBackup(value);
 assert.doesNotMatch(result,/secret-|apiKey|password|geminiKey/);
});
test('malformed or partial records are rejected before restore',()=>{
 for (const change of [(v:any)=>delete v.profile,(v:any)=>v.dailyLogs['2026-09-03'].meals.breakfast={},(v:any)=>v.weightHistory[0].weightKg=-1,(v:any)=>v.profile.gender='unknown',(v:any)=>v.version='99']) {
 const value=sample();change(value);assert.throws(()=>parseBackup(JSON.stringify(value)),/backup/i);
 }
});
test('cloud backup rejects oversized unicode payloads',()=>{
 const value=sample();value.profile.name='😀'.repeat(CLOUD_MAX_BYTES/3);
 assert.throws(()=>serializeBackup(value),/large/i);
});
test('new backup never overwrites an existing account backup without its revision',()=>{
 assert.equal(nextRevision(null,null),1);
 assert.throws(()=>nextRevision(null,1),/changed/i);
 assert.throws(()=>nextRevision(2,null),/changed/i);
});
test('stale device revision fails while latest revision advances',()=>{
 assert.throws(()=>nextRevision(2,3),/changed/i);
 assert.equal(nextRevision(3,3),4);
});
test('remote schema and metadata are validated before use',()=>{
 const doc={schemaVersion:1,revision:1,payload:serializeBackup(sample()),updatedAt:{toDate:()=>new Date('2026-09-03')}};
 assert.equal(validateCloudDocument(doc).revision,1);
 for(const value of [{...doc,revision:0},{...doc,schemaVersion:2},{...doc,payload:'{}'},{...doc,updatedAt:null}]) assert.throws(()=>validateCloudDocument(value),/backup/i);
});

test('Firestore rules let an authenticated owner delete only their own backup',()=>{
 const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
 assert.match(rules,/allow delete:\s*if owner\(\)/);
 assert.match(rules,/request\.auth\.uid == userId/);
 assert.match(rules,/allow list:\s*if false/);
});

test('supplements retain part, amount, unit, and taken status across cloud serialization', () => {
 const data: any = sample();
 data.dailyLogs['2026-09-03'].supplements = [
  { id: 'supp_1', name: 'Vitamin D3', category: 'vitamin', dosage: '2000 IU', part: 'morning', amount: 2000, unit: 'IU', taken: true, loggedAt: '08:30' },
  { id: 'supp_2', name: 'Magnesium', category: 'mineral', dosage: '400 mg', part: 'evening', amount: 400, unit: 'mg', taken: false, loggedAt: '20:00' }
 ];
 const parsed = parseBackup(serializeBackup(data));
 const supps = parsed.dailyLogs['2026-09-03'].supplements;
 assert.equal(supps?.length, 2);
 assert.equal((supps as any)?.[0].part, 'morning');
 assert.equal((supps as any)?.[0].amount, 2000);
 assert.equal((supps as any)?.[0].unit, 'IU');
 assert.equal((supps as any)?.[0].taken, true);
 assert.equal((supps as any)?.[1].part, 'evening');
 assert.equal((supps as any)?.[1].amount, 400);
 assert.equal((supps as any)?.[1].unit, 'mg');
 assert.equal((supps as any)?.[1].taken, false);
});


test('archives retain routine settings and micronutrients but never restore entitlements or consent',()=>{
 const value:any=sample();value.profile.isPremium=true;
 value.settings={supplementRoutine:[{name:'D',category:'vitamin',amount:10,unit:'mcg',dosage:'10 mcg',icon:'pill',part:'morning'}],aiConsent:true,apiKey:'secret'};
 value.customFoods=[{id:'f',name:'Food',source:'custom',servingSize:'100g',servingGrams:100,calories:100,protein:2,carbs:3,fat:4,vitaminB12:0.005}];
 const parsed:any=parseBackup(serializeBackup(value));
 assert.equal(parsed.settings.supplementRoutine[0].amount,10);
 assert.equal(parsed.customFoods[0].vitaminB12,0.005);
 assert.equal(parsed.profile.isPremium,undefined);assert.equal(parsed.settings.aiConsent,undefined);
 assert.doesNotMatch(JSON.stringify(parsed),/secret/);
});
