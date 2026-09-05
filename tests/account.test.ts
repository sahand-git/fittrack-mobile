import test from 'node:test';
import assert from 'node:assert/strict';
import {accountStorageKeys, authErrorMessage, canConfirmAccountDeletion} from '../src/utils/account.ts';

test('each account has separate storage and original guest records keep their keys',()=>{
  const guest=accountStorageKeys(),a=accountStorageKeys('user-a'),b=accountStorageKeys('user-b');
  assert.deepEqual(guest,{profile:'nutrifit_user_profile_v2',logs:'nutrifit_daily_logs_v2',foods:'nutrifit_custom_foods_v2',weights:'nutrifit_weights_v2'});
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
