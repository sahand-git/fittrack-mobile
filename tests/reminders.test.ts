import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReminderPlan } from '../src/utils/reminderCore.ts';

const settings = {
  enabled: true,
  mealTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
  water: { enabled: true, start: '09:00', end: '21:00', intervalMinutes: 120 },
  supplements: [{ id: 'vit-d', name: 'Vitamin D', amount: '1 tablet', time: '10:00', enabled: true }]
};

test('does not remind for meals, water intervals, or supplements already completed', () => {
  const plan = buildReminderPlan(settings, {
    '2026-09-06': { meals: { breakfast: [{}], lunch: [], dinner: [], snack: [] }, waterMl: 250, waterLoggedAt: ['2026-09-06T09:15:00'], supplementsTaken: ['vit-d'] }
  }, new Date('2026-09-06T07:00:00'), 1);
  assert.ok(!plan.some(item => item.key === 'meal:breakfast'));
  assert.ok(plan.some(item => item.key === 'meal:lunch'));
  assert.ok(!plan.some(item => item.key === 'water:09:00'));
  assert.ok(!plan.some(item => item.key === 'supplement:vit-d'));
});

test('uses local calendar days and caps pending notifications', () => {
  const plan = buildReminderPlan(settings, {}, new Date('2026-09-06T07:00:00'), 30);
  assert.ok(plan.length <= 60);
  assert.ok(plan.every(item => item.at.getTime() > new Date('2026-09-06T07:00:00').getTime()));
  assert.equal(new Set(plan.map(item => item.id)).size, plan.length);
});

test('water reminders stop after the daily target', () => {
  const plan = buildReminderPlan(settings, { '2026-09-06': { meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, waterMl: 2000 } }, new Date('2026-09-06T07:00:00'), 1, 2000);
  assert.ok(!plan.some(item => item.key.startsWith('water:')));
});
