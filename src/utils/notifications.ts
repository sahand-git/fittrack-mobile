import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { DayLog, ReminderSettings } from '../types';
import { buildReminderPlan } from './reminderCore';
import { t } from './locale';

export type NotificationStatus = 'unsupported' | 'prompt' | 'granted' | 'denied';

export async function notificationStatus(): Promise<NotificationStatus> {
  if (!Capacitor.isNativePlatform()) return 'unsupported';
  const result = await LocalNotifications.checkPermissions();
  return result.display === 'granted' ? 'granted' : result.display === 'prompt' || result.display === 'prompt-with-rationale' ? 'prompt' : 'denied';
}

export async function enableNotifications(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

export async function syncWellnessNotifications(settings: ReminderSettings | undefined, logs: Record<string, DayLog>, waterGoalMl: number) {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter(item => item.extra?.owner === 'fittrack-wellness').map(item => ({ id: item.id }));
  if (ours.length) await LocalNotifications.cancel({ notifications: ours });
  if (!settings?.enabled || await notificationStatus() !== 'granted') return;
  const planned = buildReminderPlan(settings, logs, new Date(), 3, waterGoalMl);
  if (planned.length) await LocalNotifications.schedule({ notifications: planned.map(item => ({
    id: item.id,
    title: t(item.title),
    body: item.key.startsWith('meal:') ? `${t('Remember to log your meal.')} ${t(item.key.split(':')[1][0].toUpperCase() + item.key.split(':')[1].slice(1))}` : item.key.startsWith('water:') ? t(item.body) : item.body,
    schedule: { at: item.at, allowWhileIdle: true },
    extra: { owner: 'fittrack-wellness', key: item.key }
  })) });
}

export async function clearWellnessNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter(item => item.extra?.owner === 'fittrack-wellness').map(item => ({ id: item.id }));
  if (ours.length) await LocalNotifications.cancel({ notifications: ours });
}
