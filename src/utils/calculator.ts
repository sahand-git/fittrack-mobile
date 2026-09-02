import { UserProfile, Gender, ActivityLevel, FitnessGoal } from '../types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { label: string; multiplier: number; desc: string }> = {
  sedentary: { label: 'Sedentary', multiplier: 1.2, desc: 'Little to no exercise, desk job' },
  light: { label: 'Lightly Active', multiplier: 1.375, desc: 'Light exercise 1-3 days/week' },
  moderate: { label: 'Moderately Active', multiplier: 1.55, desc: 'Moderate exercise 3-5 days/week' },
  very_active: { label: 'Very Active', multiplier: 1.725, desc: 'Hard exercise 6-7 days/week' },
  athlete: { label: 'Extra Active / Athlete', multiplier: 1.9, desc: 'Very heavy physical training or sports job' }
};

export const GOAL_ADJUSTMENTS: Record<FitnessGoal, { label: string; calorieDelta: number; desc: string; proteinMultiplier: number }> = {
  fat_loss_aggressive: { label: 'Aggressive Fat Loss', calorieDelta: -500, desc: 'Lose ~0.5kg (1.1 lbs) per week', proteinMultiplier: 2.2 },
  fat_loss_moderate: { label: 'Steady Fat Loss', calorieDelta: -300, desc: 'Lose ~0.3kg (0.7 lbs) per week sustainably', proteinMultiplier: 2.0 },
  maintenance: { label: 'Maintain Weight & Recomp', calorieDelta: 0, desc: 'Keep current weight, build lean muscle', proteinMultiplier: 1.8 },
  lean_bulk: { label: 'Lean Muscle Bulk', calorieDelta: 250, desc: 'Gain ~0.25kg per week with minimal fat', proteinMultiplier: 2.0 },
  muscle_gain: { label: 'Maximum Muscle Growth', calorieDelta: 450, desc: 'Gain strength & mass aggressively', proteinMultiplier: 2.2 }
};

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor Equation
 */
export function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 1700;
  
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  if (gender === 'male') {
    return Math.round(base + 5);
  } else if (gender === 'female') {
    return Math.round(base - 161);
  } else {
    // Average
    return Math.round(base - 78);
  }
}

/**
 * Calculates Total Daily Energy Expenditure
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const mult = ACTIVITY_MULTIPLIERS[activityLevel]?.multiplier || 1.375;
  return Math.round(bmr * mult);
}

/**
 * Calculates target daily calories and macro split (Protein, Carbs, Fats)
 */
export function calculateTargets(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel,
  goal: FitnessGoal
): {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
} {
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const goalConfig = GOAL_ADJUSTMENTS[goal] || GOAL_ADJUSTMENTS.maintenance;

  // Calorie target with safe floor (1200 for women, 1500 for men)
  const minSafe = gender === 'female' ? 1200 : 1400;
  const targetCalories = Math.max(minSafe, tdee + goalConfig.calorieDelta);

  // Protein calculation: 1.8 - 2.2g per kg of bodyweight
  const targetProtein = Math.round(weightKg * goalConfig.proteinMultiplier);
  const proteinCalories = targetProtein * 4;

  // Fat calculation: ~25% to 30% of total calories (9 kcal/g)
  const fatCalories = targetCalories * 0.28;
  const targetFat = Math.round(fatCalories / 9);

  // Remaining calories go to Carbohydrates (4 kcal/g)
  const remainingCalories = Math.max(0, targetCalories - proteinCalories - (targetFat * 9));
  const targetCarbs = Math.round(remainingCalories / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat
  };
}

/**
 * Calculates calories burned from step count based on weight
 */
export function calculateStepCalories(steps: number, weightKg: number): number {
  if (steps <= 0) return 0;
  // Standard formula: ~0.04 to 0.05 kcal per step per 70kg person
  const factor = (weightKg / 70) * 0.042;
  return Math.round(steps * factor);
}

/**
 * Helper to convert kg to lbs and cm to ft/in
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inch = Math.round(totalInches % 12);
  return { ft, in: inch };
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * 2.54);
}
