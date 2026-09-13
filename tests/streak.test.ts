import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLoggingStreak, hasActivityOnDate } from '../src/utils/streak.ts';
import type { DayLog, LoggedMealItem, WeightEntry } from '../src/types.ts';

function makeDayLog(date: string): DayLog {
  return {
    date,
    meals: {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    },
    waterMl: 0,
    steps: 0,
    stepCaloriesBurned: 0,
    workouts: [],
    supplements: []
  };
}

const dummyMealItem: LoggedMealItem = {
  id: 'item-1',
  foodId: 'food-1',
  name: 'Oatmeal',
  mealType: 'breakfast',
  servingSize: '1 bowl',
  servingGrams: 100,
  servingsCount: 1,
  calories: 350,
  protein: 12,
  carbs: 60,
  fat: 6,
  loggedAt: '2026-09-07T08:00:00Z'
};

test('streak is 0 when there are no logs and no weight entries', () => {
  const result = calculateLoggingStreak({}, [], '2026-09-07');
  assert.equal(result.currentStreak, 0);
  assert.equal(result.loggedToday, false);
});

test('streak increments to 1 when user logs a meal today', () => {
  const logToday = makeDayLog('2026-09-07');
  logToday.meals.breakfast = [dummyMealItem];

  const result = calculateLoggingStreak({ '2026-09-07': logToday }, [], '2026-09-07');
  assert.equal(result.currentStreak, 1);
  assert.equal(result.loggedToday, true);
});

test('streak counts weight entries as active logging days', () => {
  const weightHistory: WeightEntry[] = [
    { date: '2026-09-07', weightKg: 74.5 }
  ];

  const result = calculateLoggingStreak({}, weightHistory, '2026-09-07');
  assert.equal(result.currentStreak, 1);
  assert.equal(result.loggedToday, true);
});

test('streak counts multi-day consecutive logs including yesterday when today is not yet logged', () => {
  const log1 = makeDayLog('2026-09-05');
  log1.meals.lunch = [dummyMealItem];

  const log2 = makeDayLog('2026-09-06');
  log2.meals.dinner = [dummyMealItem];

  // Today is 2026-09-07 (not yet logged)
  const result = calculateLoggingStreak(
    { '2026-09-05': log1, '2026-09-06': log2 },
    [],
    '2026-09-07'
  );
  assert.equal(result.currentStreak, 2);
  assert.equal(result.loggedToday, false);
});

test('streak breaks when there is a missing day in between', () => {
  const log1 = makeDayLog('2026-09-04');
  log1.meals.breakfast = [dummyMealItem];
  // 2026-09-05 missing!
  const log2 = makeDayLog('2026-09-06');
  log2.meals.lunch = [dummyMealItem];
  const logToday = makeDayLog('2026-09-07');
  logToday.meals.dinner = [dummyMealItem];

  const result = calculateLoggingStreak(
    { '2026-09-04': log1, '2026-09-06': log2, '2026-09-07': logToday },
    [],
    '2026-09-07'
  );
  // Only 2026-09-06 and 2026-09-07 are consecutive
  assert.equal(result.currentStreak, 2);
  assert.equal(result.loggedToday, true);
});
