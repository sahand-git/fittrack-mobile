/* localized-render */
import { t, useLocale, localeTag, matchesLocalized } from "../utils/locale";
import React from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { MealType } from '../types';

interface DailySummaryProps {
  onOpenBarcodeScanner: (meal: MealType) => void;
  onOpenFoodLog: (meal: MealType) => void;
  onOpenStepTracker: () => void;
  onOpenAICoach: () => void;
  onOpenAddWorkout: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  onOpenBarcodeScanner,
  onOpenFoodLog,
  onOpenStepTracker,
  onOpenAICoach,
  onOpenAddWorkout,
  activeTab,
  setActiveTab
}) => {
  useLocale();
  const { profile, todayLog, updateWater } = useFitness();

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

  // Active burns
  const workoutBurn = todayLog.workouts.reduce((acc, w) => acc + w.caloriesBurned, 0);
  const stepBurn = todayLog.stepCaloriesBurned || 0;
  const activeBurnToAdd = workoutBurn + (profile.includeStepsInCalorieBudget ? stepBurn : 0);

  // Dynamic remaining calories
  const dynamicBudget = profile.targetCalories + activeBurnToAdd;
  const remainingCalories = dynamicBudget - consumedCalories;

  const targetCal = profile.targetCalories || 2000;
  const calPercent = Math.min(100, Math.round((consumedCalories / dynamicBudget) * 100));

  const proteinTarget = profile.targetProtein || 150;
  const carbsTarget = profile.targetCarbs || 200;
  const fatTarget = profile.targetFat || 65;

  const waterPercent = Math.min(100, Math.round((todayLog.waterMl / (profile.waterGoalMl || 2500)) * 100));
  const stepPercent = Math.min(100, Math.round((todayLog.steps / (profile.stepGoal || 10000)) * 100));

  return (
    <div className="space-y-4">
      {/* 1. Main Caloric Gauge & Energy Matrix */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Backlight */}
        <div className="absolute top-0 end-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top Row: Daily Calorie Equation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">{t("Daily Calorie Target")}</span>
                {t(profile.includeStepsInCalorieBudget && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">{t(" + Step Burn Enabled ")}</span>
                ))}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {t(remainingCalories >= 0 ? remainingCalories.toLocaleString(localeTag()) : `+${Math.abs(remainingCalories).toLocaleString(localeTag())}`)}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {t(remainingCalories >= 0 ? 'kcal remaining' : 'kcal over target')}
                </span>
              </div>
            </div>

            {/* Quick Action Matrix Bar */}
            <div className="flex flex-wrap gap-2">
              <button
                id="btn-quick-scan-barcode"
                type="button"
                onClick={() => onOpenBarcodeScanner('lunch')}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
              >
                <Barcode className="w-4 h-4" />
                <span>{t("Scan Barcode")}</span>
              </button>

              <button
                id="btn-quick-ai-audit"
                type="button"
                onClick={onOpenAICoach}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("AI Coach Audit")}</span>
              </button>
            </div>
          </div>

          {/* Calorie Math Grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3.5 bg-slate-800/40 border border-slate-800/80 rounded-2xl text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t("Base Goal")}</span>
              <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">{t(targetCal)}</span>
              <span className="text-[9px] text-slate-500">{t("Mifflin-St Jeor")}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t("Food In")}</span>
              <span className="text-sm sm:text-base font-bold text-rose-400 mt-0.5 block">{t(consumedCalories)}</span>
              <span className="text-[9px] text-slate-500">{t(calPercent)}{t("% budget")}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t("Workout")}</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5 block">+{t(workoutBurn)}</span>
              <span className="text-[9px] text-slate-500">{t("active burn")}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t("Step Burn")}</span>
              <span className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 block">
                {t(profile.includeStepsInCalorieBudget ? `+${stepBurn}` : `${stepBurn}`)}
              </span>
              <span className="text-[9px] text-slate-500">{t(profile.includeStepsInCalorieBudget ? 'added' : 'tracked')}</span>
            </div>
          </div>

          {/* Calorie Progress Line */}
          <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, calPercent)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                consumedCalories > dynamicBudget
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400'
              }`}
            />
          </div>

          {/* 3 Major Macronutrient Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Protein */}
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">{t("Protein")}</span>
                <span className="font-bold text-white">
                  {t(consumedProtein)} <span className="text-slate-400 font-normal">/ {t(proteinTarget)}{t("g")}</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (consumedProtein / proteinTarget) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                {t(Math.round((consumedProtein / proteinTarget) * 100))}{t("% of goal ")}</span>
            </div>

            {/* Carbs */}
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">{t("Carbohydrates")}</span>
                <span className="font-bold text-white">
                  {t(consumedCarbs)} <span className="text-slate-400 font-normal">/ {t(carbsTarget)}{t("g")}</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (consumedCarbs / carbsTarget) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                {t(Math.round((consumedCarbs / carbsTarget) * 100))}{t("% of goal ")}</span>
            </div>

            {/* Fats */}
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-400">{t("Fats")}</span>
                <span className="font-bold text-white">
                  {t(consumedFat)} <span className="text-slate-400 font-normal">/ {t(fatTarget)}{t("g")}</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (consumedFat / fatTarget) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                {t(Math.round((consumedFat / fatTarget) * 100))}{t("% of goal ")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hydration & Phone Steps Twin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hydration Tracker */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{t("Hydration")}</span>
                <span className="text-[11px] text-slate-400">
                  {t(todayLog.waterMl)} / {t(profile.waterGoalMl || 2500)}{t(" ml (")}{t(waterPercent)}%)
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-blue-400 font-mono">
              {t(Math.round(todayLog.waterMl / 250))}{t(" glasses ")}</span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${waterPercent}%` }}
            />
          </div>

          {/* Quick Water Increment Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-add-water-250"
              type="button"
              onClick={() => updateWater(250)}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3 text-blue-400" />
              <span>{t("250 ml")}</span>
            </button>

            <button
              id="btn-add-water-500"
              type="button"
              onClick={() => updateWater(500)}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3 text-blue-400" />
              <span>{t("500 ml")}</span>
            </button>

            <button
              id="btn-sub-water-250"
              type="button"
              onClick={() => updateWater(-250)}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-colors"
            >{t(" -250 ml ")}</button>
          </div>
        </div>

        {/* Step Counter Card with Direct Sensor Launch */}
        <div
          id="card-daily-steps"
          onClick={onOpenStepTracker}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 shadow-lg space-y-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                  <span>{t("Phone Step Counter")}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </span>
                <span className="text-[11px] text-slate-400">
                  {t(todayLog.steps.toLocaleString(localeTag()))} / {t((profile.stepGoal || 10000).toLocaleString(localeTag()))}{t(" steps (")}{t(stepPercent)}%)
                </span>
              </div>
            </div>

            <div className="text-end">
              <span className="text-xs font-bold text-amber-400 block">{t(stepBurn)}{t(" kcal")}</span>
              <span className="text-[10px] text-slate-500">{t((todayLog.steps * 0.00078).toFixed(1))}{t(" km")}</span>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-300"
              style={{ width: `${stepPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px]">{t(" Tap to open live pedometer & adjust allowance ")}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">
              {t(profile.includeStepsInCalorieBudget ? 'Budget Active' : 'Deficit Only')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
