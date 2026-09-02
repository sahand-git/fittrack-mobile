import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Flame,
  Activity,
  Target,
  User,
  Scale,
  Ruler,
  Footprints,
  Mail,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Zap
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { UserProfile, Gender, ActivityLevel, FitnessGoal } from '../types';
import {
  calculateTargets,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  kgToLbs,
  lbsToKg,
  cmToFtIn,
  ftInToCm
} from '../utils/calculator';

interface OnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen = true, onClose }) => {
  const { profile, completeOnboarding } = useFitness();

  const [step, setStep] = useState<number>(1);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Form states
  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState<number>(profile.name ? profile.age : 0);

  // Height / Weight
  const [heightCm, setHeightCm] = useState<number>(profile.name ? profile.heightCm : 0);
  const [weightKg, setWeightKg] = useState<number>(profile.name ? profile.weightKg : 0);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(profile.name ? profile.targetWeightKg : 0);

  // Imperial helper states
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(9);
  const [weightLbs, setWeightLbs] = useState<number>(165);
  const [targetWeightLbs, setTargetWeightLbs] = useState<number>(154);

  // Lifestyle & Goals
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [includeStepsInCalorieBudget, setIncludeStepsInCalorieBudget] = useState<boolean>(profile.includeStepsInCalorieBudget);
  const [stepGoal, setStepGoal] = useState<number>(profile.stepGoal);
  const [waterGoalMl, setWaterGoalMl] = useState<number>(profile.waterGoalMl);

  // Real-time calculation
  const calculated = calculateTargets(gender, weightKg, heightCm, age, activityLevel, goal);

  const handleUnitSystemChange = (system: 'metric' | 'imperial') => {
    setUnitSystem(system);
    if (system === 'imperial') {
      const { ft, in: inch } = cmToFtIn(heightCm);
      setHeightFt(ft);
      setHeightIn(inch);
      setWeightLbs(kgToLbs(weightKg));
      setTargetWeightLbs(kgToLbs(targetWeightKg));
    } else {
      setHeightCm(ftInToCm(heightFt, heightIn));
      setWeightKg(lbsToKg(weightLbs));
      setTargetWeightKg(lbsToKg(targetWeightLbs));
    }
  };

  const handleHeightFtInChange = (ft: number, inch: number) => {
    setHeightFt(ft);
    setHeightIn(inch);
    setHeightCm(ftInToCm(ft, inch));
  };

  const handleWeightLbsChange = (lbs: number) => {
    setWeightLbs(lbs);
    setWeightKg(lbsToKg(lbs));
  };

  const handleTargetWeightLbsChange = (lbs: number) => {
    setTargetWeightLbs(lbs);
    setTargetWeightKg(lbsToKg(lbs));
  };

