import React, { useState } from 'react';
import { Droplet, Plus, Minus, Bell, BellRing, Sparkles } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { t, useLocale } from '../utils/locale';
import { tokens } from '../theme/tokens';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  areNotificationsEnabled,
  setNotificationsEnabled
} from '../utils/notifications';

export const WaterTrackerCard: React.FC = () => {
  useLocale();
  const { todayLog, profile, updateWater } = useFitness();
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [notifState, setNotifState] = useState<boolean>(areNotificationsEnabled());

  const target = profile.waterGoalMl || 2500;
  const current = todayLog.waterMl || 0;
  const percentage = Math.min(100, Math.round((current / target) * 100));
  const glasses = Math.round(current / 250);

  const handleQuickAdd = (amount: number) => {
    updateWater(amount);
    navigator.vibrate?.(30);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customAmount, 10);
    if (!isNaN(val) && val > 0) {
      updateWater(val);
      setCustomAmount('');
      setShowCustomInput(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!isNotificationSupported()) {
      alert(t('System notifications are not supported in this browser environment.'));
      return;
    }
    const currentPerm = getNotificationPermission();
    if (currentPerm !== 'granted') {
      const granted = await requestNotificationPermission();
      setNotifState(granted);
    } else {
      const next = !notifState;
      setNotificationsEnabled(next);
      setNotifState(next);
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
            <Droplet className="w-5 h-5 fill-cyan-500 text-cyan-500" strokeWidth={tokens.icons.strokeWidth} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              {t("Hydration Tracker")}
              {percentage >= 100 && (
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Sparkles className="w-3 h-3 text-teal-600" /> {t("Goal Met!")}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {t("Target: ")}{target}{t(" ml (")}{Math.round(target / 250)} {t("glasses)")}
            </p>
          </div>
        </div>

        {/* Reminder Toggle */}
        <button
          type="button"
          onClick={handleToggleNotifications}
          title={t(notifState ? "Reminders Enabled" : "Enable Drink & Meal Reminders")}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border shrink-0 whitespace-nowrap cursor-pointer ${
            notifState
              ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          {notifState ? (
            <>
              <BellRing className="w-3.5 h-3.5 text-cyan-600" strokeWidth={tokens.icons.strokeWidth} />
              <span className="text-[11px]">{t("Reminders On")}</span>
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5 text-slate-500" strokeWidth={tokens.icons.strokeWidth} />
              <span className="text-[11px]">{t("Enable Reminders")}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Metric & Visual Bar */}
      <div className="my-4">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {current}
            </span>
            <span className="text-sm font-semibold text-slate-500">/ {target} ml</span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {glasses} {t("glasses")} ({percentage}%)
          </span>
        </div>

        {/* Progress bar with clean cyan gradient */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleQuickAdd(250)}
          className="flex-1 py-2 px-3 bg-cyan-50 hover:bg-cyan-100/80 active:scale-95 text-cyan-800 border border-cyan-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-600" strokeWidth={tokens.icons.strokeWidth} />
          <span>+250 ml</span>
          <span className="text-[10px] text-cyan-600/80 font-normal">({t("1 glass")})</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickAdd(500)}
          className="flex-1 py-2 px-3 bg-sky-50 hover:bg-sky-100/80 active:scale-95 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-sky-600" strokeWidth={tokens.icons.strokeWidth} />
          <span>+500 ml</span>
          <span className="text-[10px] text-sky-600/80 font-normal">({t("bottle")})</span>
        </button>

        {current > 0 && (
          <button
            type="button"
            onClick={() => handleQuickAdd(-250)}
            title={t("Undo 250ml")}
            className="p-2 bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={tokens.icons.strokeWidth} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 text-xs font-bold border border-slate-200 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer"
        >
          {t("Custom")}
        </button>
      </div>

      {/* Custom Amount Dialog / Input */}
      {showCustomInput && (
        <form onSubmit={handleCustomSubmit} className="mt-3 flex gap-2 pt-3 border-t border-slate-100">
          <input
            type="number"
            min="10"
            max="3000"
            step="10"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder={t("e.g. 330 ml")}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
          />
          <button
            type="submit"
            disabled={!customAmount}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
          >
            {t("Add")}
          </button>
        </form>
      )}
    </div>
  );
};
