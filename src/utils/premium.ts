import type { PremiumFeature, UserProfile } from '../types';

export const GATED_PREMIUM_FEATURES: Record<
  PremiumFeature,
  {
    id: PremiumFeature;
    title: string;
    description: string;
    icon: string;
    benefit: string;
    ctaLabel: string;
  }
> = {
  barcode: {
    id: 'barcode',
    title: 'Barcode Scanner & Product Lookup',
    description: 'Instantly scan packaged foods with your camera to pull verified macros from Open Food Facts.',
    icon: 'Barcode',
    benefit: 'Fastest way to log packaged meals and snacks without typing.',
    ctaLabel: 'Unlock Barcode Scanner',
  },
  ai_plate: {
    id: 'ai_plate',
    title: 'AI Plate Camera (Gemini Vision)',
    description: 'Snap a photo of any meal or home-cooked dish for instant portion and macronutrient estimation.',
    icon: 'Camera',
    benefit: 'Effortless photo logging powered by advanced Google Gemini multimodal AI.',
    ctaLabel: 'Unlock AI Plate Vision',
  },
  gemini_coach: {
    id: 'gemini_coach',
    title: 'Gemini AI Nutrition Coach',
    description: 'Get deep daily diet audits, actionable tomorrow fixes, and 24/7 personalized fitness Q&A.',
    icon: 'Bot',
    benefit: 'General nutrition feedback based on the details you choose to share.',
    ctaLabel: 'Unlock AI Nutrition Coach',
  },
  smart_text: {
    id: 'smart_text',
    title: 'Smart Text Meal Estimator',
    description: 'Type or speak natural language descriptions like "2 scrambled eggs with avocado and sourdough".',
    icon: 'Sparkles',
    benefit: 'Parses complex multi-item meals into exact ingredients and grams in one tap.',
    ctaLabel: 'Unlock Smart Text AI',
  },
  vitamins: {
    id: 'vitamins',
    title: 'Vitamins & Minerals Tracker',
    description: 'Schedule daily supplement doses across 4 timeframes with RDA deficiency analysis.',
    icon: 'Pill',
    benefit: 'Never miss essential micronutrients and maintain optimal health balance.',
    ctaLabel: 'Unlock Vitamin Tracker',
  },
};

export const UNGATED_CORE_FEATURES = [
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
] as const;

/**
 * Checks whether a feature is accessible given the user's profile state.
 * Returns true if the user has an active premium status, false if gated.
 */
export function isFeatureAccessible(
  feature: PremiumFeature,
  userProfile?: { isPremium?: boolean } | null
): boolean {
  if (feature === 'barcode' || feature === 'vitamins') return true;
  if (!userProfile) return false;
  return Boolean(userProfile.isPremium);
}

/**
 * Validates that core health features are always accessible and ungated.
 */
export function isCoreFeatureAccessible(coreFeature: string): boolean {
  return UNGATED_CORE_FEATURES.includes(coreFeature as any);
}
