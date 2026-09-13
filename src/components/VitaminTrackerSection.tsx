/* localized-render */
import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Circle,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
  Clock,
  Calendar,
  AlertTriangle,
  Award,
  BookmarkCheck,
  RotateCcw,
  Check
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { t, useLocale } from '../utils/locale';
import { LoggedSupplement, PremiumFeature } from '../types';
import { tokens } from '../theme/tokens';
import { formatDateDisplay, isDateFuture, isDateToday } from '../utils/date';
import confetti from 'canvas-confetti';

export interface RoutineItem {
  name: string;
  category: 'vitamin' | 'mineral' | 'supplement' | 'other';
  amount: number;
  unit: string;
  dosage: string;
  icon: string;
  part: 'morning' | 'noon' | 'evening' | 'bedtime';
}

export interface CommonSupplementSuggestion {
  name: string;
  category: 'vitamin' | 'mineral' | 'supplement' | 'other';
  defaultAmount: number;
  defaultUnit: string;
  icon: string;
}

export const COMMON_CATALOG: CommonSupplementSuggestion[] = [
  { name: 'Vitamin D3', category: 'vitamin', defaultAmount: 2000, defaultUnit: 'IU', icon: '☀️' },
  { name: 'Vitamin C', category: 'vitamin', defaultAmount: 1000, defaultUnit: 'mg', icon: '🍊' },
  { name: 'Vitamin B12', category: 'vitamin', defaultAmount: 500, defaultUnit: 'mcg', icon: '🧠' },
  { name: 'Vitamin B-Complex', category: 'vitamin', defaultAmount: 1, defaultUnit: 'tablet', icon: '💊' },
  { name: 'Vitamin A', category: 'vitamin', defaultAmount: 5000, defaultUnit: 'IU', icon: '🥕' },
  { name: 'Vitamin E', category: 'vitamin', defaultAmount: 400, defaultUnit: 'IU', icon: '🥑' },
  { name: 'Vitamin K2', category: 'vitamin', defaultAmount: 100, defaultUnit: 'mcg', icon: '🥬' },
  { name: 'Daily Multivitamin', category: 'supplement', defaultAmount: 1, defaultUnit: 'tablet', icon: '💊' },
  { name: 'Magnesium Glycinate', category: 'mineral', defaultAmount: 400, defaultUnit: 'mg', icon: '⚡' },
  { name: 'Magnesium Citrate', category: 'mineral', defaultAmount: 300, defaultUnit: 'mg', icon: '⚡' },
  { name: 'Zinc Picolinate', category: 'mineral', defaultAmount: 25, defaultUnit: 'mg', icon: '🛡️' },
  { name: 'Iron Bisglycinate', category: 'mineral', defaultAmount: 18, defaultUnit: 'mg', icon: '🩸' },
  { name: 'Calcium + D3', category: 'mineral', defaultAmount: 600, defaultUnit: 'mg', icon: '🦴' },
  { name: 'Potassium Gluconate', category: 'mineral', defaultAmount: 99, defaultUnit: 'mg', icon: '🍌' },
  { name: 'Selenium', category: 'mineral', defaultAmount: 200, defaultUnit: 'mcg', icon: '🛡️' },
  { name: 'Omega-3 Fish Oil', category: 'supplement', defaultAmount: 1000, defaultUnit: 'mg', icon: '🐟' },
  { name: 'CoQ10 Ubiquinol', category: 'supplement', defaultAmount: 100, defaultUnit: 'mg', icon: '⚡' },
  { name: 'Ashwagandha KSM-66', category: 'supplement', defaultAmount: 600, defaultUnit: 'mg', icon: '🌿' },
  { name: 'Creatine Monohydrate', category: 'supplement', defaultAmount: 5, defaultUnit: 'g', icon: '💪' },
  { name: 'Melatonin', category: 'supplement', defaultAmount: 3, defaultUnit: 'mg', icon: '💤' },
  { name: 'Turmeric Curcumin', category: 'supplement', defaultAmount: 500, defaultUnit: 'mg', icon: '🧡' },
  { name: 'Probiotics', category: 'supplement', defaultAmount: 1, defaultUnit: 'capsule', icon: '🦠' },
  { name: 'Collagen Peptides', category: 'supplement', defaultAmount: 10, defaultUnit: 'g', icon: '✨' },
  { name: 'Biotin', category: 'vitamin', defaultAmount: 5000, defaultUnit: 'mcg', icon: '💅' },
  { name: 'Electrolytes', category: 'supplement', defaultAmount: 1, defaultUnit: 'packet', icon: '💧' },
  { name: 'L-Theanine', category: 'supplement', defaultAmount: 200, defaultUnit: 'mg', icon: '🍵' },
  { name: 'Apple Cider Vinegar', category: 'supplement', defaultAmount: 500, defaultUnit: 'mg', icon: '🍎' },
  { name: 'Spirulina', category: 'supplement', defaultAmount: 1000, defaultUnit: 'mg', icon: '🌿' },
  { name: 'ZMA', category: 'supplement', defaultAmount: 1, defaultUnit: 'dose', icon: '🌙' },
  { name: 'Chamomile', category: 'supplement', defaultAmount: 1, defaultUnit: 'cup', icon: '🍵' }
];

