import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoggedFood, sumNutrients } from '../src/utils/nutrition.ts';
import { calorieBudget, shouldUpdateCurrentWeight } from '../src/utils/calculator.ts';
import { readStoredJSON, persistStoredJSON, persistRestore, collectCorruptRecovery } from '../src/utils/storage.ts';
import { accountStorageKeys, clearAccountStorage } from '../src/utils/account.ts';

const food:any={id:'f',name:'Food',source:'custom',servingSize:'100g',servingGrams:100,calories:100,protein:10,carbs:12,fat:2,vitaminA:100,vitaminC:20,vitaminD:0.4,vitaminB12:0.02,calcium:50,iron:2,potassium:100,magnesium:30,zinc:1,fiber:0};
test('fractional and multiple servings preserve every nutrient and sum exactly once',()=>{
 const half=createLoggedFood(food,'lunch',0.5,'a','12:00');
 const two=createLoggedFood(food,'lunch',2,'b','12:01');
 for(const key of ['calories','protein','carbs','fat','vitaminA','vitaminC','vitaminD','vitaminB12','calcium','iron','potassium','magnesium','zinc','fiber'] as const) {
  assert.equal(half[key],food[key]*0.5,key); assert.equal(two[key],food[key]*2,key);
  assert.equal(sumNutrients([half,two])[key],food[key]*2.5,key);
 }
 assert.equal(half.servingGrams,50);
 assert.throws(()=>createLoggedFood(food,'lunch',NaN,'c','12:00'));
 assert.throws(()=>createLoggedFood(food,'lunch',0,'c','12:00'));
});
test('activity-adjusted calorie budget adds steps only on explicit opt-in',()=>{
 assert.equal(calorieBudget({targetCalories:2000,includeStepsInCalorieBudget:false} as any,{stepCaloriesBurned:200,workouts:[{caloriesBurned:500}]} as any),2000);
 assert.equal(calorieBudget({targetCalories:2000,includeStepsInCalorieBudget:true} as any,{stepCaloriesBurned:200,workouts:[{caloriesBurned:500}]} as any),2200);
});
test('historical weights never replace a later current weight',()=>{
 const history=[{date:'2026-09-10',weightKg:70},{date:'2026-08-01',weightKg:73}];
 assert.equal(shouldUpdateCurrentWeight(history,'2026-09-01'),false);
 assert.equal(shouldUpdateCurrentWeight(history,'2026-09-10'),true);
 assert.equal(shouldUpdateCurrentWeight(history,'2026-09-11'),true);
});
function memory(){const data=new Map<string,string>();return {data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)},removeItem:(k:string)=>{data.delete(k)}};}
test('corrupt data is retained before replacement and quota failure leaves old data intact',()=>{
 const s=memory();s.setItem('logs','{broken');const result=readStoredJSON(s,'logs',{},v=>!!v&&typeof v==='object');
 assert.ok(result.error);assert.equal(s.getItem('logs'),'{broken');
 persistStoredJSON(s,'logs',{ok:true});assert.equal(s.getItem('logs_corrupt_recovery'),'{broken');
 const failing={...s,setItem:()=>{throw new Error('quota')}};
 assert.throws(()=>persistStoredJSON(failing,'logs',{new:true}));assert.equal(s.getItem('logs'),'{"ok":true}');
});
test('account cleanup removes recovery and settings without touching another account',()=>{
 const s=memory();const a=accountStorageKeys('a'),b=accountStorageKeys('b');
 for(const key of [...Object.values(a),...Object.values(b)]){s.setItem(key,'private');s.setItem(key+'_corrupt_recovery','old');}
 clearAccountStorage(s,'a');
 for(const key of Object.values(a)){assert.equal(s.getItem(key),null);assert.equal(s.getItem(key+'_corrupt_recovery'),null);}
 for(const key of Object.values(b))assert.equal(s.getItem(key),'private');
 assert.ok(a.recovery.includes('_before_restore'));assert.ok(a.supplementRoutine);assert.ok(a.aiConsent);
});


test('restore backs up first and rolls back partial writes on failure',()=>{
 const s=memory();s.setItem('profile','old profile');s.setItem('logs','old logs');
 const failing={...s,setItem:(key:string,value:string)=>{if(key==='logs' && value==='"new logs"')throw new Error('quota');s.setItem(key,value)}};
 assert.throws(()=>persistRestore(failing,'recovery','complete old backup',[['profile','new profile'],['logs','new logs']]));
 assert.equal(s.getItem('profile'),'old profile');assert.equal(s.getItem('logs'),'old logs');assert.equal(s.getItem('recovery'),'complete old backup');
});

test('restore stops before changing records if recovery cannot be saved',()=>{
 const s=memory();s.setItem('profile','old');
 const failing={...s,setItem:()=>{throw new Error('quota')}};
 assert.throws(()=>persistRestore(failing,'recovery','old backup',[['profile','new']]));
 assert.equal(s.getItem('profile'),'old');
});

test('failed corruption recovery preserves the original and can be retried',()=>{
 const s=memory();s.setItem('damaged','invalid');readStoredJSON(s,'damaged',{},()=>true);
 const failing={...s,setItem:()=>{throw new Error('quota')}};
 assert.throws(()=>persistStoredJSON(failing,'damaged',{}));assert.equal(s.getItem('damaged'),'invalid');
 persistStoredJSON(s,'damaged',{});assert.equal(s.getItem('damaged_corrupt_recovery'),'invalid');assert.equal(s.getItem('damaged'),'{}');
});


test('raw recovery export retains corrupt text exactly and reads only requested account keys',()=>{
 const s=memory();s.setItem('a_corrupt_recovery','{broken exact');s.setItem('b_corrupt_recovery','other account');
 assert.deepEqual(collectCorruptRecovery(s,['a']),{a:'{broken exact'});
 assert.deepEqual(collectCorruptRecovery(s,['missing']),{});
});
