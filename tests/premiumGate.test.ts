import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isFeatureAccessible,
  isCoreFeatureAccessible,
  GATED_PREMIUM_FEATURES,
  UNGATED_CORE_FEATURES
} from '../src/utils/premium.ts';
import type { PremiumFeature } from '../src/types.ts';

test('gated features are blocked when user is not premium', () => {
  const freeProfiles = [
    { isPremium: false },
    { isPremium: undefined },
    {},
    null,
    undefined
  ];

  const gatedFeatures: PremiumFeature[] = [
    'ai_plate',
    'gemini_coach',
    'smart_text',
  ];

  for (const profile of freeProfiles) {
    for (const feature of gatedFeatures) {
      assert.equal(
        isFeatureAccessible(feature, profile),
        false,
        `Feature ${feature} should be blocked for free profile ${JSON.stringify(profile)}`
      );
    }
  }
});

test('gated features are fully accessible when user is premium', () => {
  const premiumProfile = { isPremium: true };

  const gatedFeatures: PremiumFeature[] = [
    'barcode',
    'ai_plate',
    'gemini_coach',
    'smart_text',
    'vitamins'
  ];

  for (const feature of gatedFeatures) {
    assert.equal(
      isFeatureAccessible(feature, premiumProfile),
      true,
      `Feature ${feature} must be accessible when isPremium is true`
    );
  }
});

test('core health and fitness tracking features remain ungated and free', () => {
  const expectedCoreFeatures = [
    'weight_logging',
    'weight_trends',
    'calorie_budget',
    'macro_targets',
    'verified_food_database',
    'custom_food_creation',
    'exercise_workout_log',
    'phone_step_counter',
    'hydration_tracker',
    'scientific_references',
    'cloud_sync_backup',
  ];

  for (const feature of expectedCoreFeatures) {
    assert.equal(
      isCoreFeatureAccessible(feature),
      true,
      `Core feature ${feature} must be permanently ungated`
    );
  }
});

test('premium feature metadata provides clear benefits for upgrade prompt', () => {
  const gatedKeys: PremiumFeature[] = ['barcode', 'ai_plate', 'gemini_coach', 'smart_text', 'vitamins'];

  for (const key of gatedKeys) {
    const meta = GATED_PREMIUM_FEATURES[key];
    assert.ok(meta, `Metadata should exist for ${key}`);
    assert.ok(meta.title && meta.title.length > 0, `Title must be defined for ${key}`);
    assert.ok(meta.description && meta.description.length > 0, `Description must be defined for ${key}`);
    assert.ok(meta.benefit && meta.benefit.length > 0, `Benefit must be defined for ${key}`);
    assert.ok(meta.ctaLabel && meta.ctaLabel.length > 0, `CTA label must be defined for ${key}`);
  }
});
