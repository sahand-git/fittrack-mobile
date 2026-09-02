export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete';
export type FitnessGoal = 'fat_loss_aggressive' | 'fat_loss_moderate' | 'maintenance' | 'lean_bulk' | 'muscle_gain';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ExerciseCategory = 'strength' | 'cardio' | 'hiit' | 'sports' | 'flexibility';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  isGoogleConnected: boolean;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  includeStepsInCalorieBudget: boolean; // Option requested by user
  stepGoal: number;
  waterGoalMl: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  profileCompleted: boolean;
  onboardingVersion?: number;
  customMacroSplit?: {
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
}

export interface FoodNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugars?: number;
  sodium?: number; // in mg
}

export interface FoodItem extends FoodNutrients {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  servingSize: string;
  servingGrams: number;
  nutriScore?: string;
  ecoScore?: string;
  novaGroup?: number;
  imageUrl?: string;
  ingredients?: string;
  source: 'open_food_facts' | 'verified_database' | 'custom' | 'ai_estimated';
  category?: string;
}

export interface LoggedMealItem {
  id: string;
  foodId: string;
  name: string;
  brand?: string;
  barcode?: string;
  mealType: MealType;
  servingSize: string;
  servingGrams: number;
  servingsCount: number; // e.g. 1.5 servings
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugars?: number;
  sodium?: number;
  imageUrl?: string;
  loggedAt: string;
}

export interface ExerciseSet {
  setNum: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutEntry {
  id: string;
  name: string;
  category: ExerciseCategory;
  durationMinutes: number;
  caloriesBurned: number;
  sets?: ExerciseSet[];
  loggedAt: string;
}

export interface AICoachReport {
  overallGrade: string; // e.g. "A", "B+", "C"
  headline: string;
  caloricBalance: string;
  macroBreakdown: string;
  mistakesAndBlindSpots: string[];
  actionableTomorrowFixes: string[];
  customMealSuggestion: string;
  coachNote: string;
  generatedAt: string;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  meals: {
    breakfast: LoggedMealItem[];
    lunch: LoggedMealItem[];
    dinner: LoggedMealItem[];
    snack: LoggedMealItem[];
  };
  waterMl: number;
  steps: number;
  stepCaloriesBurned: number;
  workouts: WorkoutEntry[];
  notes?: string;
  aiReport?: AICoachReport;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPercent?: number;
  note?: string;
}
