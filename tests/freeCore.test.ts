import test from 'node:test';
import assert from 'node:assert/strict';
import { isFeatureAccessible } from '../src/utils/premium.ts';
test('barcode and supplements remain available to guests without a paid AI account',()=>{
  assert.equal(isFeatureAccessible('barcode',null),true);
  assert.equal(isFeatureAccessible('vitamins',{isPremium:false}),true);
  assert.equal(isFeatureAccessible('ai_plate',null),false);
  assert.equal(isFeatureAccessible('smart_text',{isPremium:false}),false);
});
