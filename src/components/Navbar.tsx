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
  ShieldCheck
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import {
  getPreviousDayString,
  getNextDayString,
  isDateToday,
  formatDateDisplay
} from '../utils/date';

interface NavbarProps {
  onOpenProfile: () => void;
  onOpenGoogleSync: () => void;
  onOpenReferences: () => void;
  onOpenBarcodeScanner: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenProfile,
  onOpenGoogleSync,
  onOpenReferences,
  onOpenBarcodeScanner,
  activeTab,
  setActiveTab
}) => {
  const { profile, currentDate, setCurrentDate } = useFitness();

  const handlePrevDay = () => {
    setCurrentDate(getPreviousDayString(currentDate));
  };

  const handleNextDay = () => {
    setCurrentDate(getNextDayString(currentDate));
  };

  const isToday = isDateToday(currentDate);
  const formattedDate = formatDateDisplay(currentDate);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
              <Flame className="w-5 h-5 fill-emerald-400" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              <span>NutriFit</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                PRO
              </span>
            </h1>
            <span className="text-[10px] text-slate-400 block font-medium">
              USDA & Open Food Facts
            </span>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="order-3 w-full sm:order-none sm:w-auto flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-inner">
          <button
            onClick={handlePrevDay}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 flex items-center gap-2 text-xs font-bold text-white">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isToday ? `Today, ${formattedDate}` : formattedDate}</span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools: Barcode, References, Gmail Sync & Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Barcode Scanner Button */}
          <button
            id="btn-nav-barcode-scanner"
            type="button"
            onClick={onOpenBarcodeScanner}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Open Barcode Scanner (Open Food Facts)"
          >
            <Barcode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Barcode</span>
          </button>

          {/* Scientific References Tag / Button */}
          <button
            id="btn-nav-references"
            type="button"
            onClick={onOpenReferences}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="View Official Scientific References & Clinical Formulas"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">References</span>
          </button>

          {/* Cloud Sync Button */}
          <button
            id="btn-nav-google-sync"
            type="button"
            onClick={onOpenGoogleSync}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              profile.isGoogleConnected
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Backup & Gemini setup"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline">
              Backup & AI
            </span>
          </button>

          {/* Profile Editor */}
          <button
            id="btn-nav-profile"
            type="button"
            onClick={onOpenProfile}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors flex items-center gap-2"
            title="User Profile & Calorie Goals"
          >
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 hidden md:inline truncate max-w-[90px]">
              {profile.name || 'Profile'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
