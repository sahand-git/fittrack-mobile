import test from 'node:test';
import assert from 'node:assert/strict';
import {accountStorageKeys, authErrorMessage, canConfirmAccountDeletion, migrateGuestRoutine, createReminderAccountScope} from '../src/utils/account.ts';

test('each account has separate storage and original guest records keep their keys',()=>{
  const guest=accountStorageKeys(),a=accountStorageKeys('user-a'),b=accountStorageKeys('user-b');
  assert.deepEqual({profile:guest.profile,logs:guest.logs,foods:guest.foods,weights:guest.weights},{profile:'nutrifit_user_profile_v2',logs:'nutrifit_daily_logs_v2',foods:'nutrifit_custom_foods_v2',weights:'nutrifit_weights_v2'});
  for(const key of Object.keys(guest) as (keyof typeof guest)[]){assert.notEqual(a[key],b[key]);assert.notEqual(a[key],guest[key]);}
});
test('wrong credentials never display a sign-in success message',()=>{
  assert.match(authErrorMessage({code:'auth/invalid-credential'}),/incorrect/);
  assert.match(authErrorMessage({code:'auth/network-request-failed'}),/connection/);
  assert.equal(authErrorMessage({code:'auth/user-not-found'}),authErrorMessage({code:'auth/wrong-password'}));
});
test('account deletion requires an exact typed confirmation',()=>{
  assert.equal(canConfirmAccountDeletion('DELETE'),true);
  assert.equal(canConfirmAccountDeletion('delete'),false);
  assert.equal(canConfirmAccountDeletion('person@example.com'),false);
});


test('legacy routine migrates to guest only without overwriting existing guest data',()=>{
 const data=new Map([['fittrack_fixed_vitamin_routine','legacy']]);
 const store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)};
 migrateGuestRoutine(store,'alice');assert.equal(data.get(accountStorageKeys('alice').supplementRoutine),undefined);
 migrateGuestRoutine(store);assert.equal(data.get(accountStorageKeys().supplementRoutine),'legacy');assert.equal(data.has('fittrack_fixed_vitamin_routine'),false);
 data.set('fittrack_fixed_vitamin_routine','second');migrateGuestRoutine(store);assert.equal(data.get(accountStorageKeys().supplementRoutine),'legacy');
});
test('reminder scope disables dispatch until cancellation completes and isolates keys',async()=>{
 let cancelled=0;const scope=createReminderAccountScope(async()=>{cancelled++});
 assert.equal(scope.ready,false);await scope.configure('alice');assert.equal(scope.uid,'alice');assert.equal(scope.ready,true);
 const old=scope.generation;const pending=scope.configure('bob');assert.equal(scope.ready,false);assert.notEqual(scope.generation,old);await pending;
 assert.equal(scope.uid,'bob');await scope.configure();assert.equal(scope.uid,undefined);assert.equal(cancelled,3);
 assert.notEqual(accountStorageKeys('alice').notificationPreferences,accountStorageKeys('bob').notificationPreferences);
});
