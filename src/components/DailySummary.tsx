/* localized-render */
import { t, useLocale, localeTag } from "../utils/locale";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Utensils,
  Footprints,
  Dumbbell,
  Droplets,
  Plus,
  Sparkles,
  Barcode,
  Bot,
  Zap,
  Info,
  CheckCircle2,
  ChevronRight,
  Camera,
  ChevronDown,
  ChevronUp,
  Pill
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { MealType, PremiumFeature } from '../types';
import { sumNutrients } from '../utils/nutrition';
import { calorieBudget } from '../utils/calculator';
import { tokens } from '../theme/tokens';

interface DailySummaryProps {
  onOpenBarcodeScanner: (meal: MealType) => void;
  onOpenPlateScanner?: (meal: MealType) => void;
  onOpenFoodLog: (meal: MealType) => void;
  onOpenStepTracker: () => void;
  onOpenAICoach: () => void;
  onOpenAddWorkout: () => void;
  onOpenSupplementTracker?: () => void;
  onOpenUpgradeModal?: (feature: PremiumFeature) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  onOpenBarcodeScanner,
  onOpenPlateScanner,
  onOpenFoodLog,
  onOpenStepTracker,
  onOpenAICoach,
  onOpenAddWorkout,
  onOpenSupplementTracker,
  activeTab,
  setActiveTab,
  onOpenUpgradeModal
}) => {
  useLocale();
  const { profile, todayLog, updateWater, isPremium } = useFitness();
  const [showMicros, setShowMicros] = useState<boolean>(false);

  // Aggregate consumed food nutrients
  const allMeals = [
    ...todayLog.meals.breakfast,
    ...todayLog.meals.lunch,
    ...todayLog.meals.dinner,
    ...todayLog.meals.snack
  ];

  const consumedCalories = allMeals.reduce((acc, m) => acc + m.calories, 0);
  const consumedProtein = Math.round(allMeals.reduce((acc, m) => acc + m.protein, 0) * 10) / 10;
  const consumedCarbs = Math.round(allMeals.reduce((acc, m) => acc + m.carbs, 0) * 10) / 10;
  const consumedFat = Math.round(allMeals.reduce((acc, m) => acc + m.fat, 0) * 10) / 10;

  // Stored nutrients already represent the selected portion.
  const totalMicros = sumNutrients(allMeals);

  // Active burns
  const workoutBurn = todayLog.workouts.reduce((acc, w) => acc + w.caloriesBurned, 0);
  const stepBurn = todayLog.stepCaloriesBurned || 0;
  const activeBurnToAdd = profile.includeStepsInCalorieBudget ? stepBurn : 0;

  // Dynamic remaining calories
  const dynamicBudget = calorieBudget(profile, todayLog);
  const remainingCalories = dynamicBudget - consumedCalories;

  const targetCal = profile.targetCalories || 2000;
  const calPercent = Math.min(100, Math.round((consumedCalories / dynamicBudget) * 100));

  const proteinTarget = profile.targetProtein || 150;
  const carbsTarget = profile.targetCarbs || 200;
  const fatTarget = profile.targetFat || 65;

  const waterPercent = Math.min(100, Math.round((todayLog.waterMl / (profile.waterGoalMl || 2500)) * 100));
  const stepPercent = Math.min(100, Math.round((todayLog.steps / (profile.stepGoal || 10000)) * 100));

  return (
    <div className="space-y-5">
      {/* 1. Main Caloric Gauge & Energy Matrix */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
        {/* Top Row: Daily Calorie Equation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500 whitespace-nowrap">{t("Daily Calorie Target")}</span>
              {profile.includeStepsInCalorieBudget && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 whitespace-nowrap">{t("+ Step Burn Enabled")}</span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                {t(remainingCalories >= 0 ? remainingCalories.toLocaleString(localeTag()) : `+${Math.abs(remainingCalories).toLocaleString(localeTag())}`)}
              </span>
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                {t(remainingCalories >= 0 ? 'kcal remaining' : 'kcal over target')}
              </span>
            </div>
          </div>

          {/* Quick Action Matrix Bar */}
          <div className="flex flex-wrap gap-2">
            <button
              id="btn-quick-plate-scanner"
              type="button"
              onClick={() => {
                if (!isPremium && onOpenUpgradeModal) {
                  onOpenUpgradeModal('ai_plate');
                  return;
                }
                onOpenPlateScanner?.('lunch');
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 whitespace-nowrap"
            >
              <Camera className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              <span>{t("AI Plate Camera")}</span>
              {!isPremium && (
                <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-white/20 text-white leading-none">
                  {t("PRO")}
                </span>
              )}
            </button>

            <button
              id="btn-quick-scan-barcode"
              type="button"
              onClick={() => {
                onOpenBarcodeScanner('lunch');
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 whitespace-nowrap"
            >
              <Barcode className="w-4 h-4 text-cyan-700" strokeWidth={tokens.icons.strokeWidth} />
              <span>{t("Scan Barcode")}</span>
            </button>

            <button
              id="btn-quick-ai-audit"
              type="button"
              onClick={() => {
                if (!isPremium && onOpenUpgradeModal) {
                  onOpenUpgradeModal('gemini_coach');
                  return;
                }
                onOpenAICoach();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
              <span>{t("AI Coach Audit")}</span>
              {!isPremium && (
                <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 leading-none">
                  {t("PRO")}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Calorie Math Grid: responsive 2 columns on phone, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block whitespace-nowrap">{t("Base Goal")}</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">{t(targetCal)}</span>
            <span className="text-[9px] text-slate-400 block whitespace-nowrap">{t("Mifflin-St Jeor")}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block whitespace-nowrap">{t("Food In")}</span>
            <span className="text-sm sm:text-base font-bold text-teal-700 mt-0.5 block">{t(consumedCalories)}</span>
            <span className="text-[9px] text-slate-400 block whitespace-nowrap">{t(calPercent)}{t("% budget")}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block whitespace-nowrap">{t("Workout")}</span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 mt-0.5 block">+{t(workoutBurn)}</span>
            <span className="text-[9px] text-slate-400 block whitespace-nowrap">{t("active burn")}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block whitespace-nowrap">{t("Step Burn")}</span>
            <span className="text-sm sm:text-base font-bold text-amber-600 mt-0.5 block">
              {t(profile.includeStepsInCalorieBudget ? `+${stepBurn}` : `${stepBurn}`)}
            </span>
            <span className="text-[9px] text-slate-400 block whitespace-nowrap">{t(profile.includeStepsInCalorieBudget ? 'added' : 'tracked')}</span>
          </div>
        </div>

        {/* Calorie Progress Line */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/70">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, calPercent)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              consumedCalories > dynamicBudget
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500'
            }`}
          />
        </div>

        {/* 3 Major Macronutrient Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Protein */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-800">{t("Protein")}</span>
              <span className="font-bold text-slate-900">
                {t(consumedProtein)} <span className="text-slate-500 font-normal">/ {t(proteinTarget)}{t("g")}</span>
              </span>
            </div>
            <div className="w-full bg-sky-100/80 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (consumedProtein / proteinTarget) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-sky-700 block font-mono">
              {t(Math.round((consumedProtein / proteinTarget) * 100))}{t("% of goal ")}
            </span>
          </div>

          {/* Carbs */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-800">{t("Carbohydrates")}</span>
              <span className="font-bold text-slate-900">
                {t(consumedCarbs)} <span className="text-slate-500 font-normal">/ {t(carbsTarget)}{t("g")}</span>
              </span>
            </div>
            <div className="w-full bg-amber-100/80 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (consumedCarbs / carbsTarget) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-700 block font-mono">
              {t(Math.round((consumedCarbs / carbsTarget) * 100))}{t("% of goal ")}
            </span>
          </div>

          {/* Fats */}
          <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-violet-800">{t("Fats")}</span>
              <span className="font-bold text-slate-900">
                {t(consumedFat)} <span className="text-slate-500 font-normal">/ {t(fatTarget)}{t("g")}</span>
              </span>
            </div>
            <div className="w-full bg-violet-100/80 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (consumedFat / fatTarget) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-violet-700 block font-mono">
              {t(Math.round((consumedFat / fatTarget) * 100))}{t("% of goal ")}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Hydration & Phone Steps Twin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hydration Tracker */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                <Droplets className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <span className="text-xs font-bold text-slate-900 block">{t("Hydration")}</span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {t(todayLog.waterMl)} / {t(profile.waterGoalMl || 2500)}{t(" ml (")}{t(waterPercent)}%)
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-cyan-700 font-mono shrink-0 whitespace-nowrap">
              {t(Math.round(todayLog.waterMl / 250))}{t(" glasses ")}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${waterPercent}%` }}
            />
          </div>

          {/* Quick Water Increment Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-add-water-250"
              type="button"
              onClick={() => updateWater(250)}
              className="py-2 px-2 sm:px-3 bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-cyan-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3 h-3 text-cyan-600" strokeWidth={tokens.icons.strokeWidth} />
              <span>{t("250 ml")}</span>
            </button>

            <button
              id="btn-add-water-500"
              type="button"
              onClick={() => updateWater(500)}
              className="py-2 px-2 sm:px-3 bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-cyan-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3 h-3 text-cyan-600" strokeWidth={tokens.icons.strokeWidth} />
              <span>{t("500 ml")}</span>
            </button>

            <button
              id="btn-sub-water-250"
              type="button"
              onClick={() => updateWater(-250)}
              className="py-2 px-2 sm:px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            >
              {t("-250 ml")}
            </button>
          </div>
        </div>

        {/* Step Counter Card with Direct Sensor Launch */}
        <div
          id="card-daily-steps"
          onClick={onOpenStepTracker}
          className="bg-white border border-slate-200/80 hover:border-amber-300 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                <Footprints className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                  <span>{t("Phone Step Counter")}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" strokeWidth={tokens.icons.strokeWidth} />
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {t(todayLog.steps.toLocaleString(localeTag()))} / {t((profile.stepGoal || 10000).toLocaleString(localeTag()))}{t(" steps (")}{t(stepPercent)}%)
                </span>
              </div>
            </div>

            <div className="text-end shrink-0">
              <span className="text-xs font-bold text-amber-600 block whitespace-nowrap">{t(stepBurn)}{t(" kcal")}</span>
              <span className="text-[10px] text-slate-400 block whitespace-nowrap">{t((todayLog.steps * 0.00078).toFixed(1))}{t(" km")}</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-300"
              style={{ width: `${stepPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-slate-500">
            <span className="text-[11px] min-w-0 flex-1 truncate">{t("Live pedometer & allowance")}</span>
            <span className="text-[11px] text-teal-700 font-semibold shrink-0 whitespace-nowrap">
              {t(profile.includeStepsInCalorieBudget ? 'Budget Active' : 'Deficit Only')}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Vitamins & Daily Supplements Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Pill className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <div className="text-xs font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                  <span>{t("Vitamins & Supplements")}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono shrink-0 whitespace-nowrap">
                    {(todayLog.supplements || []).length} {t("taken")}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block truncate">
                  {profile.supplementSchedule?.enabled !== false
                    ? t("Reminders Active")
                    : t("Tap to log and configure reminder checks")}
                </span>
              </div>
            </div>

            {/* Mobile-only micro toggle chevron */}
            <button
              type="button"
              onClick={() => setShowMicros(!showMicros)}
              className="sm:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors shrink-0"
              title={showMicros ? t("Hide Micronutrients") : t("Show Micronutrients")}
            >
              {showMicros ? (
                <ChevronUp className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              ) : (
                <ChevronDown className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100/80">
            {onOpenSupplementTracker && (
              <button
                type="button"
                id="btn-daily-supplement-tracker"
                onClick={() => {
                  onOpenSupplementTracker();
                }}
                className="w-full sm:w-auto px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-indigo-200 transition-all shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" strokeWidth={tokens.icons.strokeWidth} />
                <span>{t("Log / Schedule")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowMicros(!showMicros)}
              className="hidden sm:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors shrink-0"
              title={showMicros ? t("Hide Micronutrients") : t("Show Micronutrients")}
            >
              {showMicros ? (
                <ChevronUp className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              ) : (
                <ChevronDown className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              )}
            </button>
          </div>
        </div>

        {/* Recently Logged Supplements Pills */}
        {(todayLog.supplements || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(todayLog.supplements || []).map((s) => (
              <span
                key={s.id}
                className="text-[11px] font-medium px-2 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1"
              >
                <span>{s.icon || '💊'}</span>
                <span>{t(s.name)}</span>
              </span>
            ))}
          </div>
        )}

        {/* Optional Collapsible RDA Micronutrients Breakdown */}
        {showMicros && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
            <div className="text-[11px] font-bold text-slate-600">
              {t("Estimated Micronutrient Intake vs Recommended Daily Allowance (RDA)")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { name: 'Vitamin A', current: totalMicros.vitaminA, target: 900, unit: 'mcg', color: 'bg-amber-500' },
                { name: 'Vitamin C', current: totalMicros.vitaminC, target: 90, unit: 'mg', color: 'bg-orange-500' },
                { name: 'Vitamin D', current: totalMicros.vitaminD, target: 20, unit: 'mcg', color: 'bg-yellow-500' },
                { name: 'Vitamin B12', current: totalMicros.vitaminB12, target: 2.4, unit: 'mcg', color: 'bg-rose-500' },
                { name: 'Calcium', current: totalMicros.calcium, target: 1000, unit: 'mg', color: 'bg-sky-500' },
                { name: 'Iron', current: totalMicros.iron, target: 18, unit: 'mg', color: 'bg-red-500' },
                { name: 'Potassium', current: totalMicros.potassium, target: 3400, unit: 'mg', color: 'bg-emerald-500' },
                { name: 'Magnesium', current: totalMicros.magnesium, target: 400, unit: 'mg', color: 'bg-indigo-500' },
                { name: 'Zinc', current: totalMicros.zinc, target: 11, unit: 'mg', color: 'bg-teal-500' },
              ].map(m => {
                const pct = Math.min(100, Math.round((m.current / m.target) * 100));
                return (
                  <div key={m.name} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                      <span className="text-slate-700">{t(m.name)}</span>
                      <span className="font-mono text-slate-500">{m.current} / {m.target} {m.unit}</span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono text-end mt-0.5">{pct}% RDA</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards: Meals & Workouts on Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Meals Summary Card */}
        <div
          onClick={() => setActiveTab?.('meals')}
          className="bg-white border border-slate-200/80 hover:border-teal-300 rounded-3xl p-5 shadow-sm space-y-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform">
                <Utensils className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                  <span>{t("Today's Meals")}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" strokeWidth={tokens.icons.strokeWidth} />
                </span>
                <span className="text-[11px] text-slate-500 whitespace-nowrap">
                  {allMeals.length} {t("items logged today")}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-700 font-mono whitespace-nowrap">
              {t(consumedCalories)} {t("kcal")}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[11px] whitespace-nowrap">{t("Breakfast, Lunch, Dinner, Snack")}</span>
            <span className="text-[11px] font-bold text-teal-700 whitespace-nowrap">{t("Open Meals")} →</span>
          </div>
        </div>

        {/* Workouts Summary Card */}
        <div
          onClick={() => setActiveTab?.('workouts')}
          className="bg-white border border-slate-200/80 hover:border-rose-300 rounded-3xl p-5 shadow-sm space-y-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                  <span>{t("Today's Workouts")}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" strokeWidth={tokens.icons.strokeWidth} />
                </span>
                <span className="text-[11px] text-slate-500 whitespace-nowrap">
                  {todayLog.workouts.length} {t("sessions recorded")}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600 font-mono whitespace-nowrap">
              +{t(workoutBurn)} {t("kcal")}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[11px] whitespace-nowrap">{t("Resistance & Cardio")}</span>
            <span className="text-[11px] font-bold text-rose-700 whitespace-nowrap">{t("Open Workouts")} →</span>
          </div>
        </div>
      </div>
    </div>
  );
};
