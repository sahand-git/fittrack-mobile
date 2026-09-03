import test from 'node:test';
import assert from 'node:assert/strict';
import {completeGoogleLogin} from '../src/utils/googleLogin.ts';

test('native Google account selection must pass through Firebase verification', async()=>{
  const calls:string[]=[];
  const user=await completeGoogleLogin(true,{
    chooseNativeAccount:async()=>{calls.push('choose');return {credential:{idToken:'test-token'}};},
    verifyIdToken:async token=>{assert.equal(token,'test-token');calls.push('verify');return {uid:'verified'};},
    openWebSignIn:async()=>{throw Error('No browser popup inside native app');}
  });
  assert.equal(user.uid,'verified');assert.deepEqual(calls,['choose','verify']);
});
test('cancelled, missing, or rejected Google credentials never authenticate', async()=>{
  for(const kind of ['cancel','missing','rejected']){
    let verified=false;
    await assert.rejects(completeGoogleLogin(true,{
      chooseNativeAccount:async()=>{if(kind==='cancel')throw Error('cancelled');return kind==='missing'?{}:{credential:{idToken:'invalid'}};},
      verifyIdToken:async()=>{verified=true;throw Error('Firebase rejected credential');},
      openWebSignIn:async()=>{throw Error('unexpected');}
    }));
    assert.equal(verified,kind==='rejected');
  }
});
test('web Google login uses the Firebase browser flow', async()=>{
  assert.equal(await completeGoogleLogin(false,{
    chooseNativeAccount:async()=>{throw Error('unexpected native call');},
    verifyIdToken:async()=>{throw Error('unexpected token call');},
    openWebSignIn:async()=>'firebase-user'
  }),'firebase-user');
});
