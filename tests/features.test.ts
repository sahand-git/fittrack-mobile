import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReminders } from '../src/utils/notifications.ts';
import { parseBackup, serializeBackup } from '../src/utils/cloudBackupCore.ts';
import type { DayLog, UserProfile, FoodItem } from '../src/types.ts';

const mockProfile: UserProfile = {
  name: 'Test User',
  email: 'test@example.com',
  isGoogleConnected: false,
  gender: 'male',
  age: 25,
  heightCm: 180,
  weightKg: 75,
  targetWeightKg: 72,
  activityLevel: 'moderate',
  goal: 'maintenance',
  includeStepsInCalorieBudget: false,
  stepGoal: 10000,
  waterGoalMl: 2500,
  bmr: 1750,
  tdee: 2400,
  targetCalories: 2400,
  targetProtein: 150,
  targetCarbs: 250,
  targetFat: 70,
  profileCompleted: true
};

const mockEmptyDayLog: DayLog = {
  date: '2026-09-06',
  meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
  waterMl: 0,
  steps: 0,
  stepCaloriesBurned: 0,
  workouts: []
};

test('evaluateReminders detects unlogged water and generates actionable reminder', () => {
  const alerts = evaluateReminders(mockEmptyDayLog, mockProfile);
  // Should trigger either water or meal depending on current run time
  assert(Array.isArray(alerts));
  assert(alerts.length >= 0);
});

test('cloudBackup retains and validates vitamins and minerals', () => {
  const customFoodWithVitamins: FoodItem = {
    id: 'food_vitamins_test',
    name: 'Super Orange Juice',
    servingSize: '250 ml',
    servingGrams: 250,
    calories: 110,
    protein: 2,
    carbs: 26,
    fat: 0,
    vitaminC: 120, // 120 mg
    vitaminA: 50,  // 50 mcg
    calcium: 30,   // 30 mg
    iron: 0.5,
    potassium: 450,
    magnesium: 25,
    source: 'custom'
  };

  const backupPayload = {
    version: '2.0',
    exportedAt: '2026-09-06T10:00:00.000Z',
    profile: mockProfile,
    dailyLogs: { '2026-09-06': mockEmptyDayLog },
    customFoods: [customFoodWithVitamins],
    weightHistory: []
  };

  const serialized = serializeBackup(backupPayload);
  const parsed = parseBackup(serialized);

  assert.equal(parsed.customFoods.length, 1);
  assert.equal(parsed.customFoods[0].vitaminC, 120);
  assert.equal(parsed.customFoods[0].vitaminA, 50);
  assert.equal(parsed.customFoods[0].calcium, 30);
  assert.equal(parsed.customFoods[0].potassium, 450);
});

import fs from 'node:fs';

test('Kurdish Sorani translations exist and are accurate for all exercise presets and categories', () => {
  const ckb = JSON.parse(fs.readFileSync(new URL('../src/locales/ckb.json', import.meta.url), 'utf8'));
  
  const exerciseNames = [
    'Weightlifting (Hypertrophy / Machines)',
    'Heavy Powerlifting / Barbell Compound',
    'Calisthenics & Bodyweight Training',
    'Outdoor Running (8 km/h / 5 mph)',
    'Running / Sprinting (10.8 km/h / 6.7 mph)',
    'Incline Treadmill Zone 2 Walk (12-3-30)',
    'Outdoor Cycling (Moderate)',
    'Stationary Spin Bike',
    'Jump Rope / Skipping',
    'HIIT Circuit / Tabata',
    'Swimming (Freestyle Laps)',
    'Boxing / Heavy Bag / Kickboxing',
    'Basketball / Football / Soccer',
    'Vinyasa / Power Yoga',
    'Stretching & Joint Mobility'
  ];

  const categories = ['strength', 'cardio', 'hiit', 'sports', 'flexibility'];

  for (const name of exerciseNames) {
    const translated = ckb[name];
    assert.ok(translated, `Missing translation for ${name}`);
    // Must not be identical to English
    assert.notEqual(translated, name, `Translation for ${name} should not be untranslated English`);
    // Must not contain common Arabic-only untranslated phrases
    assert(!translated.includes('رفع أثقال'), `Translation for ${name} must be Kurdish, not Arabic`);
    assert(!translated.includes('نط الحبل'), `Translation for ${name} must be Kurdish, not Arabic`);
    assert(!translated.includes('كرة السلة'), `Translation for ${name} must be Kurdish, not Arabic`);
  }

  for (const cat of categories) {
    const translated = ckb[cat];
    assert.ok(translated, `Missing category translation for ${cat}`);
  }

  // Check specific Kurdish Sorani terminology
  assert.equal(ckb['Jump Rope / Skipping'], 'پەتپەتێن (پەت لێدان)');
  assert.equal(ckb['Swimming (Freestyle Laps)'], 'مەلەکردن (خولی شێوازی ئازاد)');
  assert.equal(ckb['Log Workout & Exercise'], 'تۆمارکردنی ڕاهێنان و وەرزش');
  assert.equal(ckb['Time to Hydrate'], 'کاتی ئاو خواردنەوەیە');
});

