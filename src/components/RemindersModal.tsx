import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Droplet,
  Pill,
  Utensils,
  Check,
  BellRing,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { t, useLocale } from '../utils/locale';
import { tokens } from '../theme/tokens';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  scheduleAllConfiguredReminders,
  sendTestNotification,
  getFixedRoutineSummary,
  checkNotificationPermission,
  requestNotificationPermission,
  type NotificationPreferences
} from '../utils/notifications';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({ isOpen, onClose }) => {
  useLocale();
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences);
  const [fixedRoutine, setFixedRoutine] = useState(getFixedRoutineSummary);
  const [permissionStatus, setPermissionStatus] = useState<string>('prompt');
  const [testSent, setTestSent] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPrefs(getNotificationPreferences());
      setFixedRoutine(getFixedRoutineSummary());
      checkNotificationPermission().then(setPermissionStatus);
      setTestSent(false);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    const status = await checkNotificationPermission();
    setPermissionStatus(status);
    if (granted) {
      setPrefs(prev => ({ ...prev, enabled: true }));
    }
  };

  const handleSave = async () => {
    saveNotificationPreferences(prefs);
    await scheduleAllConfiguredReminders(prefs);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      await handleRequestPermission();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-gradient-to-r from-amber-50/80 via-white to-teal-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100/90 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs">
              <Bell className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 leading-tight">
                <span>{t("Push Notifications & Reminders")}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t("Smart timed alerts for hydration, vitamins, and meals")}
              </p>
            </div>
          </div>
          <button aria-label={t("Close")}
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-2xl hover:bg-slate-100/80 transition-colors"
            title={t("Close")}
          >
            <X className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Master Enable & System Permission Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>{t("Enable Device Notifications")}</span>
                {permissionStatus === 'granted' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 text-[10px] font-bold border border-emerald-200 shrink-0 whitespace-nowrap">
                    <ShieldCheck className="w-3 h-3" />
                    {t("Active")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-800 text-[10px] font-bold border border-amber-200 shrink-0 whitespace-nowrap">
                    <AlertCircle className="w-3 h-3" />
                    {t("Permission Needed")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t("Receive reminders on your phone even when Calorie Pewar is in the background")}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {permissionStatus !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow-2xs transition-all active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  {t("Allow")}
                </button>
              )}
              <div dir="ltr" className="inline-flex shrink-0 ms-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.enabled}
                    onChange={(e) => setPrefs(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 1. Water Reminders Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 text-start">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-start min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-cyan-100/80 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                  <Droplet className="w-4 h-4 fill-cyan-500" />
                </div>
                <div className="text-start min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">{t("Water Reminders")}</h3>
                  <p className="text-[11px] text-slate-500">{t("Periodic reminders to drink water throughout the day.")}</p>
                </div>
              </div>
              <div dir="ltr" className="inline-flex shrink-0 ms-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.water.enabled}
                    onChange={(e) => setPrefs(prev => ({
                      ...prev,
                      water: { ...prev.water, enabled: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>

            {prefs.water.enabled && (
              <div className="pt-2 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>{t("Interval (Hours)")}:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setPrefs(prev => ({
                          ...prev,
                          water: { ...prev.water, intervalHours: hours }
                        }))}
                        className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                          prefs.water.intervalHours === hours
                            ? 'bg-cyan-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 bg-cyan-50/60 p-2 rounded-xl border border-cyan-100">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                    {t("Waking Schedule")}:
                  </span>
                  <span className="font-bold text-cyan-900 font-mono">
                    08:00 → 21:00 ({t("Every")} {prefs.water.intervalHours}h)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Vitamin & Mineral Reminders Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 text-start">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-start min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-indigo-100/80 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="text-start min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">{t("Vitamins & Minerals")}</h3>
                  <p className="text-[11px] text-slate-500">{t("Reminders to check off their daily vitamin list")}</p>
                </div>
              </div>
              <div dir="ltr" className="inline-flex shrink-0 ms-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.vitamins.enabled}
                    onChange={(e) => setPrefs(prev => ({
                      ...prev,
                      vitamins: { ...prev.vitamins, enabled: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {prefs.vitamins.enabled && (
              <div className="pt-2 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                {/* Fixed checklist link notice */}
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-indigo-950">
                    <span className="font-bold">{t("Linked to your daily fixed checklist")}: </span>
                    {fixedRoutine.count > 0 ? (
                      <span>{fixedRoutine.count} {t("routine items active")} ({fixedRoutine.names.slice(0, 3).join(', ')}{fixedRoutine.count > 3 ? '...' : ''})</span>
                    ) : (
                      <span className="text-indigo-700">{t("No daily fixed checklist saved yet. Reminds you to take daily vitamins.")}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {t("Morning Dose")}
                    </label>
                    <input
                      type="time"
                      value={prefs.vitamins.morningTime}
                      onChange={(e) => setPrefs(prev => ({
                        ...prev,
                        vitamins: { ...prev.vitamins, morningTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {t("Evening Dose")}
                    </label>
                    <input
                      type="time"
                      value={prefs.vitamins.eveningTime}
                      onChange={(e) => setPrefs(prev => ({
                        ...prev,
                        vitamins: { ...prev.vitamins, eveningTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Meals Reminders Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 text-start">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-start min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <Utensils className="w-4 h-4" />
                </div>
                <div className="text-start min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">{t("Meal Reminders")}</h3>
                  <p className="text-[11px] text-slate-500">{t("Timed reminders for eating their scheduled meals.")}</p>
                </div>
              </div>
              <div dir="ltr" className="inline-flex shrink-0 ms-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.meals.enabled}
                    onChange={(e) => setPrefs(prev => ({
                      ...prev,
                      meals: { ...prev.meals, enabled: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {prefs.meals.enabled && (
              <div className="pt-2 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {t("Breakfast")}
                    </label>
                    <input
                      type="time"
                      value={prefs.meals.breakfastTime}
                      onChange={(e) => setPrefs(prev => ({
                        ...prev,
                        meals: { ...prev.meals, breakfastTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {t("Lunch")}
                    </label>
                    <input
                      type="time"
                      value={prefs.meals.lunchTime}
                      onChange={(e) => setPrefs(prev => ({
                        ...prev,
                        meals: { ...prev.meals, lunchTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {t("Snack")}
                      </label>
                      <input
                        type="checkbox"
                        checked={prefs.meals.snackEnabled}
                        onChange={(e) => setPrefs(prev => ({
                          ...prev,
                          meals: { ...prev.meals, snackEnabled: e.target.checked }
                        }))}
                        className="rounded text-emerald-600 w-3 h-3"
                      />
                    </div>
                    <input
                      type="time"
                      disabled={!prefs.meals.snackEnabled}
                      value={prefs.meals.snackTime}
                      onChange={(e) => setPrefs(prev => ({
                        ...prev,
                        meals: { ...prev.meals, snackTime: e.target.value }
                      }))}
                      className={`w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-emerald-500 ${
                        !prefs.meals.snackEnabled ? 'opacity-40' : ''
                      }`}
                    />
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {t("Dinner")}
                    </label>
                    <input
                      type="time"
                      value={prefs.meals.dinnerTime}
                      onChange={(e) => setPrefs(prev => ({
                        ...prev,
                        meals: { ...prev.meals, dinnerTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestNotification}
            className="px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100/90 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-600" />
            <span>{testSent ? t("Notification Sent! 🔔") : t("Send Test Push Notification")}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-2xl text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{saveSuccess ? t("Saved!") : t("Save & Apply Schedule")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
