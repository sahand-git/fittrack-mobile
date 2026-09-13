/* localized-render */
import { t, useLocale } from "../utils/locale";
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Barcode,
  Camera,
  Trash2,
  Coffee,
  Sun,
  Moon,
  Apple,
  Calendar,
  AlertTriangle,
  Flame,
  PieChart
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { MealType, LoggedMealItem, PremiumFeature } from '../types';
import { tokens } from '../theme/tokens';
import { formatDateDisplay, isDateFuture, isDateToday } from '../utils/date';

interface MealTrackerProps {
  onOpenFoodLog: (meal: MealType) => void;
  onOpenBarcodeScanner: (meal: MealType) => void;
  onOpenPlateScanner?: (meal: MealType) => void;
  onOpenUpgradeModal?: (feature: PremiumFeature) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const MEAL_SECTIONS: Array<{
  type: MealType;
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}> = [
  {
    type: 'breakfast',
    title: 'Breakfast',
    icon: <Coffee className="w-4 h-4 text-amber-600" strokeWidth={tokens.icons.strokeWidth} />,
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50 border-amber-200'
  },
  {
    type: 'lunch',
    title: 'Lunch',
    icon: <Sun className="w-4 h-4 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />,
    colorClass: 'text-teal-700',
    bgClass: 'bg-teal-50 border-teal-200'
  },
  {
    type: 'dinner',
    title: 'Dinner',
    icon: <Moon className="w-4 h-4 text-indigo-600" strokeWidth={tokens.icons.strokeWidth} />,
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50 border-indigo-200'
  },
  {
    type: 'snack',
    title: 'Snacks & Extras',
    icon: <Apple className="w-4 h-4 text-rose-600" strokeWidth={tokens.icons.strokeWidth} />,
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50 border-rose-200'
  }
];

export const MealTracker: React.FC<MealTrackerProps> = ({
  onOpenFoodLog,
  onOpenBarcodeScanner,
  onOpenPlateScanner,
  onOpenUpgradeModal
}) => {
  useLocale();
  const { todayLog, currentDate, profile, removeLoggedFood, isPremium } = useFitness();

  const isFuture = isDateFuture(currentDate);
  const isToday = isDateToday(currentDate);

  // Calculate day macro totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  Object.values(todayLog.meals).forEach((items) => {
    (items || []).forEach((item) => {
      totalCalories += item.calories;
      totalProtein += item.protein;
      totalCarbs += item.carbs;
      totalFat += item.fat;
    });
  });

  totalProtein = Math.round(totalProtein * 10) / 10;
  totalCarbs = Math.round(totalCarbs * 10) / 10;
  totalFat = Math.round(totalFat * 10) / 10;

  const totalMacroGrams = totalProtein + totalCarbs + totalFat;
  const proteinPercent = totalMacroGrams > 0 ? Math.round((totalProtein / totalMacroGrams) * 100) : 30;
  const carbsPercent = totalMacroGrams > 0 ? Math.round((totalCarbs / totalMacroGrams) * 100) : 45;
  const fatPercent = totalMacroGrams > 0 ? Math.max(0, 100 - proteinPercent - carbsPercent) : 25;

  return (
    <div className="space-y-4">
      {/* Header & Date Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{t("Meals & Daily Nutrition")}</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">
              📅 {isToday ? `${t("Today")}, ${formatDateDisplay(currentDate)}` : formatDateDisplay(currentDate)}
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {t("Log each course, track macronutrient distribution, and balance calories")}
          </p>
        </div>
      </div>

      {/* Future Date Lock Banner */}
      {isFuture && (
        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">
            {t("Food logging is locked for future dates. Navigate to today or a past date to record your meals.")}
          </span>
        </div>
      )}

      {/* Macro Breakdown Strip */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t("Day Macronutrient Distribution")}</span>
          </div>
          <span className="text-xs font-extrabold text-teal-700 font-mono">
            {totalCalories} / {profile.targetCalories} kcal
          </span>
        </div>

        {/* Visual Macro Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${proteinPercent}%` }}
            className="bg-teal-500 h-full transition-all"
            title={`Protein: ${proteinPercent}%`}
          />
          <div
            style={{ width: `${carbsPercent}%` }}
            className="bg-amber-400 h-full transition-all"
            title={`Carbs: ${carbsPercent}%`}
          />
          <div
            style={{ width: `${fatPercent}%` }}
            className="bg-rose-400 h-full transition-all"
            title={`Fat: ${fatPercent}%`}
          />
        </div>

        {/* Macro Numbers */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2 rounded-xl bg-teal-50/60 border border-teal-100">
            <span className="text-[10px] text-teal-800 font-bold block">{t("Protein")}</span>
            <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">{totalProtein}g</span>
            <span className="text-[9px] text-slate-500 font-medium">{proteinPercent}%</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="text-[10px] text-amber-800 font-bold block">{t("Carbs")}</span>
            <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">{totalCarbs}g</span>
            <span className="text-[9px] text-slate-500 font-medium">{carbsPercent}%</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-100">
            <span className="text-[10px] text-rose-800 font-bold block">{t("Fats")}</span>
            <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">{totalFat}g</span>
            <span className="text-[9px] text-slate-500 font-medium">{fatPercent}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEAL_SECTIONS.map((section) => {
          const items: LoggedMealItem[] = todayLog.meals[section.type] || [];
          const mealCalories = items.reduce((acc, item) => acc + item.calories, 0);
          const mealProtein = Math.round(items.reduce((acc, item) => acc + item.protein, 0) * 10) / 10;
          const mealCarbs = Math.round(items.reduce((acc, item) => acc + item.carbs, 0) * 10) / 10;
          const mealFat = Math.round(items.reduce((acc, item) => acc + item.fat, 0) * 10) / 10;

          return (
            <div
              key={section.type}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${section.bgClass}`}>{section.icon}</div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{t(section.title)}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {mealProtein}g P • {mealCarbs}g C • {mealFat}g F
                      </span>
                    </div>
                  </div>

                  <div className="text-end">
                    <span className={`text-sm font-black ${section.colorClass} block`}>
                      {mealCalories} kcal
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 pt-3 min-h-[60px]">
                  <AnimatePresence>
                    {items.length > 0 ? (
                      items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200/90 flex items-center justify-between gap-3 group transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate block">{t(item.name)}</span>
                              {item.barcode && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold shrink-0">
                                  {t("Barcode")}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                              {item.servingsCount > 1 ? `${item.servingsCount}x ` : ''}
                              {item.servingSize} • P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-slate-800 font-mono">{item.calories} kcal</span>
                            <button
                              type="button"
                              onClick={() => removeLoggedFood(section.type, item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 opacity-70 group-hover:opacity-100 transition-all rounded-lg cursor-pointer"
                              title={t("Delete entry")}
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={tokens.icons.strokeWidth} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-400 italic">
                        {t("No food logged yet for")} {t(section.title)}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isFuture}
                  onClick={() => onOpenFoodLog(section.type)}
                  className={`flex-1 py-2 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                    isFuture ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
                  <span>{t("Add Food")}</span>
                </button>

                <button
                  type="button"
                  disabled={isFuture}
                  onClick={() => {
                    if (!isPremium && onOpenUpgradeModal) {
                      onOpenUpgradeModal('barcode');
                    } else {
                      onOpenBarcodeScanner(section.type);
                    }
                  }}
                  className={`px-3 py-2 bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-cyan-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                    isFuture ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                  }`}
                  title={t("Scan package barcode")}
                >
                  <Barcode className="w-4 h-4 text-cyan-700" strokeWidth={tokens.icons.strokeWidth} />
                  {!isPremium && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-200/80 text-cyan-900 px-1 rounded">
                      PRO
                    </span>
                  )}
                </button>

                {onOpenPlateScanner && (
                  <button
                    type="button"
                    disabled={isFuture}
                    onClick={() => {
                      if (!isPremium && onOpenUpgradeModal) {
                        onOpenUpgradeModal('ai_plate');
                      } else {
                        onOpenPlateScanner(section.type);
                      }
                    }}
                    className={`px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                      isFuture ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                    }`}
                    title={t("Scan plate with AI Camera")}
                  >
                    <Camera className="w-4 h-4 text-emerald-700" strokeWidth={tokens.icons.strokeWidth} />
                    {!isPremium && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-1 rounded">
                        PRO
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
