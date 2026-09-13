import type { DayLog, UserProfile } from '../types';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
function t(text: string): string {
  try {
    if (typeof window !== 'undefined' && (window as any).__FITTRACK_TRANSLATE__) {
      return (window as any).__FITTRACK_TRANSLATE__(text);
    }
  } catch {}
  return text;
}

export interface ReminderAlert {
  id: string;
  type: 'water' | 'meal' | 'vitamin';
  title: string;
  message: string;
  actionText?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  severity: 'info' | 'warning';
}

export interface NotificationPreferences {
  enabled: boolean;
  water: {
    enabled: boolean;
    intervalHours: number; // 1, 2, 3, 4
    startHour: number; // 8 (08:00)
    endHour: number; // 21 (21:00)
  };
  vitamins: {
    enabled: boolean;
    morningTime: string; // "09:00"
    eveningTime: string; // "20:00"
  };
  meals: {
    enabled: boolean;
    breakfastTime: string; // "08:30"
    lunchTime: string; // "13:00"
    dinnerTime: string; // "19:30"
    snackTime: string; // "16:30"
    snackEnabled: boolean;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  water: {
    enabled: true,
    intervalHours: 2,
    startHour: 8,
    endHour: 21
  },
  vitamins: {
    enabled: true,
    morningTime: '09:00',
    eveningTime: '20:00'
  },
  meals: {
    enabled: true,
    breakfastTime: '08:30',
    lunchTime: '13:00',
    dinnerTime: '19:30',
    snackTime: '16:30',
    snackEnabled: true
  }
};

const STORAGE_KEY_NOTIF_ENABLED = 'fittrack_notifications_enabled';
const STORAGE_KEY_NOTIF_PREFS = 'fittrack_notification_preferences_v2';
const STORAGE_KEY_LAST_NOTIFIED = 'fittrack_last_notified_timestamps';
const STORAGE_KEY_FIXED_VITAMINS = 'fittrack_fixed_vitamin_routine';

let channelsInitialized = false;

export async function initializeNotificationChannels(): Promise<void> {
  if (channelsInitialized || !Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: 'fittrack_water',
      name: 'FitTrack Hydration',
      description: 'Periodic water and hydration reminders',
      importance: 4,
      visibility: 1,
      vibration: true
    });
    await LocalNotifications.createChannel({
      id: 'fittrack_vitamins',
      name: 'FitTrack Vitamins & Minerals',
      description: 'Daily fixed checklist and supplement reminders',
      importance: 4,
      visibility: 1,
      vibration: true
    });
    await LocalNotifications.createChannel({
      id: 'fittrack_meals',
      name: 'FitTrack Meal Schedule',
      description: 'Breakfast, lunch, dinner and snack reminders',
      importance: 4,
      visibility: 1,
      vibration: true
    });
    await LocalNotifications.createChannel({
      id: 'fittrack_reminders',
      name: 'FitTrack General Reminders',
      description: 'General health and fitness notifications',
      importance: 4,
      visibility: 1,
      vibration: true
    });
    channelsInitialized = true;
  } catch (err) {
    console.warn('Could not initialize notification channels:', err);
  }
}

export function isNotificationSupported(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | string {
  if (typeof Notification !== 'undefined') return Notification.permission;
  return 'default';
}

export async function checkNotificationPermission(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display;
    } catch {
      return 'prompt';
    }
  }
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  await initializeNotificationChannels();
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.requestPermissions();
      const granted = status.display === 'granted';
      if (granted) {
        localStorage.setItem(STORAGE_KEY_NOTIF_ENABLED, 'true');
      }
      return granted;
    } catch (e) {
      console.warn('Could not request native notification permission:', e);
      return false;
    }
  }

  if (typeof Notification === 'undefined') return false;
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    if (granted) {
      localStorage.setItem(STORAGE_KEY_NOTIF_ENABLED, 'true');
    }
    return granted;
  } catch (e) {
    console.warn('Could not request notification permission:', e);
    return false;
  }
}

export function areNotificationsEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY_NOTIF_ENABLED) === 'true';
}

