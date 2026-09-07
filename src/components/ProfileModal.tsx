/* localized-render */
import { t, useLocale, localeTag, matchesLocalized } from "../utils/locale";
import React, { useEffect, useState } from 'react';
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
import { NotificationSchedulePanel } from './NotificationSchedulePanel';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: 'profile' | 'notifications';
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, initialSection = 'profile' }) => {
  useLocale();
  const auth = useAuth();
  const [signOutError, setSignOutError] = useState('');
  const [section, setSection] = useState<'profile' | 'notifications'>(initialSection);
  const { profile, updateProfile } = useFitness();

  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState<number>(profile.age);
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(profile.targetWeightKg);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [includeStepsInCalorieBudget, setIncludeStepsInCalorieBudget] = useState<boolean>(
    profile.includeStepsInCalorieBudget
  );
  const [stepGoal, setStepGoal] = useState<number>(profile.stepGoal);
  const [waterGoalMl, setWaterGoalMl] = useState<number>(profile.waterGoalMl);

  useEffect(() => { if (isOpen) setSection(initialSection); }, [initialSection, isOpen]);

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
      className="fixed inset-0 z-50 app-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="app-modal w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="app-modal-header items-center">
          <div className="flex items-center gap-3">
            <div className="app-icon-tile">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t("Settings")}</h2>
              <p className="text-xs text-slate-400">{t("Profile, goals, and notification schedule")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Close Profile")}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="app-tab-list mx-4 sm:mx-5 mt-4" role="tablist" aria-label={t('Settings section')}>
          <button type="button" role="tab" aria-selected={section === 'profile'} onClick={() => setSection('profile')} className={`app-tab ${section === 'profile' ? 'app-tab-active' : ''}`}><User className="w-4 h-4" />{t('Profile')}</button>
          <button type="button" role="tab" aria-selected={section === 'notifications'} onClick={() => setSection('notifications')} className={`app-tab ${section === 'notifications' ? 'app-tab-active' : ''}`}><Bell className="w-4 h-4" />{t('Notifications & Schedule')}</button>
        </div>

        {section === 'profile' && <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div className="p-3 rounded-xl bg-slate-800 text-xs space-y-2">
            <p className="text-slate-300 break-words">{t(auth.user ? `Signed in as ${auth.user.email}` : 'Using this device without an account')}</p>
            <button type="button" className="text-cyan-300 underline" onClick={async()=>{try{await auth.logout();}catch{setSignOutError('Could not sign out. Try again.');}}}>{t(auth.user ? 'Sign out' : 'Go to sign in')}</button>
            <p className="text-slate-400">{t("Signing out keeps your fitness records on this device.")}</p>
            {t(signOutError && <p role="alert" className="text-rose-300">{t(signOutError)}</p>)}
          </div>
          {/* Identity & Biological Sex */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("Full Name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("Biological Sex (for BMR)")}</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none capitalize"
              >
                <option value="male">{t("Male")}</option>
                <option value="female">{t("Female")}</option>
                <option value="other">{t("Other / Non-binary")}</option>
              </select>
            </div>
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("Age")}</label>
              <input
                type="number"
                min={12}
                max={100}
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("Height (cm)")}</label>
              <input
                type="number"
                min={100}
                max={250}
                value={heightCm}
                onChange={(e) => setHeightCm(parseInt(e.target.value) || 175)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("Weight (kg)")}</label>
              <input
                type="number"
                step="0.1"
                min={30}
                max={300}
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 75)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold"
              />
            </div>
          </div>

          {/* Goal & Activity Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("Activity Level")}</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              >
                {t((Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((k) => (
                  <option key={k} value={k}>
                    {t(ACTIVITY_MULTIPLIERS[k].label)}{t(" (x")}{t(ACTIVITY_MULTIPLIERS[k].multiplier)})
                  </option>
                )))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("Primary Objective")}</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as FitnessGoal)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              >
                {t((Object.keys(GOAL_ADJUSTMENTS) as FitnessGoal[]).map((k) => (
                  <option key={k} value={k}>
                    {t(GOAL_ADJUSTMENTS[k].label)} ({t(GOAL_ADJUSTMENTS[k].calorieDelta >= 0 ? '+' : '')}{t(GOAL_ADJUSTMENTS[k].calorieDelta)}{t(" kcal) ")}</option>
                )))}
              </select>
            </div>
          </div>

          {/* Step Calorie Integration Toggle */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">{t("Include Step Burn in Eating Budget")}</span>
              <p className="text-[11px] text-slate-400">{t(" When enabled, phone step calories expand your remaining daily eating allowance. ")}</p>
            </div>
            <button
              id="toggle-steps-profile"
              type="button"
              onClick={() => setIncludeStepsInCalorieBudget(!includeStepsInCalorieBudget)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                includeStepsInCalorieBudget ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  includeStepsInCalorieBudget ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Calculated Output Matrix */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />{t(" Calculated Calorie & Macro Target ")}</span>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-slate-400 block">{t("Daily Target")}</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">{t(preview.targetCalories)}</span>
                <span className="text-[9px] text-slate-500">{t("kcal")}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-rose-400 block">{t("Protein")}</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">{t(preview.targetProtein)}{t("g")}</span>
                <span className="text-[9px] text-slate-500">{t("macros")}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-amber-400 block">{t("Carbs")}</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">{t(preview.targetCarbs)}{t("g")}</span>
                <span className="text-[9px] text-slate-500">{t("macros")}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-blue-400 block">{t("Fats")}</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">{t(preview.targetFat)}{t("g")}</span>
                <span className="text-[9px] text-slate-500">{t("macros")}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-save-profile"
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t("Save & Apply Target Changes")}</span>
          </button>
        </form>}
        {section === 'notifications' && <div className="p-4 sm:p-5 overflow-y-auto flex-1"><NotificationSchedulePanel /></div>}
      </motion.div>
    </div>
  );
};
