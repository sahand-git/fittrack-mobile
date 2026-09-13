/* localized-render */
import { t, useLocale, localeTag } from "../utils/locale";
import React from 'react';
import {
  Flame,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Barcode,
  BookOpen,
  Bell
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import {
  getPreviousDayString,
  getNextDayString,
  getTodayDateString,
  isDateToday,
  formatDateDisplay
} from '../utils/date';
import { tokens } from '../theme/tokens';
import { calculateLoggingStreak } from '../utils/streak';
import { PremiumFeature } from '../types';
import { LanguagePicker } from './LanguagePicker';

interface NavbarProps {
  onOpenProfile: () => void;
  onOpenGoogleSync: () => void;
  onOpenReferences: () => void;
  onOpenBarcodeScanner: () => void;
  onOpenReminders?: () => void;
  onOpenUpgradeModal?: (feature: PremiumFeature) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenProfile,
  onOpenGoogleSync,
  onOpenReferences,
  onOpenBarcodeScanner,
  onOpenReminders,
  activeTab,
  setActiveTab,
  onOpenUpgradeModal
}) => {
  useLocale();
  const { profile, currentDate, setCurrentDate, dailyLogs, weightHistory, isPremium } = useFitness();

  const isToday = isDateToday(currentDate);
  const isTodayOrFuture = currentDate >= getTodayDateString();

  const handlePrevDay = () => {
    setCurrentDate(getPreviousDayString(currentDate));
  };

  const handleNextDay = () => {
    if (isTodayOrFuture) return;
    setCurrentDate(getNextDayString(currentDate));
  };

  const formattedDate = formatDateDisplay(currentDate);
  const streak = calculateLoggingStreak(dailyLogs, weightHistory, currentDate);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 p-0.5 shadow-sm shrink-0">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-teal-600">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-teal-600" strokeWidth={tokens.icons.strokeWidth} />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
              <span>{t("Calorie Pewar")}</span>
              {isPremium ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-600 text-white font-black tracking-wider shadow-xs shrink-0 whitespace-nowrap">{t("PRO")}</span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200 shrink-0 whitespace-nowrap">{t("v2")}</span>
              )}
            </h1>
            <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium mt-0.5 truncate">{t("Health & Calorie Engine")}</span>
          </div>
        </div>

        {/* Date Navigator & Streak Badge */}
        <div className="order-3 w-full sm:order-none sm:w-auto flex items-center justify-between sm:justify-center gap-2 bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1 shadow-xs">
          <button
            onClick={handlePrevDay}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-white transition-colors"
            title={t("Previous Day")}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
          </button>

          <div className="px-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
            <span>{isToday ? <>{t("Today")}, {formattedDate}</> : formattedDate}</span>
          </div>

          <button
            onClick={handleNextDay}
            disabled={isTodayOrFuture}
            className={`p-1.5 rounded-xl transition-all ${
              isTodayOrFuture
                ? 'opacity-30 cursor-not-allowed text-slate-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
            title={isTodayOrFuture ? t("Cannot log future dates") : t("Next Day")}
          >
            <ChevronRight className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
          </button>

          {/* Inline Streak Badge in Date Pill */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-orange-100/70 border border-orange-200/80 text-orange-800 text-[11px] font-bold"
            title={t("Consecutive logging days")}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" strokeWidth={tokens.icons.strokeWidth} />
            <span className="font-mono">{streak.currentStreak}d</span>
          </div>
        </div>

        {/* Right Tools: Barcode, References, Gmail Sync & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Barcode Scanner Button */}
          <button
            id="btn-nav-barcode-scanner"
            type="button"
            onClick={() => {
              onOpenBarcodeScanner();
            }}
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            title={t("Open Barcode Scanner (Open Food Facts)")}
          >
            <Barcode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600" strokeWidth={tokens.icons.strokeWidth} />
            <span className="hidden sm:inline">{t("Barcode")}</span>
          </button>

          {/* Scientific References Tag / Button */}
          <button
            id="btn-nav-references"
            type="button"
            onClick={onOpenReferences}
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            title={t("View Official Scientific References & Clinical Formulas")}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" strokeWidth={tokens.icons.strokeWidth} />
            <span className="hidden md:inline">{t("References")}</span>
          </button>

          {/* Cloud Sync Button */}
          <button
            id="btn-nav-google-sync"
            type="button"
            onClick={onOpenGoogleSync}
            className={`h-8 sm:h-9 px-2 sm:px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
              profile.isGoogleConnected
                ? 'bg-blue-50/90 border-blue-200 text-blue-700 hover:bg-blue-100/80'
                : 'bg-slate-50/90 hover:bg-slate-100/90 border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title={t("Backup & Gemini setup")}
          >
            <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" strokeWidth={tokens.icons.strokeWidth} />
            <span className="hidden lg:inline">{t("Backup & AI")}</span>
          </button>

          {/* Reminders & Notifications Button */}
          <button
            id="btn-nav-reminders"
            type="button"
            onClick={onOpenReminders}
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            title={t("Push Notifications & Reminders")}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" strokeWidth={tokens.icons.strokeWidth} />
            <span className="hidden xl:inline">{t("Reminders")}</span>
          </button>

          {/* Profile Editor */}
          <button
            id="btn-nav-profile"
            type="button"
            onClick={onOpenProfile}
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 text-slate-800 transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
            title={t("User Profile & Calorie Goals")}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
            <span className="text-xs font-bold text-slate-800 hidden md:inline truncate max-w-[90px]">
              {t(profile.name || 'Profile')}
            </span>
          </button>

          {/* Language Selector */}
          <div className="shrink-0">
            <LanguagePicker />
          </div>
        </div>
      </div>
    </header>
  );
};