export function setNotificationsEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY_NOTIF_ENABLED, enabled ? 'true' : 'false');
  const prefs = getNotificationPreferences();
  prefs.enabled = enabled;
  saveNotificationPreferences(prefs);
}

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIF_PREFS);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      water: { ...DEFAULT_NOTIFICATION_PREFERENCES.water, ...parsed.water },
      vitamins: { ...DEFAULT_NOTIFICATION_PREFERENCES.vitamins, ...parsed.vitamins },
      meals: { ...DEFAULT_NOTIFICATION_PREFERENCES.meals, ...parsed.meals }
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIF_PREFS, JSON.stringify(prefs));
    localStorage.setItem(STORAGE_KEY_NOTIF_ENABLED, prefs.enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function getFixedRoutineSummary(): { count: number; names: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIXED_VITAMINS);
    if (!raw) return { count: 0, names: [] };
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return { count: 0, names: [] };
    const names = items.map((i: any) => String(i.name || '')).filter(Boolean);
    return { count: items.length, names };
  } catch {
    return { count: 0, names: [] };
  }
}

function getNextDateForTime(timeStr: string): Date {
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr || '9', 10);
  const minute = parseInt(minStr || '0', 10);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

function getLastNotified(id: string): number {
  try {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEY_LAST_NOTIFIED) || '{}');
    return map[id] || 0;
  } catch {
    return 0;
  }
}

function setLastNotified(id: string) {
  try {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEY_LAST_NOTIFIED) || '{}');
    map[id] = Date.now();
    localStorage.setItem(STORAGE_KEY_LAST_NOTIFIED, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function stringToIntegerId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100000;
}

/**
 * Schedules all configured notifications with Capacitor LocalNotifications.
 */
export async function scheduleAllConfiguredReminders(customPrefs?: NotificationPreferences): Promise<void> {
  const prefs = customPrefs || getNotificationPreferences();
  if (!prefs.enabled) {
    if (Capacitor.isNativePlatform()) {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }
      } catch (err) {
        console.warn('Error clearing pending notifications:', err);
      }
    }
    return;
  }

  if (!Capacitor.isNativePlatform()) return;

  try {
    await initializeNotificationChannels();

    // Cancel old FitTrack reminders
    const pending = await LocalNotifications.getPending();
    const oldFitTrack = pending.notifications.filter(n => n.id >= 1000 && n.id <= 9999);
    if (oldFitTrack.length > 0) {
      await LocalNotifications.cancel({ notifications: oldFitTrack });
    }

    const notificationsToSchedule: any[] = [];
    const fixedRoutine = getFixedRoutineSummary();

    // 1. Water Reminders
    if (prefs.water.enabled) {
      const { startHour, endHour, intervalHours } = prefs.water;
      let counter = 0;
      for (let h = startHour; h <= endHour; h += Math.max(1, intervalHours)) {
        counter++;
        const targetDate = getNextDateForTime(`${String(h).padStart(2, '0')}:00`);
        notificationsToSchedule.push({
          id: 1000 + counter,
          title: t('Time to Hydrate 💧'),
          body: t('Drink a fresh glass of water to stay hydrated and hit your daily goal.'),
          channelId: 'fittrack_water',
          schedule: {
            at: targetDate,
            repeats: true,
            every: 'day',
            allowWhileIdle: true
          }
        });
      }
    }

    // 2. Vitamin & Mineral Reminders (linked with daily fixed routine)
    if (prefs.vitamins.enabled) {
      const routineDetail = fixedRoutine.count > 0
        ? `${t("Time to check off your daily routine")} (${fixedRoutine.count} ${t("items active")}).`
        : t('Time to take your vitamins and check off your daily routine!');

      // Morning Dose
      notificationsToSchedule.push({
        id: 2001,
        title: t('Morning Vitamins & Minerals 💊'),
        body: routineDetail,
        channelId: 'fittrack_vitamins',
        schedule: {
          at: getNextDateForTime(prefs.vitamins.morningTime),
          repeats: true,
          every: 'day',
          allowWhileIdle: true
        }
      });

      // Evening Dose
      notificationsToSchedule.push({
        id: 2002,
        title: t('Evening Supplement Protocol 🌙'),
        body: t("Don't forget your evening minerals and supplements before bedtime."),
        channelId: 'fittrack_vitamins',
        schedule: {
          at: getNextDateForTime(prefs.vitamins.eveningTime),
          repeats: true,
          every: 'day',
          allowWhileIdle: true
        }
      });
    }

    // 3. Meal Reminders
    if (prefs.meals.enabled) {
      // Breakfast
      notificationsToSchedule.push({
        id: 3001,
        title: t('Breakfast Time 🍳'),
        body: t("Fuel up for the day! Don't forget to log your breakfast."),
        channelId: 'fittrack_meals',
        schedule: {
          at: getNextDateForTime(prefs.meals.breakfastTime),
          repeats: true,
          every: 'day',
          allowWhileIdle: true
        }
      });

      // Lunch
      notificationsToSchedule.push({
        id: 3002,
        title: t('Lunch Reminder 🥗'),
        body: t("It's lunchtime! Log your meal to keep your protein and macros on track."),
        channelId: 'fittrack_meals',
        schedule: {
          at: getNextDateForTime(prefs.meals.lunchTime),
          repeats: true,
          every: 'day',
          allowWhileIdle: true
        }
      });

      // Snack
      if (prefs.meals.snackEnabled) {
        notificationsToSchedule.push({
          id: 3003,
          title: t('Afternoon Snack 🍎'),
          body: t('Check your remaining calorie budget and log your afternoon snack.'),
          channelId: 'fittrack_meals',
          schedule: {
            at: getNextDateForTime(prefs.meals.snackTime),
            repeats: true,
            every: 'day',
            allowWhileIdle: true
          }
        });
      }

      // Dinner
      notificationsToSchedule.push({
        id: 3004,
        title: t('Dinner Time 🍲'),
        body: t("Time for dinner! Log your evening meal to complete today's nutrition log."),
        channelId: 'fittrack_meals',
        schedule: {
          at: getNextDateForTime(prefs.meals.dinnerTime),
          repeats: true,
          every: 'day',
          allowWhileIdle: true
        }
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (err) {
    console.warn('Failed to schedule configured reminders:', err);
  }
}

/**
 * Fires an immediate test push notification.
 */
export async function sendTestNotification(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted && Capacitor.isNativePlatform()) {
    return false;
  }

  const title = t('FitTrack Notifications Active 🔔');
  const body = t("Push reminders are working! You'll receive scheduled alerts for water, vitamins, and meals.");

  if (Capacitor.isNativePlatform()) {
    try {
      await initializeNotificationChannels();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title,
            body,
            channelId: 'fittrack_reminders',
            schedule: { at: new Date(Date.now() + 500) }
          }
        ]
      });
      return true;
    } catch (e) {
      console.warn('Native test notification failed:', e);
      return false;
    }
  }

  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/food-images/1f964.svg',
          badge: '/food-images/1f964.svg'
        });
        return true;
      } catch (err) {
        console.warn('Web notification failed:', err);
      }
    }
  }

  return false;
}

