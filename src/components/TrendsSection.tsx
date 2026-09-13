/* localized-render */
import React, { useState, useMemo } from 'react';
import { useFitness } from '../context/FitnessContext';
import { t, useLocale, getLocale } from '../utils/locale';
import { tokens } from '../theme/tokens';
import { TrendLineChart, DataPoint } from './TrendLineChart';
import { TrendBarChart, CalorieDataPoint } from './TrendBarChart';
import { calculateLoggingStreak } from '../utils/streak';
import { parseDateParts } from '../utils/date';
import {
  TrendingUp,
  Scale,
  Utensils,
  Flame,
  PlusCircle
} from 'lucide-react';

interface TrendsSectionProps {
  onOpenProfile?: () => void;
}

export const TrendsSection: React.FC<TrendsSectionProps> = ({ onOpenProfile }) => {
  useLocale();
  const { dailyLogs, weightHistory, profile, addWeightEntry, currentDate } = useFitness();
  const [daysRange, setDaysRange] = useState<7 | 30>(7);
  const [activeTab, setActiveTab] = useState<'all' | 'weight' | 'calories'>('all');
  const [showQuickWeightModal, setShowQuickWeightModal] = useState(false);
  const [quickWeight, setQuickWeight] = useState<string>(profile.weightKg ? String(profile.weightKg) : '70');

  const streak = useMemo(() => {
    return calculateLoggingStreak(dailyLogs, weightHistory, currentDate);
  }, [dailyLogs, weightHistory, currentDate]);

  // Generate date list for the selected range ending at currentDate
  const dateList = useMemo(() => {
    const list: string[] = [];
    const { year, month, day } = parseDateParts(currentDate);
    const anchor = new Date(year, month - 1, day);

    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      list.push(`${y}-${m}-${da}`);
    }
    return list;
  }, [currentDate, daysRange]);

  // Prepare Calorie Data Points
  const calorieData: CalorieDataPoint[] = useMemo(() => {
    return dateList.map((dateStr) => {
      const dayLog = dailyLogs[dateStr];
      let totalCalories = 0;
      if (dayLog && dayLog.meals) {
        const { breakfast = [], lunch = [], dinner = [], snack = [] } = dayLog.meals;
        const allItems = [...breakfast, ...lunch, ...dinner, ...snack];
        totalCalories = allItems.reduce((sum, item) => sum + (item.calories || 0), 0);
      }

      // Weekday label for 7-day view
      let label: string | undefined;
      if (daysRange === 7) {
        const { year, month, day } = parseDateParts(dateStr);
        const d = new Date(year, month - 1, day);
        label = d.toLocaleDateString(undefined, { weekday: 'narrow' });
      }

      return {
        date: dateStr,
        calories: Math.round(totalCalories),
        target: profile.targetCalories || 2000,
        label
      };
    });
  }, [dateList, dailyLogs, daysRange, profile.targetCalories]);

  // Prepare Weight Data Points
  const weightData: DataPoint[] = useMemo(() => {
    const minDate = dateList[0];
    const maxDate = dateList[dateList.length - 1];

    // Filter weight history in this date window
    const inWindow = (weightHistory || [])
      .filter((w) => w.date >= minDate && w.date <= maxDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    // If we have entries in window, map them
    if (inWindow.length > 0) {
      return inWindow.map((w) => ({
        date: w.date,
        value: w.weightKg,
        note: w.note
      }));
    }

    return [];
  }, [weightHistory, dateList, profile.weightKg, currentDate]);

  const handleQuickWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickWeight);
    if (!isNaN(val) && val > 20 && val < 400) {
      addWeightEntry(val);
      setShowQuickWeightModal(false);
    }
  };

  const lang = getLocale();
  const rtl = lang === 'ar' || lang === 'ckb';

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Summary Card */}
      <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/90 rounded-3xl p-5 md:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60">
                <TrendingUp className="w-5 h-5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {t("Progress & Trends")}
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              {t("Track your body composition and caloric consistency over time.")}
            </p>
          </div>

          {/* Quick Metrics & Streak Badge */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Streak Counter Pill */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-orange-50/80 border border-orange-200 text-orange-800 shadow-sm">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" strokeWidth={tokens.icons.strokeWidth} />
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block leading-none">
                  {t("Streak")}
                </span>
                <span className="text-sm font-black text-orange-950 font-mono">
                  {streak.currentStreak} {streak.currentStreak === 1 ? t("day") : t("days")}
                </span>
              </div>
            </div>

            {/* Range Toggle (7D / 30D) */}
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setDaysRange(7)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  daysRange === 7
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t("7 Days")}
              </button>
              <button
                type="button"
                onClick={() => setDaysRange(30)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  daysRange === 30
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t("30 Days")}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-200/60 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            {t("Overview")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weight')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'weight'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Scale className="w-3.5 h-3.5" strokeWidth={tokens.icons.strokeWidth} />
            <span>{t("Weight")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calories')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'calories'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" strokeWidth={tokens.icons.strokeWidth} />
            <span>{t("Calories")}</span>
          </button>
        </div>
      </div>

      {/* Weight Trend Card */}
      {(activeTab === 'all' || activeTab === 'weight') && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100">
                <Scale className="w-5 h-5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t("Weight Progression")}</h3>
                <p className="text-xs text-slate-500">{t("Track how your weight changes over time")}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQuickWeightModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" strokeWidth={tokens.icons.strokeWidth} />
              <span>{t("Log Weight")}</span>
            </button>
          </div>

          <TrendLineChart
            data={weightData}
            targetValue={profile.targetWeightKg}
            unit="kg"
            emptyMessage="No weight entries recorded in this period."
          />
        </div>
      )}

      {/* Calorie Balance Card */}
      {(activeTab === 'all' || activeTab === 'calories') && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Utensils className="w-5 h-5 text-emerald-600" strokeWidth={tokens.icons.strokeWidth} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t("Caloric Intake vs. Target")}</h3>
                <p className="text-xs text-slate-500">{t("Compare daily consumption against your energy budget")}</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
                <span>{t("Within budget")}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>{t("Over budget")}</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-3">{t("Historical intake is compared with your current target; past targets were not recorded.")}</p>
          <TrendBarChart
            data={calorieData}
            targetCalories={profile.targetCalories || 2000}
            emptyMessage="No meals logged in this period."
          />
        </div>
      )}

      {/* Quick Weight Modal */}
      {showQuickWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4"
            dir={rtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
                <h4 className="text-base font-bold text-slate-900">{t("Log Today's Weight")}</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickWeightModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickWeightSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  {t("Weight (kg)")}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="350"
                    autoFocus
                    value={quickWeight}
                    onChange={(e) => setQuickWeight(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickWeightModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {t("Save Entry")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
