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
  Mail
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { Gender, ActivityLevel, FitnessGoal } from '../types';
import {
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  calculateTargets
} from '../utils/calculator';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, resetAccountAndData } = useFitness();

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

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

  const handleLogout = () => {
    resetAccountAndData();
    setShowLogoutConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Profile & Biometrics</h2>
              <p className="text-xs text-slate-400">Mifflin-St Jeor TDEE & macro targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Profile"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Identity & Biological Sex */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Biological Sex (for BMR)</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none capitalize"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Non-binary</option>
              </select>
            </div>
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Age</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Height (cm)</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Weight (kg)</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              >
                {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((k) => (
                  <option key={k} value={k}>
                    {ACTIVITY_MULTIPLIERS[k].label} (x{ACTIVITY_MULTIPLIERS[k].multiplier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Objective</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as FitnessGoal)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              >
                {(Object.keys(GOAL_ADJUSTMENTS) as FitnessGoal[]).map((k) => (
                  <option key={k} value={k}>
                    {GOAL_ADJUSTMENTS[k].label} ({GOAL_ADJUSTMENTS[k].calorieDelta >= 0 ? '+' : ''}{GOAL_ADJUSTMENTS[k].calorieDelta} kcal)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step Calorie Integration Toggle */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Include Step Burn in Eating Budget</span>
              <p className="text-[11px] text-slate-400">
                When enabled, phone step calories expand your remaining daily eating allowance.
              </p>
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
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Calculated Calorie & Macro Target
            </span>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Daily Target</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">{preview.targetCalories}</span>
                <span className="text-[9px] text-slate-500">kcal</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-rose-400 block">Protein</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">{preview.targetProtein}g</span>
                <span className="text-[9px] text-slate-500">macros</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-amber-400 block">Carbs</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">{preview.targetCarbs}g</span>
                <span className="text-[9px] text-slate-500">macros</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-blue-400 block">Fats</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">{preview.targetFat}g</span>
                <span className="text-[9px] text-slate-500">macros</span>
              </div>
            </div>
          </div>

          <button
            id="btn-save-profile"
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Apply Target Changes</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