/**
 * Evaluates active in-app banner alerts for hydration, meals, and vitamins.
 */
export function evaluateReminders(todayLog: DayLog, profile: UserProfile): ReminderAlert[] {
  const alerts: ReminderAlert[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const timeDecimal = currentHour + currentMinute / 60;

  const targetWater = profile.waterGoalMl || 2500;
  const currentWater = todayLog.waterMl || 0;

  // 1. Water Reminders
  if (timeDecimal >= 9.5 && currentWater === 0) {
    alerts.push({
      id: 'water_morning_empty',
      type: 'water',
      title: 'Time to Hydrate 💧',
      message: "You haven't logged any water today yet. Start your morning with a fresh glass of water!",
      actionText: '+250 ml Glass',
      severity: 'warning'
    });
  } else if (timeDecimal >= 13.5 && currentWater < targetWater * 0.35) {
    alerts.push({
      id: 'water_afternoon_low',
      type: 'water',
      title: 'Hydration Check 💧',
      message: 'Drink a bottle of water to stay energized and reach your daily goal.',
      actionText: '+500 ml Bottle',
      severity: 'info'
    });
  } else if (timeDecimal >= 17.5 && currentWater < targetWater * 0.7) {
    alerts.push({
      id: 'water_evening_low',
      type: 'water',
      title: 'Evening Hydration 💧',
      message: 'Keep up with your hydration goal. Have a glass of water before dinner.',
      actionText: '+250 ml Glass',
      severity: 'info'
    });
  }

  // 2. Meal Reminders
  if (timeDecimal >= 8.5 && timeDecimal <= 11.5 && (!todayLog.meals.breakfast || todayLog.meals.breakfast.length === 0)) {
    alerts.push({
      id: 'meal_breakfast_missing',
      type: 'meal',
      mealType: 'breakfast',
      title: 'Breakfast Time 🍳',
      message: "Don't forget to fuel up and log your breakfast for optimal energy today.",
      actionText: 'Log Breakfast',
      severity: 'info'
    });
  }

  if (timeDecimal >= 12.5 && timeDecimal <= 15.5 && (!todayLog.meals.lunch || todayLog.meals.lunch.length === 0)) {
    alerts.push({
      id: 'meal_lunch_missing',
      type: 'meal',
      mealType: 'lunch',
      title: 'Lunch Reminder 🥗',
      message: "It's lunchtime! Keep your macros on track by logging your meal.",
      actionText: 'Log Lunch',
      severity: 'info'
    });
  }

  if (timeDecimal >= 18.5 && timeDecimal <= 21.5 && (!todayLog.meals.dinner || todayLog.meals.dinner.length === 0)) {
    alerts.push({
      id: 'meal_dinner_missing',
      type: 'meal',
      mealType: 'dinner',
      title: 'Dinner Time 🍲',
      message: 'Time for dinner! Log your evening meal to wrap up your daily nutrition budget.',
      actionText: 'Log Dinner',
      severity: 'info'
    });
  }

  // 3. Vitamins & Supplements Reminders
  const supplementSchedule = profile.supplementSchedule || { enabled: true, frequency: 'daily_morning' };
  const loggedSupplements = todayLog.supplements || [];

  if (supplementSchedule.enabled) {
    const freq = supplementSchedule.frequency;
    let shouldRemind = false;
    let vitaminMsg = 'Time for your daily vitamins and supplements to maintain peak health!';

    if (freq === 'daily_morning') {
      if (timeDecimal >= 9.0 && loggedSupplements.length === 0) {
        shouldRemind = true;
        vitaminMsg = 'Start your morning right with your vitamins & supplements.';
      }
    } else if (freq === 'twice_daily') {
      if (timeDecimal >= 9.0 && timeDecimal < 18.0 && loggedSupplements.length === 0) {
        shouldRemind = true;
        vitaminMsg = 'Morning vitamin check: Take your daytime vitamins & minerals.';
      } else if (timeDecimal >= 19.5 && loggedSupplements.length < 2) {
        shouldRemind = true;
        vitaminMsg = 'Evening supplement check: Take your evening minerals (Magnesium/Zinc).';
      }
    } else if (freq === 'interval_4h' || freq === 'interval_6h' || freq === 'interval_8h' || freq === 'interval_12h') {
      if (timeDecimal >= 9.0 && loggedSupplements.length === 0) {
        shouldRemind = true;
        vitaminMsg = 'Scheduled supplement check: Have you taken your required vitamins?';
      }
    }

    if (shouldRemind) {
      alerts.push({
        id: 'supplement_routine_reminder',
        type: 'vitamin',
        title: 'Vitamin & Supplement Check 💊',
        message: vitaminMsg,
        actionText: 'Log Vitamins',
        severity: 'info'
      });
    }
  }

  return alerts;
}

/**
 * Fires a system notification if enabled and not already dispatched in the last 3 hours.
 */
export async function dispatchPendingSystemNotifications(alerts: ReminderAlert[]) {
  if (!areNotificationsEnabled()) return;
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  const now = Date.now();

  for (const alert of alerts) {
    const lastTime = getLastNotified(alert.id);
    if (now - lastTime > THREE_HOURS_MS) {
      if (Capacitor.isNativePlatform()) {
        try {
          await initializeNotificationChannels();
          await LocalNotifications.schedule({
            notifications: [
              {
                id: stringToIntegerId(alert.id),
                title: t(alert.title),
                body: t(alert.message),
                channelId: alert.type === 'vitamin' ? 'fittrack_vitamins' : 'fittrack_reminders',
                schedule: { at: new Date(Date.now() + 500) }
              }
            ]
          });
          setLastNotified(alert.id);
        } catch (nativeErr) {
          console.warn('Native notification schedule error:', nativeErr);
        }
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(t(alert.title), {
            body: t(alert.message),
            icon: '/food-images/1f964.svg',
            badge: '/food-images/1f964.svg',
            tag: alert.id
          });
          setLastNotified(alert.id);
        } catch (err) {
          console.warn('Failed to send browser notification:', err);
        }
      }
    }
  }
}
