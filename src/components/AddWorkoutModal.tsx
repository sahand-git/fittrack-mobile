/* localized-render */
import { t, useLocale, localeTag, matchesLocalized } from "../utils/locale";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Dumbbell,
  Flame,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  ShieldCheck,
  Search,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFitness } from '../context/FitnessContext';
import { ExerciseCategory, ExerciseSet } from '../types';
import { EXERCISE_DATABASE, estimateWorkoutCalories, ExercisePreset } from '../data/exerciseDatabase';

interface AddWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReferences?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const AddWorkoutModal: React.FC<AddWorkoutModalProps> = ({
  isOpen,
  onClose,
  onOpenReferences
}) => {
  useLocale();
  const { profile, addWorkout } = useFitness();

  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('strength');
  const [selectedPreset, setSelectedPreset] = useState<ExercisePreset>(EXERCISE_DATABASE[0]);
  const [customWorkoutName, setCustomWorkoutName] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [customCaloriesBurned, setCustomCaloriesBurned] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sets for strength exercises
  const [sets, setSets] = useState<ExerciseSet[]>([
    { setNum: 1, weightKg: 60, reps: 10, completed: true },
    { setNum: 2, weightKg: 60, reps: 10, completed: true },
    { setNum: 3, weightKg: 60, reps: 8, completed: false }
  ]);

  const filteredPresets = EXERCISE_DATABASE.filter((e) => {
    const matchesCat = selectedCategory === e.category;
    const matchesSearch = matchesLocalized(searchQuery, e.name, e.description);
    return matchesCat && matchesSearch;
  });

  const calculatedBurn = estimateWorkoutCalories(
    selectedPreset.metValue,
    durationMinutes,
    profile.weightKg
  );

  const handleSelectPreset = (preset: ExercisePreset) => {
    setSelectedPreset(preset);
    setDurationMinutes(preset.defaultMinutes);
    setCustomCaloriesBurned('');
  };

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1] || { weightKg: 50, reps: 10 };
    setSets([
      ...sets,
      {
        setNum: sets.length + 1,
        weightKg: lastSet.weightKg,
        reps: lastSet.reps,
        completed: false
      }
    ]);
  };

  const handleRemoveSet = (index: number) => {
    const updated = sets.filter((_, i) => i !== index).map((s, i) => ({ ...s, setNum: i + 1 }));
    setSets(updated);
  };

  const handleUpdateSet = (index: number, field: keyof ExerciseSet, value: any) => {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  };

  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();

    const finalBurn = customCaloriesBurned
      ? parseInt(customCaloriesBurned) || calculatedBurn
      : calculatedBurn;

    addWorkout({
      name: customWorkoutName.trim() || selectedPreset.name,
      category: selectedCategory,
      durationMinutes: Math.max(1, durationMinutes),
      caloriesBurned: finalBurn,
      sets: selectedCategory === 'strength' ? sets : undefined
    });

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch (err) {}

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="add-workout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 p-4 sm:p-5 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex flex-wrap items-center gap-2">
                <span>{t("Log Workout & Exercise")}</span>
                <span className="text-[10px] font-semibold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">{t(" MET 2024 ")}</span>
              </h2>
              <p className="text-xs text-slate-400">{t("Strength sets & cardio expenditure tracking")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Close Workout Logger")}
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveWorkout} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 pb-1">
            {t((['strength', 'cardio', 'hiit', 'sports', 'flexibility'] as ExerciseCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  const first = EXERCISE_DATABASE.find((e) => e.category === cat);
                  if (first) setSelectedPreset(first);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t(cat)}
              </button>
            )))}
          </div>

          {/* Exercise Search & Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">{t("Select Activity Preset")}</label>
              <span className="text-[10px] text-slate-400">{t("MET: ")}{t(selectedPreset.metValue)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pe-1">
              {t(filteredPresets.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-start text-xs transition-all ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500 text-white font-bold'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate block">{t(preset.name)}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{t(" MET ")}{t(preset.metValue)} • {t(preset.defaultMinutes)}{t("m ")}</span>
                  </button>
                );
              }))}
            </div>
          </div>

          {/* Custom Exercise Title Optional */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t("Custom Activity Title (Optional)")}</label>
            <input
              type="text"
              value={customWorkoutName}
              onChange={(e) => setCustomWorkoutName(e.target.value)}
              placeholder={t(`Default: ${selectedPreset.name}`)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Duration & Calorie Estimation with Formula Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("Duration (Minutes)")}</label>
              <div className="relative">
                <Clock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="input-workout-duration"
                  type="number"
                  min={1}
                  max={360}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-full ps-9 pe-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>{t("Calories Burned")}</span>
                <span className="text-[10px] text-rose-400 font-mono">{t("Calculated")}</span>
              </label>
              <div className="relative">
                <Flame className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                <input
                  type="number"
                  value={customCaloriesBurned || calculatedBurn}
                  onChange={(e) => setCustomCaloriesBurned(e.target.value)}
                  className="w-full ps-9 pe-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Scientific Reference Box */}
          <div className="p-3 bg-slate-800/60 border border-slate-800 rounded-2xl space-y-1 text-[11px] text-slate-400">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1 text-rose-400">
                <BookOpen className="w-3 h-3" />{t(" 2024 Ainsworth Compendium of Physical Activities ")}</span>
              <span className="font-mono text-white">{t("MET ")}{t(selectedPreset.metValue)}</span>
            </div>
            <p className="text-[10px] text-slate-400">{t(" Formula: (")}{t(selectedPreset.metValue)}{t(" MET × 3.5 × ")}{t(profile.weightKg)}{t("kg ÷ 200) × ")}{t(durationMinutes)}{t(" min = ")}<strong>{t(calculatedBurn)}{t(" kcal")}</strong>.
            </p>
          </div>

          {/* Strength Sets Table if Strength */}
          {t(selectedCategory === 'strength' && (
            <div className="space-y-2.5 p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />{t(" Resistance Sets (Weight & Reps) ")}</span>
                <button
                  type="button"
                  onClick={handleAddSet}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("Add Set")}</span>
                </button>
              </div>

              <div className="space-y-2">
                {t(sets.map((set, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-bold text-slate-500">#{t(set.setNum)}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="0.5"
                          value={set.weightKg}
                          onChange={(e) => handleUpdateSet(index, 'weightKg', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-white text-xs font-bold focus:outline-none text-center"
                        />
                        <span className="text-[10px] text-slate-400">{t("kg")}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(index, 'reps', parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent text-white text-xs font-bold focus:outline-none text-center"
                        />
                        <span className="text-[10px] text-slate-400">{t("reps")}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(index)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )))}
              </div>
            </div>
          ))}

          <button
            id="btn-confirm-save-workout"
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t("Save Workout & Burn ")}{t(customCaloriesBurned || calculatedBurn)}{t(" kcal")}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
