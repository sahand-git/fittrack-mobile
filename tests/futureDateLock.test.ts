import test from 'node:test';
import assert from 'node:assert/strict';
import { getTodayDateString, getPreviousDayString, getNextDayString, isDateToday, isDateFuture } from '../src/utils/dateCore.ts';

test('isDateToday accurately identifies today vs other dates', () => {
  const today = getTodayDateString();
  assert.equal(isDateToday(today), true);
  assert.equal(isDateToday(getPreviousDayString(today)), false);
  assert.equal(isDateToday(getNextDayString(today)), false);
});

test('isDateFuture detects future dates while allowing today and past dates', () => {
  const today = getTodayDateString();
  const pastDay = getPreviousDayString(today);
  const futureDay = getNextDayString(today);

  assert.equal(isDateFuture(pastDay), false, 'Past day must NOT be flagged as future');
  assert.equal(isDateFuture(today), false, 'Today must NOT be flagged as future');
  assert.equal(isDateFuture(futureDay), true, 'Tomorrow must be strictly flagged as future');
});

test('clamping future dates restricts navigation past today', () => {
  const today = getTodayDateString();
  const tomorrow = getNextDayString(today);
  const clampDate = (date: string) => (date > today ? today : date);

  assert.equal(clampDate(getPreviousDayString(today)), getPreviousDayString(today));
  assert.equal(clampDate(today), today);
  assert.equal(clampDate(tomorrow), today);
});

test('daily log dictionary saves entries under their exact past date key and blocks future', () => {
  const today = getTodayDateString();
  const yesterday = getPreviousDayString(today);
  const tomorrow = getNextDayString(today);

  const dailyLogs: Record<string, { meals: string[]; workouts: string[] }> = {};

  function logItem(date: string, itemType: 'meals' | 'workouts', name: string): boolean {
    if (isDateFuture(date)) {
      return false; // strictly blocked
    }
    if (!dailyLogs[date]) {
      dailyLogs[date] = { meals: [], workouts: [] };
    }
    dailyLogs[date][itemType].push(name);
    return true;
  }

  // 1. Log for yesterday
  const yesterdaySuccess = logItem(yesterday, 'meals', 'Oatmeal & Berries');
  assert.equal(yesterdaySuccess, true, 'Yesterday logging must succeed');
  assert.ok(dailyLogs[yesterday], 'Yesterday entry must exist in dailyLogs');
  assert.equal(dailyLogs[yesterday].meals[0], 'Oatmeal & Berries');
  assert.equal(dailyLogs[today], undefined, 'Today must not be polluted by yesterday log');
  assert.equal(dailyLogs[tomorrow], undefined, 'Tomorrow must not exist');

  // 2. Attempt to log for tomorrow
  const tomorrowSuccess = logItem(tomorrow, 'meals', 'Future Steak');
  assert.equal(tomorrowSuccess, false, 'Future date logging must be blocked');
  assert.equal(dailyLogs[tomorrow], undefined, 'Future date must never be created');
});

