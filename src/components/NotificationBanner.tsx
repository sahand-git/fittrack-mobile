import React, { useEffect, useState } from 'react';
import { AlertCircle, Droplet, Utensils, Pill, X } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { t, useLocale } from '../utils/locale';
import { evaluateReminders, dispatchPendingSystemNotifications, type ReminderAlert } from '../utils/notifications';
import type { MealType } from '../types';

interface NotificationBannerProps {
  onOpenMealLog?: (mealType: MealType) => void;
  onOpenSupplementTracker?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onOpenMealLog,
  onOpenSupplementTracker
}) => {
  useLocale();
  const { todayLog, profile, updateWater } = useFitness();
  const [alerts, setAlerts] = useState<ReminderAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const active = evaluateReminders(todayLog, profile);
    setAlerts(active);
    dispatchPendingSystemNotifications(active);
  }, [todayLog, profile]);

  const visibleAlerts = alerts.filter(a => !dismissedIds[a.id]);
  if (visibleAlerts.length === 0) return null;

  const current = visibleAlerts[0];

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => ({ ...prev, [id]: true }));
  };

  const handleAction = () => {
    if (current.type === 'water') {
      updateWater(250);
      handleDismiss(current.id);
    } else if (current.type === 'meal' && current.mealType && onOpenMealLog) {
      onOpenMealLog(current.mealType);
      handleDismiss(current.id);
    } else if (current.type === 'vitamin' && onOpenSupplementTracker) {
      onOpenSupplementTracker();
      handleDismiss(current.id);
    }
  };

  const isWater = current.type === 'water';
  const isVitamin = current.type === 'vitamin';

  return (
    <div className={`mb-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300 text-start ${
      isWater
        ? 'bg-cyan-50/95 border-cyan-200/90 text-cyan-950'
        : isVitamin
        ? 'bg-amber-50/95 border-amber-200/90 text-amber-950'
        : 'bg-emerald-50/95 border-emerald-200/90 text-emerald-950'
    }`}>
      <div className="flex items-start gap-3 min-w-0 flex-1 text-start">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isWater
            ? 'bg-cyan-100/80 text-cyan-600 border border-cyan-200'
            : isVitamin
            ? 'bg-amber-100/80 text-amber-600 border border-amber-200'
            : 'bg-emerald-100/80 text-emerald-600 border border-emerald-200'
        }`}>
          {isWater ? (
            <Droplet className="w-4 h-4 fill-cyan-500 text-cyan-600" />
          ) : isVitamin ? (
            <Pill className="w-4 h-4 text-amber-600" />
          ) : (
            <Utensils className="w-4 h-4 text-emerald-600" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-start">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <span>{t(current.title)}</span>
          </div>
          <p className="text-[11px] opacity-85 leading-tight truncate-2-lines mt-0.5 font-medium">
            {t(current.message)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ms-2">
        {current.actionText && (
          <button
            type="button"
            onClick={handleAction}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
              isWater
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : isVitamin
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {t(current.actionText)}
          </button>
        )}
        <button
          type="button"
          onClick={() => handleDismiss(current.id)}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          title={t("Dismiss")}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
