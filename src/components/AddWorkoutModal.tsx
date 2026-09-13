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
  Clock,
  Activity,
  BookOpen,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFitness } from '../context/FitnessContext';
import { ExerciseCategory, ExerciseSet } from '../types';
import { EXERCISE_DATABASE, estimateWorkoutCalories, ExercisePreset } from '../data/exerciseDatabase';
import { formatDateDisplay, isDateFuture } from '../utils/date';

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
  const { profile, currentDate, addWorkout } = useFitness();

  const isFuture = isDateFuture(currentDate);

  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('strength');
  const [selectedPreset, setSelectedPreset] = useState<ExercisePreset>(EXERCISE_DATABASE[0]);
  const [customWorkoutName, setCustomWorkoutName] = useState<string>('');
  const [durationInput, setDurationInput] = useState<string>('45');
  const [customCaloriesBurned, setCustomCaloriesBurned] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const durationMinutesNum = parseInt(durationInput, 10) || 0;

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
    durationMinutesNum,
    profile.weightKg
  );

  const handleSelectPreset = (preset: ExercisePreset) => {
    setSelectedPreset(preset);
    setDurationInput(String(preset.defaultMinutes));
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
    if (isFuture) return;

    const finalBurn = customCaloriesBurned
      ? parseInt(customCaloriesBurned) || calculatedBurn
      : calculatedBurn;

    const parsedMinutes = parseInt(durationInput, 10) || selectedPreset.defaultMinutes || 30;

    addWorkout({
      name: customWorkoutName.trim() || selectedPreset.name,
      category: selectedCategory,
      durationMinutes: Math.max(1, parsedMinutes),
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{t("Log Workout & Exercise")}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium shrink-0 whitespace-nowrap">
                  📅 {formatDateDisplay(currentDate)}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">{t("Strength sets & cardio expenditure tracking")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Close Workout Logger")}
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Future Date Lock Alert */}
        {isFuture && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">
              {t("Cannot record workouts for future dates. Please navigate to today or a past date to record your exercise.")}
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSaveWorkout} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 pb-1">
            {(['strength', 'cardio', 'hiit', 'sports', 'flexibility'] as ExerciseCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  const first = EXERCISE_DATABASE.find((e) => e.category === cat);
                  if (first) setSelectedPreset(first);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {t(cat)}
              </button>
            ))}
          </div>

          {/* Exercise Search & Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">{t("Select Activity Preset")}</label>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">{t("MET: ")}{selectedPreset.metValue}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pe-1">
              {filteredPresets.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-start text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate block font-semibold">{t(preset.name)}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{t(" MET ")}{preset.metValue} • {preset.defaultMinutes}{t("m")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Exercise Title Optional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t("Custom Activity Title (Optional)")}</label>
            <input
              type="text"
              value={customWorkoutName}
              onChange={(e) => setCustomWorkoutName(e.target.value)}
              placeholder={t(`Default: ${selectedPreset.name}`)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all placeholder-slate-400"
            />
          </div>

          {/* Duration & Calorie Estimation with Formula Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t("Duration (Minutes)")}</label>
              <div className="relative">
                <Clock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-workout-duration"
                  type="number"
                  min={1}
                  max={360}
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  onBlur={() => {
                    if (!durationInput || parseInt(durationInput, 10) <= 0) {
                      setDurationInput(String(selectedPreset.defaultMinutes || 30));
                    }
                  }}
                  className="w-full ps-9 pe-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t("Calories Burned")}</span>
                <span className="text-[10px] text-rose-600 font-mono font-bold">{t("Calculated")}</span>
              </label>
              <div className="relative">
                <Flame className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                <input
                  type="number"
                  value={customCaloriesBurned || calculatedBurn}
                  onChange={(e) => setCustomCaloriesBurned(e.target.value)}
                  className="w-full ps-9 pe-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Scientific Reference Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                {t("2024 Ainsworth Compendium of Physical Activities")}
              </span>
              <span className="font-mono text-slate-900 font-bold">{t("MET ")}{selectedPreset.metValue}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {t(" Formula: (")}{selectedPreset.metValue}{t(" MET × 3.5 × ")}{profile.weightKg}{t("kg ÷ 200) × ")}{durationMinutesNum}{t(" min = ")}<strong>{calculatedBurn}{t(" kcal")}</strong>.
            </p>
          </div>

          {/* Strength Sets Table if Strength */}
          {selectedCategory === 'strength' && (
            <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  {t("Resistance Sets (Weight & Reps)")}
                </span>
                <button
                  type="button"
                  onClick={handleAddSet}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("Add Set")}</span>
                </button>
              </div>

              <div className="space-y-2">
                {sets.map((set, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">#{set.setNum}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs">
                        <input
                          type="number"
                          step="0.5"
                          value={set.weightKg}
                          onChange={(e) => handleUpdateSet(index, 'weightKg', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none text-center"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold">{t("kg")}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(index, 'reps', parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none text-center"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold">{t("reps")}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            id="btn-confirm-save-workout"
            type="submit"
            disabled={isFuture}
            className={`w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-500/20 active:scale-[0.98] shrink-0 whitespace-nowrap ${
              isFuture ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {isFuture
                ? t("Logging Locked for Future Dates")
                : `${t("Save Workout & Burn ")}${customCaloriesBurned || calculatedBurn}${t(" kcal")}`}
            </span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