  const validateStep = (page: number): string | null => {
    if (page === 1) {
      if (!name.trim()) return 'Please enter your name or nickname.';
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email or leave it blank.';
      if (!Number.isInteger(age) || age < 12 || age > 100) return 'Enter an age between 12 and 100.';
    }
    if (page === 2) {
      if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) return 'Enter a height between 100 and 250 cm (or the equivalent in feet and inches).';
      if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300) return 'Enter a weight between 30 and 300 kg (or the equivalent in pounds).';
      if (!Number.isFinite(targetWeightKg) || targetWeightKg < 30 || targetWeightKg > 300) return 'Enter a target weight between 30 and 300 kg (or the equivalent in pounds).';
    }
    return null;
  };

  const handleNextStep = () => {
    const error = validateStep(step);
    setErrorMessage(error);
    if (!error) setStep(step + 1);
  };

  const handleFinish = () => {
    for (const page of [1, 2]) {
      const error = validateStep(page);
      if (error) {
        setStep(page);
        setErrorMessage(error);
        return;
      }
    }

    const finalProfile: UserProfile = {
      ...profile,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      isGoogleConnected: false,
      gender,
      age: Math.max(12, age),
      heightCm: Math.max(100, heightCm),
      weightKg: Math.max(30, weightKg),
      targetWeightKg: Math.max(30, targetWeightKg),
      activityLevel,
      goal,
      includeStepsInCalorieBudget,
      stepGoal: Math.max(1000, stepGoal),
      waterGoalMl: Math.max(1000, waterGoalMl),
      bmr: calculated.bmr,
      tdee: calculated.tdee,
      targetCalories: calculated.targetCalories,
      targetProtein: calculated.targetProtein,
      targetCarbs: calculated.targetCarbs,
      targetFat: calculated.targetFat,
      profileCompleted: true
    };

    completeOnboarding(finalProfile);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[88dvh] flex flex-col"
      >
        {/* Header with Progress Steps */}
        <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-cyan-900/40 p-5 sm:p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 id="onboarding-title" className="text-lg font-bold text-white tracking-tight">Set up your profile</h2>
                <p className="text-xs text-slate-400">Your details help estimate daily nutrition targets.</p>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-emerald-400">
              Step {step} of 4
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Body */}
        <div className="min-h-0 p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && <p role="alert" className="p-3 rounded-xl bg-rose-500/15 text-rose-300 text-sm">{errorMessage}</p>}
          <AnimatePresence mode="wait">
            {/* STEP 1: Basic Identity & Gmail Connection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 mb-6">
                  <h3 className="text-lg font-semibold text-white">Let's set up your profile</h3>
                  <p className="text-sm text-slate-400">
                    {profile.name ? 'Please confirm your saved details once for this updated setup. Your existing logs will be kept.' : 'Enter your details to personalize your targets. Setup is saved on this device; no account is required.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Your Full Name or Nickname <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="input-user-name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="e.g. Alex"
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Email (optional)</span>
                      <span className="text-xs text-slate-400 font-normal">Does not connect a health app</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="input-user-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="e.g. yourname@gmail.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Gender Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">Biological Sex (for BMR Calculation)</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['male', 'female', 'other'] as Gender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium capitalize transition-all ${
                            gender === g
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                              : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '🧑 Other'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Age</label>
                    <input
                      id="input-user-age"
                      type="number"
                      min={12}
                      max={100}
                      value={age || ''}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Height, Weight & Metric/Imperial */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Body Measurements</h3>
                    <p className="text-xs text-slate-400">Used for Mifflin-St Jeor formula</p>
                  </div>
                  {/* Unit Toggle */}
                  <div className="flex bg-slate-800 border border-slate-700 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleUnitSystemChange('metric')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        unitSystem === 'metric' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Metric (kg/cm)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnitSystemChange('imperial')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        unitSystem === 'imperial' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Imperial (lbs/ft)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Height */}
                  <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Ruler className="w-4 h-4 text-cyan-400" />
                      Height
                    </label>
                    {unitSystem === 'metric' ? (
                      <div className="flex items-center gap-2">
                        <input
                          id="input-height-cm"
                          type="number"
                          min={100}
                          max={250}
                          value={heightCm || ''}
                          onChange={(e) => setHeightCm(Number(e.target.value))}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-slate-400">cm</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={3}
                            max={7}
                            value={heightFt}
                            onChange={(e) => handleHeightFtInChange(parseInt(e.target.value) || 5, heightIn)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                          />
                          <span className="text-xs text-slate-400">ft</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={11}
                            value={heightIn}
                            onChange={(e) => handleHeightFtInChange(heightFt, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                          />
                          <span className="text-xs text-slate-400">in</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Weight */}
                  <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-emerald-400" />
                      Current Weight
                    </label>
                    {unitSystem === 'metric' ? (
                      <div className="flex items-center gap-2">
                        <input
                          id="input-weight-kg"
                          type="number"
                          step="0.1"
                          min={30}
                          max={300}
                          value={weightKg || ''}
                          onChange={(e) => setWeightKg(Number(e.target.value))}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-slate-400">kg</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min={66}
                          max={600}
                          value={weightLbs}
                          onChange={(e) => handleWeightLbsChange(parseFloat(e.target.value) || 150)}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                        />
                        <span className="text-xs font-semibold text-slate-400">lbs</span>
                      </div>
                    )}
                  </div>

                  {/* Target Weight */}
                  <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 space-y-2 md:col-span-2">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-amber-400" />
                      Goal Target Weight
                    </label>
                    {unitSystem === 'metric' ? (
                      <div className="flex items-center gap-2">
                        <input
                          id="input-target-weight-kg"
                          type="number"
                          step="0.1"
                          min={30}
                          max={300}
                          value={targetWeightKg || ''}
                          onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-slate-400">kg</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min={66}
                          max={600}
                          value={targetWeightLbs}
                          onChange={(e) => handleTargetWeightLbsChange(parseFloat(e.target.value) || 150)}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                        />
                        <span className="text-xs font-semibold text-slate-400">lbs</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Activity Level, Goals & Step Calorie Toggle */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">Daily Activity & Goal</h3>
                  <p className="text-xs text-slate-400">Adjusts your Total Daily Energy Expenditure (TDEE)</p>
                </div>

                {/* Activity Level */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Activity Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((key) => {
                      const item = ACTIVITY_MULTIPLIERS[key];
                      const isSelected = activityLevel === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActivityLevel(key)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                              : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                            <span>{item.label}</span>
                            <span className="text-[10px] text-emerald-400 font-mono">x{item.multiplier}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fitness Goal */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Fitness Objective</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(Object.keys(GOAL_ADJUSTMENTS) as FitnessGoal[]).map((key) => {
                      const item = GOAL_ADJUSTMENTS[key];
                      const isSelected = goal === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setGoal(key)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-sm'
                              : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                            <span>{item.label}</span>
                            <span className={`text-[10px] font-mono ${item.calorieDelta < 0 ? 'text-amber-400' : item.calorieDelta > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {item.calorieDelta > 0 ? `+${item.calorieDelta}` : item.calorieDelta} kcal
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CRITICAL USER REQUIREMENT: Step Calories in Calorie Allowance Toggle */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800/70 to-slate-800/30 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Footprints className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>Add Step Burn to Daily Calorie Budget?</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {includeStepsInCalorieBudget
                            ? 'Calories burned from phone steps will expand your eating allowance'
                            : 'Eating allowance stays fixed; step calories are logged as extra bonus deficit'}
                        </div>
                      </div>
                    </div>

                    <button
                      id="toggle-steps-calorie-budget"
                      type="button"
                      onClick={() => setIncludeStepsInCalorieBudget(!includeStepsInCalorieBudget)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                </div>
              </motion.div>
            )}

            {/* STEP 4: Calculated Results & Scientific Overview */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Mifflin-St Jeor Calculation Complete
                  </span>
                  <h3 className="text-xl font-bold text-white pt-1">Your Customized Daily Blueprint</h3>
                </div>

                {/* Energy Numbers Card */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl text-center">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">BMR (Basal)</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">{calculated.bmr}</span>
                    <span className="text-[10px] text-slate-500">kcal at rest</span>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl text-center">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">TDEE (Burn)</span>
                    <span className="text-lg font-extrabold text-cyan-400 mt-1 block">{calculated.tdee}</span>
                    <span className="text-[10px] text-slate-500">daily burn</span>
                  </div>

                  <div className="bg-gradient-to-b from-emerald-500/20 to-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-2xl text-center shadow-lg shadow-emerald-950/50">
                    <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold block">Target Calorie</span>
                    <span className="text-xl font-black text-emerald-400 mt-1 block">{calculated.targetCalories}</span>
                    <span className="text-[10px] text-emerald-300/70">kcal / day</span>
                  </div>
                </div>

                {/* Target Macronutrients */}
                <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <span className="text-xs font-semibold text-slate-300 block">Optimal Macro Targets</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                      <span className="text-xs text-rose-400 font-semibold block">Protein</span>
                      <span className="text-base font-bold text-white mt-0.5 block">{calculated.targetProtein}g</span>
                      <span className="text-[10px] text-slate-400 font-mono">{(calculated.targetProtein * 4)} kcal</span>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                      <span className="text-xs text-amber-400 font-semibold block">Carbs</span>
                      <span className="text-base font-bold text-white mt-0.5 block">{calculated.targetCarbs}g</span>
                      <span className="text-[10px] text-slate-400 font-mono">{(calculated.targetCarbs * 4)} kcal</span>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                      <span className="text-xs text-blue-400 font-semibold block">Healthy Fats</span>
                      <span className="text-base font-bold text-white mt-0.5 block">{calculated.targetFat}g</span>
                      <span className="text-[10px] text-slate-400 font-mono">{(calculated.targetFat * 9)} kcal</span>
                    </div>
                  </div>
                </div>

                {/* Settings review */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Step calorie integration: <strong className="text-emerald-400">{includeStepsInCalorieBudget ? 'Enabled' : 'Disabled'}</strong></span>
                  <span>Daily step goal: <strong className="text-white">{stepGoal.toLocaleString()} steps</strong></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Navigation Buttons */}
        <div className="shrink-0 p-4 sm:p-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              id="button-onboarding-next"
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="button-onboarding-finish"
              type="button"
              onClick={handleFinish}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-sm font-black flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/30 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Start Tracking</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
