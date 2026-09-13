import { GeminiSetup } from './GeminiSetup';
/* localized-render */
import { t, useLocale, localeTag } from "../utils/locale";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  X,
  Target,
  Scale,
  Ruler,
  Footprints,
  Droplets,
  Flame,
  CheckCircle2,
  Sparkles,
  Info,
  LogOut,
  Mail,
  ShieldCheck,
  Activity,
  Heart,
  Bell
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { useAuth } from '../context/AuthContext';
import { Gender, ActivityLevel, FitnessGoal } from '../types';
import {
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  calculateTargets
} from '../utils/calculator';
import { tokens } from '../theme/tokens';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReminders?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onOpenReminders }) => {
  useLocale();
  const auth = useAuth();
  const [signOutError, setSignOutError] = useState('');
  const { profile, updateProfile, isPremium } = useFitness();

  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState<number>(profile.age);
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(profile.targetWeightKg || profile.weightKg);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [includeStepsInCalorieBudget, setIncludeStepsInCalorieBudget] = useState<boolean>(
    profile.includeStepsInCalorieBudget
  );
  const [stepGoal, setStepGoal] = useState<number>(profile.stepGoal || 10000);
  const [waterGoalMl, setWaterGoalMl] = useState<number>(profile.waterGoalMl || 2500);

  React.useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setEmail(profile.email);
      setGender(profile.gender);
      setAge(profile.age);
      setHeightCm(profile.heightCm);
      setWeightKg(profile.weightKg);
      setTargetWeightKg(profile.targetWeightKg || profile.weightKg);
      setActivityLevel(profile.activityLevel);
      setGoal(profile.goal);
      setIncludeStepsInCalorieBudget(profile.includeStepsInCalorieBudget);
      setStepGoal(profile.stepGoal || 10000);
      setWaterGoalMl(profile.waterGoalMl || 2500);
      setSignOutError('');
    }
  }, [isOpen, profile]);

  const preview = calculateTargets(gender, weightKg, heightCm, age, activityLevel, goal);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'Champion',
      email: email.trim(),
      gender,
      age: Math.max(12, age),
      heightCm: Math.max(100, heightCm),
      weightKg: Math.max(30, weightKg),
      targetWeightKg: Math.max(30, targetWeightKg),
      activityLevel,
      goal,
      includeStepsInCalorieBudget,
      stepGoal: Math.max(1000, stepGoal),
      waterGoalMl: Math.max(1000, waterGoalMl)
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0 shadow-xs">
              <User className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{t("Profile & Biometrics")}</span>
                {isPremium && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-600 text-white shadow-xs shrink-0 whitespace-nowrap">
                    PRO
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium">{t("Mifflin-St Jeor TDEE & macro targets")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Close Profile")}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Account Status Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-bold text-slate-900 truncate">
                  {auth.user ? auth.user.email : t("Local Guest Device Mode")}
                </span>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 underline ml-2 shrink-0 cursor-pointer"
                onClick={async () => {
                  try {
                    await auth.logout();
                  } catch {
                    setSignOutError('Could not sign out. Try again.');
                  }
                }}
              >
                {t(auth.user ? 'Sign out' : 'Go to sign in')}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {t("Signing out keeps your fitness records on this device.")}
            </p>
            {signOutError && <p role="alert" className="text-xs text-rose-600 font-semibold">{t(signOutError)}</p>}
          </div>

          {/* Section: Personal Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Personal Identity")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("Full Name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("Biological Sex (for BMR)")}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all capitalize"
                >
                  <option value="male">{t("Male")}</option>
                  <option value="female">{t("Female")}</option>
                  <option value="other">{t("Other / Non-binary")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Body Biometrics (Age, Height, Current Weight, Target Weight) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Body Biometrics")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("Age")}</label>
                <input
                  type="number"
                  min={12}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 25)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("Height (cm)")}</label>
                <input
                  type="number"
                  min={100}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 175)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("Current (kg)")}</label>
                <input
                  type="number"
                  step="0.1"
                  min={30}
                  max={300}
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 75)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("Target (kg)")}</label>
                <input
                  type="number"
                  step="0.1"
                  min={30}
                  max={300}
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 70)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-center"
                />
              </div>
            </div>
          </div>

          {/* Section: Daily Targets & Goals */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Fitness Goals & Activity")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("Activity Level")}</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                >
                  {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((k) => (
                    <option key={k} value={k}>
                      {t(ACTIVITY_MULTIPLIERS[k].label)} (x{ACTIVITY_MULTIPLIERS[k].multiplier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t("Primary Objective")}</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as FitnessGoal)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                >
                  {(Object.keys(GOAL_ADJUSTMENTS) as FitnessGoal[]).map((k) => (
                    <option key={k} value={k}>
                      {t(GOAL_ADJUSTMENTS[k].label)} ({GOAL_ADJUSTMENTS[k].calorieDelta >= 0 ? '+' : ''}{GOAL_ADJUSTMENTS[k].calorieDelta} kcal)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t("Daily Step Target")}</span>
                </label>
                <input
                  type="number"
                  step="500"
                  min="1000"
                  max="50000"
                  value={stepGoal}
                  onChange={(e) => setStepGoal(parseInt(e.target.value, 10) || 10000)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{t("Daily Water Goal (ml)")}</span>
                </label>
                <input
                  type="number"
                  step="250"
                  min="500"
                  max="10000"
                  value={waterGoalMl}
                  onChange={(e) => setWaterGoalMl(parseInt(e.target.value, 10) || 2500)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Step Calorie Integration Toggle */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between gap-3 shadow-xs text-start">
            <div className="space-y-0.5 text-start min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 block">{t("Include Step Burn in Eating Budget")}</span>
              <p className="text-[11px] text-slate-500 font-medium">
                {t("When enabled, phone step calories expand your remaining daily eating allowance.")}
              </p>
            </div>
            <div dir="ltr" className="inline-flex shrink-0 ms-3">
              <button
                id="toggle-steps-profile"
                type="button"
                onClick={() => setIncludeStepsInCalorieBudget(!includeStepsInCalorieBudget)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  includeStepsInCalorieBudget ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeStepsInCalorieBudget ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <GeminiSetup />

          {/* Notifications & Reminders Link Card */}
          {onOpenReminders && (
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 text-start">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-start">
                  <span className="text-xs font-bold text-slate-900 block truncate">{t("Push Notifications & Reminders")}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{t("Water, vitamins & meals schedule")}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReminders();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer"
              >
                {t("Configure")}
              </button>
            </div>
          )}

          {/* Calculated Output Matrix */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
              <span>{t("Calculated Calorie & Macro Target")}</span>
            </span>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 shadow-xs">
                <span className="text-[10px] text-slate-500 font-semibold block">{t("Daily Target")}</span>
                <span className="text-sm font-extrabold text-teal-700 mt-0.5 block">{preview.targetCalories}</span>
                <span className="text-[9px] text-slate-400">{t("kcal")}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 shadow-xs">
                <span className="text-[10px] text-teal-700 font-semibold block">{t("Protein")}</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{preview.targetProtein}g</span>
                <span className="text-[9px] text-slate-400">{t("macros")}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 shadow-xs">
                <span className="text-[10px] text-amber-700 font-semibold block">{t("Carbs")}</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{preview.targetCarbs}g</span>
                <span className="text-[9px] text-slate-400">{t("macros")}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 shadow-xs">
                <span className="text-[10px] text-rose-700 font-semibold block">{t("Fats")}</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{preview.targetFat}g</span>
                <span className="text-[9px] text-slate-400">{t("macros")}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-save-profile"
            type="submit"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
            <span>{t("Save & Apply Target Changes")}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
