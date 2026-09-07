import type { ReminderSettings } from '../types.ts';

type ReminderLog = { meals?: Partial<Record<string, unknown[]>>; waterMl?: number; waterLoggedAt?: string[]; supplementsTaken?: string[] };
export type PlannedReminder = { id: number; key: string; title: string; body: string; at: Date };

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const atTime = (date: Date, time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  const result = new Date(date); result.setHours(hour, minute, 0, 0); return result;
};
const hash = (value: string) => {
  let result = 17;
  for (const char of value) result = ((result * 31) + char.charCodeAt(0)) | 0;
  return Math.abs(result || 1);
};

export function buildReminderPlan(settings: ReminderSettings, logs: Record<string, ReminderLog>, now = new Date(), days = 3, waterGoalMl = 2500): PlannedReminder[] {
  if (!settings.enabled) return [];
  const reminders: PlannedReminder[] = [];
  for (let offset = 0; offset < Math.max(1, days) && reminders.length < 60; offset++) {
    const date = new Date(now); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + offset);
    const dateKey = localDate(date); const log = logs[dateKey] ?? {};
    for (const meal of ['breakfast', 'lunch', 'dinner'] as const) {
      const time = settings.mealTimes[meal]; const at = time ? atTime(date, time) : null;
      if (at && at > now && !(log.meals?.[meal]?.length)) reminders.push({ id: hash(`${dateKey}:meal:${meal}`), key: `meal:${meal}`, title: 'Meal reminder', body: `Remember to log your ${meal}.`, at });
    }
    if (settings.water.enabled && (log.waterMl ?? 0) < waterGoalMl) {
      const start = atTime(date, settings.water.start); const end = atTime(date, settings.water.end);
      const interval = Math.min(360, Math.max(30, settings.water.intervalMinutes));
      for (let at = start; at <= end && reminders.length < 60; at = new Date(at.getTime() + interval * 60000)) {
        const bucketEnd = new Date(at.getTime() + interval * 60000);
        const logged = (log.waterLoggedAt ?? []).some(value => { const stamp = new Date(value); return stamp >= at && stamp < bucketEnd; });
        const key = `water:${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
        if (at > now && !logged) reminders.push({ id: hash(`${dateKey}:${key}`), key, title: 'Water reminder', body: 'Take a moment to drink and log some water.', at: new Date(at) });
      }
    }
    for (const supplement of settings.supplements.filter(item => item.enabled)) {
      const at = atTime(date, supplement.time);
      if (at > now && !(log.supplementsTaken ?? []).includes(supplement.id)) reminders.push({ id: hash(`${dateKey}:supplement:${supplement.id}`), key: `supplement:${supplement.id}`, title: 'Supplement reminder', body: `${supplement.name}${supplement.amount ? ` — ${supplement.amount}` : ''}`, at });
    }
  }
  return reminders.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 60);
}