const ROUTINE_STORAGE_KEY = 'fittrack_fixed_vitamin_routine';

const DEFAULT_ROUTINE: RoutineItem[] = [
  { name: 'Vitamin D3', category: 'vitamin', amount: 2000, unit: 'IU', dosage: '2000 IU', icon: '☀️', part: 'morning' },
  { name: 'Daily Multivitamin', category: 'supplement', amount: 1, unit: 'tablet', dosage: '1 tablet', icon: '💊', part: 'morning' },
  { name: 'Omega-3 Fish Oil', category: 'supplement', amount: 1000, unit: 'mg', dosage: '1000 mg', icon: '🐟', part: 'morning' },
  { name: 'Magnesium Glycinate', category: 'mineral', amount: 400, unit: 'mg', dosage: '400 mg', icon: '⚡', part: 'evening' },
  { name: 'Zinc Picolinate', category: 'mineral', amount: 25, unit: 'mg', dosage: '25 mg', icon: '🛡️', part: 'evening' }
];

const getStoredRoutine = (): RoutineItem[] => {
  try {
    const raw = localStorage.getItem(ROUTINE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_ROUTINE;
};

const saveStoredRoutine = (items: RoutineItem[]) => {
  try {
    localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}
};

interface VitaminTrackerSectionProps {
  onOpenUpgradeModal?: (feature: PremiumFeature) => void;
}

interface PartPreset {
  name: string;
  category: 'vitamin' | 'mineral' | 'supplement' | 'other';
  amount: number;
  unit: string;
  icon: string;
}

const PART_PRESETS: Record<'morning' | 'noon' | 'evening' | 'bedtime', PartPreset[]> = {
  morning: [
    { name: 'Vitamin D3', category: 'vitamin', amount: 2000, unit: 'IU', icon: '☀️' },
    { name: 'Daily Multivitamin', category: 'supplement', amount: 1, unit: 'tablet', icon: '💊' },
    { name: 'Vitamin C', category: 'vitamin', amount: 1000, unit: 'mg', icon: '🍊' },
    { name: 'Vitamin B12', category: 'vitamin', amount: 500, unit: 'mcg', icon: '🧠' },
    { name: 'Omega-3 Fish Oil', category: 'supplement', amount: 1000, unit: 'mg', icon: '🐟' },
  ],
  noon: [
    { name: 'CoQ10', category: 'supplement', amount: 100, unit: 'mg', icon: '⚡' },
    { name: 'Iron', category: 'mineral', amount: 18, unit: 'mg', icon: '🩸' },
    { name: 'Vitamin E', category: 'vitamin', amount: 400, unit: 'IU', icon: '🥑' },
    { name: 'Electrolytes', category: 'supplement', amount: 1, unit: 'packet', icon: '💧' },
  ],
  evening: [
    { name: 'Magnesium', category: 'mineral', amount: 400, unit: 'mg', icon: '⚡' },
    { name: 'Zinc', category: 'mineral', amount: 25, unit: 'mg', icon: '🛡️' },
    { name: 'Ashwagandha', category: 'supplement', amount: 600, unit: 'mg', icon: '🌿' },
    { name: 'Turmeric Curcumin', category: 'supplement', amount: 500, unit: 'mg', icon: '🧡' },
  ],
  bedtime: [
    { name: 'Melatonin', category: 'supplement', amount: 3, unit: 'mg', icon: '💤' },
    { name: 'Calcium', category: 'mineral', amount: 600, unit: 'mg', icon: '🦴' },
    { name: 'Chamomile', category: 'supplement', amount: 1, unit: 'cup', icon: '🍵' },
    { name: 'ZMA', category: 'supplement', amount: 1, unit: 'dose', icon: '🌙' },
  ],
};

const COMMON_UNITS = ['tablet', 'capsule', 'mg', 'IU', 'mcg', 'g', 'drop', 'scoop', 'packet'];

interface PartConfig {
  key: 'morning' | 'noon' | 'evening' | 'bedtime';
  title: string;
  timeRange: string;
  icon: React.ReactNode;
  themeColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

const PARTS_CONFIG: PartConfig[] = [
  {
    key: 'morning',
    title: 'Morning Dose',
    timeRange: '6:00 AM – 11:00 AM',
    icon: <Sunrise className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />,
    themeColor: 'amber',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-800',
  },
  {
    key: 'noon',
    title: 'Afternoon Dose',
    timeRange: '11:00 AM – 4:00 PM',
    icon: <Sun className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />,
    themeColor: 'yellow',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-800',
  },
  {
    key: 'evening',
    title: 'Evening Dose',
    timeRange: '4:00 PM – 9:00 PM',
    icon: <Sunset className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />,
    themeColor: 'orange',
    badgeBg: 'bg-orange-50',
    badgeBorder: 'border-orange-200',
    badgeText: 'text-orange-800',
  },
  {
    key: 'bedtime',
    title: 'Bedtime Dose',
    timeRange: '9:00 PM – Midnight',
    icon: <Moon className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />,
    themeColor: 'indigo',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
    badgeText: 'text-indigo-800',
  },
];

export const VitaminTrackerSection: React.FC<VitaminTrackerSectionProps> = ({ onOpenUpgradeModal }) => {
  useLocale();
  const { todayLog, currentDate, logSupplement, updateSupplement, removeSupplement, setDailySupplements, isPremium } = useFitness();

  const isFuture = isDateFuture(currentDate);
  const isToday = isDateToday(currentDate);

  const [activeFormPart, setActiveFormPart] = useState<'morning' | 'noon' | 'evening' | 'bedtime' | null>(null);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<string>('tablet');
  const [customCategory, setCustomCategory] = useState<'vitamin' | 'mineral' | 'supplement' | 'other'>('vitamin');
  const [alsoAddToRoutine, setAlsoAddToRoutine] = useState<boolean>(true);
  const [showSuggestionsForPart, setShowSuggestionsForPart] = useState<'morning' | 'noon' | 'evening' | 'bedtime' | null>(null);
  const [savedRoutineToast, setSavedRoutineToast] = useState(false);
  const [routineCount, setRoutineCount] = useState<number>(() => getStoredRoutine().length);

  const supplements: LoggedSupplement[] = todayLog.supplements || [];

  // Auto-generate day's fixed checklist if day is empty and not a future date
  useEffect(() => {
    if (isFuture) return;
    const existing = todayLog.supplements || [];
    if (existing.length === 0) {
      const routine = getStoredRoutine();
      if (routine && routine.length > 0) {
        const seeded: LoggedSupplement[] = routine.map((r, idx) => ({
          id: 'supp_routine_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
          name: r.name,
          category: r.category,
          amount: r.amount,
          unit: r.unit,
          dosage: r.dosage,
          icon: r.icon,
          part: r.part,
          taken: false,
          loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setDailySupplements(seeded);
      }
    }
  }, [currentDate, isFuture]);

  const handleSaveAsRoutine = () => {
    if (isFuture || supplements.length === 0) return;
    const routineItems: RoutineItem[] = supplements.map(s => ({
      name: s.name,
      category: s.category,
      amount: s.amount ?? 1,
      unit: s.unit ?? 'tablet',
      dosage: s.dosage,
      icon: s.icon || '💊',
      part: s.part || 'morning'
    }));
    saveStoredRoutine(routineItems);
    setRoutineCount(routineItems.length);
    setSavedRoutineToast(true);
    setTimeout(() => setSavedRoutineToast(false), 2500);
    try {
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
    } catch {}
  };

  const handleReloadRoutine = () => {
    if (isFuture) return;
    const routine = getStoredRoutine();
    const seeded: LoggedSupplement[] = routine.map((r, idx) => ({
      id: 'supp_routine_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
      name: r.name,
      category: r.category,
      amount: r.amount,
      unit: r.unit,
      dosage: r.dosage,
      icon: r.icon,
      part: r.part,
      taken: false,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    setDailySupplements(seeded);
    try {
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.7 } });
    } catch {}
  };

  const filteredSuggestions = customName.trim().length > 0
    ? COMMON_CATALOG.filter(c => c.name.toLowerCase().includes(customName.toLowerCase().trim()))
    : COMMON_CATALOG.slice(0, 8);

  const handleSelectSuggestion = (suggestion: CommonSupplementSuggestion) => {
    setCustomName(suggestion.name);
    setCustomAmount(suggestion.defaultAmount);
    setCustomUnit(suggestion.defaultUnit);
    setCustomCategory(suggestion.category);
    setShowSuggestionsForPart(null);
  };

  const getSupplementsForPart = (partKey: 'morning' | 'noon' | 'evening' | 'bedtime') => {
    return supplements.filter((s) => (s.part || 'morning') === partKey);
  };

  const totalCount = supplements.length;
  const takenCount = supplements.filter((s) => s.taken).length;
  const pendingCount = Math.max(0, totalCount - takenCount);
  const completionPercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // SVG Radial Calculation (radius = 34)
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  const handleToggleTaken = (item: LoggedSupplement) => {
    if (isFuture) return;
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    const nextTaken = !item.taken;
    updateSupplement(item.id, { taken: nextTaken });
    if (nextTaken) {
      try {
        confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
      } catch {}
    }
  };

  const handleAdjustAmount = (item: LoggedSupplement, delta: number) => {
    if (isFuture) return;
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    const currentAmt = item.amount ?? 1;
    const newAmt = Math.max(1, currentAmt + delta);
    const unit = item.unit || 'tablet';
    const newDosage = `${newAmt} ${unit}`;
    updateSupplement(item.id, {
      amount: newAmt,
      dosage: newDosage
    });
  };

  const handleDelete = (item: LoggedSupplement) => {
    if (isFuture) return;
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    removeSupplement(item.id);
  };

  const handleAddPreset = (partKey: 'morning' | 'noon' | 'evening' | 'bedtime', preset: PartPreset) => {
    if (isFuture) return;
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    logSupplement({
      name: preset.name,
      category: preset.category,
      amount: preset.amount,
      unit: preset.unit,
      dosage: `${preset.amount} ${preset.unit}`,
      icon: preset.icon,
      part: partKey,
      taken: false,
    });
  };

  const handleAddCustom = (partKey: 'morning' | 'noon' | 'evening' | 'bedtime', e: React.FormEvent) => {
    e.preventDefault();
    if (isFuture) return;
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    if (!customName.trim()) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }

    const amt = customAmount > 0 ? customAmount : 1;
    const unit = customUnit || 'tablet';
    const chosenIcon = customCategory === 'vitamin' ? '💊' : customCategory === 'mineral' ? '🛡️' : '🌿';

    logSupplement({
      name: customName.trim(),
      category: customCategory,
      amount: amt,
      unit: unit,
      dosage: `${amt} ${unit}`,
      icon: chosenIcon,
      part: partKey,
      taken: false,
    });

    if (alsoAddToRoutine) {
      const routine = getStoredRoutine();
      const exists = routine.some(r => r.name.toLowerCase() === customName.trim().toLowerCase() && r.part === partKey);
      if (!exists) {
        const nextRoutine = [...routine, {
          name: customName.trim(),
          category: customCategory,
          amount: amt,
          unit: unit,
          dosage: `${amt} ${unit}`,
          icon: chosenIcon,
          part: partKey
        }];
        saveStoredRoutine(nextRoutine);
        setRoutineCount(nextRoutine.length);
      }
    }

    setCustomName('');
    setCustomAmount(1);
    setActiveFormPart(null);
    setShowSuggestionsForPart(null);
  };

  return (
    <div id="vitamins-section" className="space-y-5">
      {/* Luxury Hero Command Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-teal-900 to-slate-950 p-5 sm:p-6 text-white shadow-xl border border-teal-700/40">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-44 h-44 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 start-1/3 -mb-10 w-36 h-36 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Column: Title, Subtitle, Date, KPIs */}
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase tracking-wider">
                {t("Micro-Nutrient Protocol")}
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15 font-semibold">
                📅 {isToday ? `${t("Today")}, ${formatDateDisplay(currentDate)}` : formatDateDisplay(currentDate)}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Pill className="w-6 h-6 text-teal-300 shrink-0" />
                <span>{t("Vitamins & Supplements")}</span>
              </h2>
              <p className="text-xs text-teal-100/75 mt-1 font-medium max-w-md">
                {t("Track daily micronutrients, scheduled dosages, and compliance across morning, afternoon, evening, and bedtime.")}
              </p>
            </div>

            {/* Quick KPI Stats */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="px-3 py-1.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
                <span className="text-[10px] text-teal-200 block font-medium">{t("Scheduled")}</span>
                <span className="text-sm font-black text-white font-mono">{totalCount} {t("items")}</span>
              </div>
              <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block font-medium">{t("Completed")}</span>
                <span className="text-sm font-black text-emerald-300 font-mono">{takenCount} {t("taken")}</span>
              </div>
              <div className="px-3 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 backdrop-blur-xs">
                <span className="text-[10px] text-amber-200 block font-medium">{t("Pending")}</span>
                <span className="text-sm font-black text-amber-300 font-mono">{pendingCount} {t("left")}</span>
              </div>
            </div>

            {/* Daily Fixed Routine Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleSaveAsRoutine}
                disabled={isFuture || supplements.length === 0}
                className="px-2.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                title={t("Save today's vitamins as your repeating daily checklist")}
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>{savedRoutineToast ? t("Routine Saved!") : t("Save as Daily Checklist")}</span>
              </button>

              <button
                type="button"
                onClick={handleReloadRoutine}
                disabled={isFuture}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                title={t("Load fixed daily checklist into today")}
              >
                <RotateCcw className="w-3.5 h-3.5 text-white/80" />
                <span>{t("Load Fixed Checklist")}</span>
              </button>

              {routineCount > 0 && (
                <span className="text-[10px] text-teal-200/80 font-medium">
                  ({routineCount} {t("routine items active")})
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Radial Adherence Ring */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-md shrink-0 justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                {/* Background Circle */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="7"
                  className="text-white/10"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-teal-400 transition-all duration-700 ease-out"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-white font-mono leading-none">
                  {completionPercent}%
                </span>
                <span className="text-[9px] text-teal-200 uppercase tracking-wider font-bold mt-0.5">
                  {t("Adherence")}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">
                {completionPercent === 100 ? t("All Doses Done!") : t("Daily Compliance")}
              </span>
              <p className="text-[11px] text-teal-200/80 font-medium">
                {takenCount} of {totalCount} doses taken
              </p>
              {completionPercent === 100 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Award className="w-3 h-3" /> {t("Target Achieved")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Future Date Lock Notice */}
      {isFuture && (
        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">
            {t("Tracking is locked for future dates. Please navigate to today or a past date to record or tick off your supplements.")}
          </span>
        </div>
      )}

      {/* Calorie Pewar PRO Upgrade Prompt */}
      {!isPremium && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-teal-950 block">
                {t("Calorie Pewar PRO Vitamin Protocol")}
              </span>
              <span className="text-[11px] text-teal-800 font-medium">
                {t("Unlock full schedule tracking across morning, noon, evening, and bedtime doses.")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenUpgradeModal?.('vitamins')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
          >
            {t("Unlock PRO")}
          </button>
        </div>
      )}

      {/* 4 Daily Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PARTS_CONFIG.map((part) => {
          const partItems = getSupplementsForPart(part.key);
          const isFormOpen = activeFormPart === part.key;
          const presets = PART_PRESETS[part.key];

          return (
            <div
              key={part.key}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-3xl p-5 flex flex-col justify-between transition-all shadow-xs"
            >
              {/* Part Header */}
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${part.badgeBg} ${part.badgeBorder} ${part.badgeText} border shrink-0`}>
                      {part.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>{t(part.title)}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${part.badgeBg} ${part.badgeText} font-mono font-bold border ${part.badgeBorder}`}>
                          {partItems.length}
                        </span>
                      </h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" strokeWidth={tokens.icons.strokeWidth} />
                        {t(part.timeRange)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isFuture}
                    onClick={() => {
                      if (!isPremium && onOpenUpgradeModal) {
                        onOpenUpgradeModal('vitamins');
                        return;
                      }
                      setActiveFormPart(isFormOpen ? null : part.key);
                    }}
                    className={`px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-teal-800 text-xs font-bold flex items-center gap-1 transition-colors border border-teal-200 shadow-xs ${
                      isFuture ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
                    <span>{t("Add")}</span>
                  </button>
                </div>

                {/* Logged Items for this Part */}
                <div className="space-y-2 mb-3">
                  {partItems.length > 0 ? (
                    partItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                          item.taken
                            ? 'bg-teal-50/70 border-teal-200 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        {/* Checkbox & Name */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            disabled={isFuture}
                            onClick={() => handleToggleTaken(item)}
                            className={`text-slate-400 hover:text-teal-600 active:scale-90 transition-transform p-0.5 ${
                              isFuture ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title={t(item.taken ? "Mark as not taken" : "Mark as taken")}
                          >
                            {item.taken ? (
                              <CheckCircle2 className="w-5 h-5 text-teal-600 fill-teal-600/15" strokeWidth={tokens.icons.strokeWidth} />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" strokeWidth={tokens.icons.strokeWidth} />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm">{item.icon || '💊'}</span>
                              <span
                                className={`text-xs font-bold truncate ${
                                  item.taken ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {t(item.name)}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block font-medium mt-0.5">
                              {item.dosage}
                            </span>
                          </div>
                        </div>

                        {/* Amount Stepper Controls [-] count [+] */}
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-xs">
                          <button
                            type="button"
                            disabled={isFuture}
                            aria-label={t("Decrease amount")}
                            onClick={() => handleAdjustAmount(item, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-90 transition-all text-xs cursor-pointer disabled:opacity-40"
                          >
                            <Minus className="w-3 h-3" strokeWidth={tokens.icons.strokeWidth} />
                          </button>

                          <span className="text-xs font-bold font-mono px-1 min-w-[20px] text-center text-teal-700">
                            {item.amount ?? 1}
                          </span>

                          <button
                            type="button"
                            disabled={isFuture}
                            aria-label={t("Increase amount")}
                            onClick={() => handleAdjustAmount(item, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-90 transition-all text-xs cursor-pointer disabled:opacity-40"
                          >
                            <Plus className="w-3.5 h-3.5" strokeWidth={tokens.icons.strokeWidth} />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          disabled={isFuture}
                          aria-label={t("Delete supplement")}
                          onClick={() => handleDelete(item)}
                          className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 active:scale-90 transition-all border border-slate-200 shadow-xs cursor-pointer disabled:opacity-40"
                          title={t("Delete supplement")}
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={tokens.icons.strokeWidth} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 px-3 text-center text-xs text-slate-400 italic bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      {t("No vitamins scheduled for this time.")}
                    </div>
                  )}
                </div>

                {/* Inline Custom Add Form (Collapsible) */}
                {isFormOpen && (
                  <form
                    onSubmit={(e) => handleAddCustom(part.key, e)}
                    className="p-4 bg-slate-50 rounded-2xl border border-teal-200 shadow-xs space-y-3 mb-3 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
                        <span>{t("Add to")} {t(part.title)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveFormPart(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t("Supplement name (e.g., Vitamin D3, Zinc, Magnesium)...")}
                        value={customName}
                        onChange={(e) => {
                          setCustomName(e.target.value);
                          setShowSuggestionsForPart(part.key);
                        }}
                        onFocus={() => setShowSuggestionsForPart(part.key)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        required
                      />

                      {/* Autocomplete Suggestions Dropdown */}
                      {showSuggestionsForPart === part.key && filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 max-h-48 overflow-y-auto p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                            <span>{t("Suggestions")}</span>
                            <span className="text-[9px] text-teal-600 font-mono font-medium">{t("Tap to fill")}</span>
                          </div>
                          {filteredSuggestions.map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectSuggestion(item);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-teal-50 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span>{item.icon}</span>
                                <span className="font-semibold text-slate-800 truncate">{t(item.name)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                                <span className="text-teal-700 font-mono font-bold">{item.defaultAmount} {t(item.defaultUnit)}</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 capitalize">{t(item.category)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-600 block mb-1 font-bold">{t("Amount")}</label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-600 block mb-1 font-bold">{t("Unit")}</label>
                        <select
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        >
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {t(u)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={alsoAddToRoutine}
                        onChange={(e) => setAlsoAddToRoutine(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span>{t("Save to daily routine checklist (repeats every day)")}</span>
                    </label>

                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as any)}
                        className="px-2.5 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-700 font-medium"
                      >
                        <option value="vitamin">{t("Vitamin")}</option>
                        <option value="mineral">{t("Mineral")}</option>
                        <option value="supplement">{t("Supplement")}</option>
                        <option value="other">{t("Other")}</option>
                      </select>

                      <button
                        type="submit"
                        className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={tokens.icons.strokeWidth} />
                        <span>{t("Add Item")}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 1-Tap Quick Presets for this Part */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  {t("Quick Add")}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={isFuture}
                      onClick={() => handleAddPreset(part.key, preset)}
                      className={`px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-all shadow-xs ${
                        isFuture ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span>{t(preset.name)}</span>
                      <span className="text-[9px] text-teal-700 font-mono font-bold">({preset.amount} {t(preset.unit)})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
