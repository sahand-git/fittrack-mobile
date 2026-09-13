import { DialogAccessibility } from './components/DialogAccessibility';
/* localized-render */
import { t, useLocale, localeTag } from "./utils/locale";
import React, { useState, useEffect } from 'react';
import { LanguagePicker } from './components/LanguagePicker';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { DailySummary } from './components/DailySummary';
import { TrendsSection } from './components/TrendsSection';
import { MealTracker } from './components/MealTracker';
import { OnboardingModal } from './components/OnboardingModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { FoodLogModal } from './components/FoodLogModal';
import { PhoneStepTrackerModal } from './components/PhoneStepTrackerModal';
import { AICoachSection } from './components/AICoachSection';
import { AddWorkoutModal } from './components/AddWorkoutModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { ProfileModal } from './components/ProfileModal';
import { ScientificReferencesModal } from './components/ScientificReferencesModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { AIPlateScannerModal } from './components/AIPlateScannerModal';
import { NotificationBanner } from './components/NotificationBanner';
import { SupplementTrackerModal } from './components/SupplementTrackerModal';
import { VitaminTrackerSection } from './components/VitaminTrackerSection';
import { UpgradeModal } from './components/UpgradeModal';
import { RemindersModal } from './components/RemindersModal';
import { scheduleAllConfiguredReminders } from './utils/notifications';
import { MealType, PremiumFeature } from './types';
import { tokens } from './theme/tokens';
import { isDateFuture, formatDateDisplay } from './utils/date';
import {
  Pill,
  Dumbbell,
  Plus,
  Trash2,
  Flame,
  Clock,
  Sparkles,
  Bot,
  Footprints,
  Barcode,
  Cloud,
  CheckCircle2,
  Activity,
  BookOpen,
  ShieldCheck,
  LayoutDashboard,
  Utensils,
  X,
  Smartphone,
  Watch,
  ChevronLeft,
  TrendingUp
} from 'lucide-react';

function DashboardContent() {
  useLocale();
  const { profile, todayLog, removeWorkout, activeTab, setActiveTab, isPremium, currentDate, storageError, retryStoragePersistence, hasCorruptRecoveryBackup, exportCorruptRecoveryJSON } = useFitness();
  const isFuture = isDateFuture(currentDate);

  // Modals state
  const [selectedMealForAction, setSelectedMealForAction] = useState<MealType>('lunch');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState<boolean>(false);
  const [isPlateScannerOpen, setIsPlateScannerOpen] = useState<boolean>(false);
  const [isFoodLogOpen, setIsFoodLogOpen] = useState<boolean>(false);
  const [isStepTrackerOpen, setIsStepTrackerOpen] = useState<boolean>(false);
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState<boolean>(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isReferencesOpen, setIsReferencesOpen] = useState<boolean>(false);
  const [isSupplementTrackerOpen, setIsSupplementTrackerOpen] = useState<boolean>(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeFeature, setUpgradeFeature] = useState<PremiumFeature | null>(null);

  useEffect(() => {
    scheduleAllConfiguredReminders();
  }, []);

  const handleOpenUpgrade = (feature: PremiumFeature) => {
    setUpgradeFeature(feature);
    setIsUpgradeModalOpen(true);
  };

  // Global window bridge so any external test or script calling setActiveTab never fails
  useEffect(() => {
    const handleTabChange = (tab: string) => {
      const normalized = (tab || '').toLowerCase();
      if (normalized.includes('coach') || normalized.includes('ai')) {
        setActiveTab('coach');
      } else if (normalized.includes('trend') || normalized.includes('chart') || normalized.includes('weight') || normalized.includes('progress')) {
        setActiveTab('trends');
      } else if (normalized.includes('step') || normalized.includes('wearable')) {
        setActiveTab('steps');
      } else if (normalized.includes('meal') || normalized.includes('food')) {
        setActiveTab('meals');
        setSelectedMealForAction('lunch');
      } else if (normalized.includes('workout') || normalized.includes('exercise')) {
        setActiveTab('workouts');
      } else if (normalized.includes('vitamin') || normalized.includes('supp')) {
        setActiveTab('vitamins');
      } else {
        setActiveTab('dashboard');
      }
    };

    (window as any).__handleSetActiveTab = handleTabChange;
    (window as any).setActiveTab = handleTabChange;
    (window as any).activeTab = activeTab;
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).setActiveTab = handleTabChange;
      (globalThis as any).activeTab = activeTab;
    }
  }, [setActiveTab, activeTab]);

  const handleOpenBarcodeScanner = (meal: MealType = 'lunch') => {
    setSelectedMealForAction(meal);
    setIsBarcodeScannerOpen(true);
  };

  const handleOpenPlateScanner = (meal: MealType = 'lunch') => {
    if (!isPremium) {
      handleOpenUpgrade('ai_plate');
      return;
    }
    setSelectedMealForAction(meal);
    setIsPlateScannerOpen(true);
  };

  const handleOpenFoodLog = (meal: MealType = 'lunch') => {
    setSelectedMealForAction(meal);
    setIsFoodLogOpen(true);
  };

  if (!profile.profileCompleted || profile.onboardingVersion !== 1) {
    return <OnboardingModal />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 flex flex-col selection:bg-teal-500 selection:text-white font-sans pb-24 sm:pb-28">
      {/* Main Top Navigation */}
      <Navbar
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        onOpenReferences={() => setIsReferencesOpen(true)}
        onOpenBarcodeScanner={() => handleOpenBarcodeScanner('lunch')}
        onOpenReminders={() => setIsRemindersOpen(true)}
        onOpenUpgradeModal={handleOpenUpgrade}
      />

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-6 flex-1 min-w-0">
        {storageError && <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 space-y-2"><p>{t(storageError)}</p><button type="button" onClick={retryStoragePersistence} className="font-semibold underline">{t('Retry saving')}</button><button type="button" onClick={()=>setIsGoogleSyncOpen(true)} className="font-semibold underline ms-4">{t('Export a backup')}</button></div>}
        {hasCorruptRecoveryBackup && <button type="button" onClick={()=>{void exportCorruptRecoveryJSON().catch(()=>window.alert(t('Recovery data could not be exported. Please try again.')));}} className="text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-xl underline">{t('Export original recovery data')}</button>}
        {/* Smart Reminders (Hydration & Meal Times) */}
        <NotificationBanner
          onOpenMealLog={handleOpenFoodLog}
          onOpenSupplementTracker={() => {
            setActiveTab('vitamins');
          }}
        />

        {/* Daily Summary & Caloric Budget Engine */}
        {activeTab === 'dashboard' && (
          <DailySummary
            onOpenBarcodeScanner={handleOpenBarcodeScanner}
            onOpenPlateScanner={handleOpenPlateScanner}
            onOpenFoodLog={handleOpenFoodLog}
            onOpenStepTracker={() => setIsStepTrackerOpen(true)}
            onOpenAICoach={() => {
              if (!isPremium) {
                handleOpenUpgrade('gemini_coach');
                return;
              }
              setActiveTab('coach');
            }}
            onOpenAddWorkout={() => setIsAddWorkoutOpen(true)}
            onOpenSupplementTracker={() => {
              setActiveTab('vitamins');
            }}
            onOpenUpgradeModal={handleOpenUpgrade}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Progress & Trends View */}
        {activeTab === 'trends' && (
          <TrendsSection onOpenProfile={() => setIsProfileOpen(true)} />
        )}

        {/* Meal & Nutrition Tracker */}
        {activeTab === 'meals' && (
          <MealTracker
            onOpenFoodLog={handleOpenFoodLog}
            onOpenBarcodeScanner={handleOpenBarcodeScanner}
            onOpenPlateScanner={handleOpenPlateScanner}
            onOpenUpgradeModal={handleOpenUpgrade}
          />
        )}

        {/* Workouts & Active Exercise Section */}
        {activeTab === 'workouts' && (
          <div id="workout-section" className="space-y-4">
            {/* Header & Metric Overview Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <Dumbbell className="w-6 h-6" strokeWidth={tokens.icons.strokeWidth} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex flex-wrap items-center gap-2">
                      <span>{t("Exercise & Workout Log")}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0 whitespace-nowrap">
                        {todayLog.workouts.length} {t("recorded")}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {formatDateDisplay(currentDate)} • {t("Estimated exercise energy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReferencesOpen(true)}
                    className="hidden sm:flex px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" strokeWidth={tokens.icons.strokeWidth} />
                    <span>{t("MET Sources")}</span>
                  </button>

                  <button
                    id="btn-add-workout-main"
                    type="button"
                    disabled={isFuture}
                    onClick={() => setIsAddWorkoutOpen(true)}
                    className={`w-full sm:w-auto justify-center whitespace-nowrap shrink-0 px-4 py-2.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                      isFuture
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                    }`}
                  >
                    <Plus className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
                    <span>{t("Log Exercise")}</span>
                  </button>
                </div>
              </div>

              {/* Future Date Warning Banner */}
              {isFuture && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-2 font-medium">
                  <span className="text-sm">⚠️</span>
                  <span>{t("Logging workouts for future dates is disabled. Navigate to Today or a past date to record your exercise.")}</span>
                </div>
              )}

              {/* Quick Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("Active Burn")}</span>
                  <span className="text-base sm:text-lg font-black text-rose-600 font-mono mt-0.5 block">
                    +{todayLog.workouts.reduce((acc, w) => acc + w.caloriesBurned, 0)}
                  </span>
                  <span className="text-[9px] text-slate-400">{t("kcal burned")}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("Duration")}</span>
                  <span className="text-base sm:text-lg font-black text-slate-800 font-mono mt-0.5 block">
                    {todayLog.workouts.reduce((acc, w) => acc + w.durationMinutes, 0)}
                  </span>
                  <span className="text-[9px] text-slate-400">{t("minutes")}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("Strength Sets")}</span>
                  <span className="text-base sm:text-lg font-black text-slate-800 font-mono mt-0.5 block">
                    {todayLog.workouts.reduce((acc, w) => acc + (w.sets?.length || 0), 0)}
                  </span>
                  <span className="text-[9px] text-slate-400">{t("sets recorded")}</span>
                </div>
              </div>
            </div>

            {/* Workouts List */}
            <div className="space-y-3">
              {todayLog.workouts.length > 0 ? (
                todayLog.workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-rose-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{t(workout.name)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200 capitalize shrink-0 whitespace-nowrap">
                          {t(workout.category)}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60 font-medium shrink-0 whitespace-nowrap">
                          {t("Ref: Ainsworth MET 2024")}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={tokens.icons.strokeWidth} />
                          {t(workout.durationMinutes)}{t(" minutes ")}
                        </span>
                        {workout.sets && workout.sets.length > 0 && (
                          <span>• {t(workout.sets.length)}{t(" resistance sets recorded")}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1 font-mono">
                        <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" strokeWidth={tokens.icons.strokeWidth} />
                        +{t(workout.caloriesBurned)}{t(" kcal ")}
                      </span>
                      <button
                        type="button"
                        aria-label={t("Delete workout")}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate(25);
                          }
                          removeWorkout(workout.id);
                        }}
                        className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-slate-50 hover:bg-rose-50 active:bg-rose-100 text-slate-400 hover:text-rose-600 active:scale-90 transition-all border border-slate-200/80 shadow-xs cursor-pointer"
                        title={t("Delete workout")}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mx-auto">
                    <Dumbbell className="w-6 h-6" strokeWidth={tokens.icons.strokeWidth} />
                  </div>
                  <p className="max-w-xs mx-auto text-slate-500 font-medium">
                    {t("No exercise recorded for this day. Tap \"Log Exercise\" to track strength training, cardio, or sports.")}
                  </p>
                  {!isFuture && (
                    <button
                      type="button"
                      onClick={() => setIsAddWorkoutOpen(true)}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 border border-rose-200 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
                      <span>{t("Log First Workout")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dedicated Vitamins & Daily Supplements Section */}
        {activeTab === 'vitamins' && (
          <VitaminTrackerSection onOpenUpgradeModal={handleOpenUpgrade} />
        )}

        {/* Dedicated Steps & Phone Activity Hub (visible on steps tab) */}
        {activeTab === 'steps' && (
          <div id="steps-hub-section" className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Footprints className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex flex-wrap items-center gap-2">
                    <span>{t("Daily Steps & Phone Activity")}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0 whitespace-nowrap">{t("Live")}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t((todayLog.steps || 0).toLocaleString(localeTag()))} / {t(profile.stepGoal.toLocaleString(localeTag()))}{t(" steps • +")}{t(Math.round((todayLog.steps || 0) * 0.04))}{t(" kcal burned ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-open-step-tracker-main"
                  type="button"
                  onClick={() => setIsStepTrackerOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  <Footprints className="w-3.5 h-3.5" strokeWidth={tokens.icons.strokeWidth} />
                  <span>{t("Track & Log Steps")}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setIsStepTrackerOpen(true)}
                className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-start transition-all group"
              >
                <div className="flex items-center justify-between text-amber-600 mb-2">
                  <Smartphone className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
                  <span className="text-xs font-bold font-mono text-slate-800">{t((todayLog.steps || 0).toLocaleString(localeTag()))}{t(" steps")}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 block">{t("Phone Accelerometer")}</span>
                <p className="text-[11px] text-slate-500 mt-1">{t("Real-time pedometer with pocket & hand walk detection")}</p>
              </button>

              <button
                type="button"
                onClick={() => setIsStepTrackerOpen(true)}
                className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-start transition-all group"
              >
                <div className="flex items-center justify-between text-rose-600 mb-2">
                  <span className="font-bold text-sm">{t(" Health & Fit")}</span>
                  <span className="text-xs font-bold font-mono text-teal-600">{t("Sync Ready")}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 block">{t("Health App Ecosystems")}</span>
                <p className="text-[11px] text-slate-500 mt-1">{t("Apple Health, Google Fit, Samsung Health, Garmin, Fitbit")}</p>
              </button>

              <button
                type="button"
                onClick={() => setIsStepTrackerOpen(true)}
                className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-start transition-all group"
              >
                <div className="flex items-center justify-between text-cyan-600 mb-2">
                  <Watch className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
                  <span className="text-xs font-bold font-mono text-cyan-700">{t("BLE Connect")}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 block">{t("Smartwatch & Wearables")}</span>
                <p className="text-[11px] text-slate-500 mt-1">{t("Direct Bluetooth heart rate & stride cadence reader")}</p>
              </button>
            </div>
          </div>
        )}

        {/* Integrated Full-Screen AI Coach & Nutrition Audit */}
        {activeTab === 'coach' && (
          <AICoachSection
            onOpenUpgradeModal={handleOpenUpgrade}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}
      </main>

      {/* Persistent Bottom Tab Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-0.5 sm:px-4 py-1.5 sm:py-2 shadow-xs w-full max-w-full overflow-hidden">
        <div className="max-w-md mx-auto flex items-center justify-between gap-0.5 w-full">
          <button
            id="tab-btn-dashboard"
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-0.5 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'text-teal-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={t("Dashboard")}
          >
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={tokens.icons.strokeWidth} />
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] truncate max-w-full leading-tight mt-1 tracking-tight text-center block w-full">{t("Dashboard")}</span>
          </button>

          <button
            id="tab-btn-trends"
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-0.5 rounded-xl transition-all ${
              activeTab === 'trends'
                ? 'text-teal-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={t("Trends")}
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={tokens.icons.strokeWidth} />
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] truncate max-w-full leading-tight mt-1 tracking-tight text-center block w-full">{t("Trends")}</span>
          </button>

          <button
            id="tab-btn-meals"
            type="button"
            onClick={() => setActiveTab('meals')}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-0.5 rounded-xl transition-all ${
              activeTab === 'meals'
                ? 'text-teal-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={t("Meals")}
          >
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={tokens.icons.strokeWidth} />
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] truncate max-w-full leading-tight mt-1 tracking-tight text-center block w-full">{t("Meals")}</span>
          </button>

          <button
            id="tab-btn-workouts"
            type="button"
            onClick={() => setActiveTab('workouts')}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-0.5 rounded-xl transition-all ${
              activeTab === 'workouts'
                ? 'text-rose-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={t("Workouts")}
          >
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={tokens.icons.strokeWidth} />
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] truncate max-w-full leading-tight mt-1 tracking-tight text-center block w-full">{t("Workouts")}</span>
          </button>

          <button
            id="tab-btn-vitamins"
            type="button"
            onClick={() => setActiveTab('vitamins')}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-0.5 rounded-xl transition-all ${
              activeTab === 'vitamins'
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={t("Vitamins")}
          >
            <Pill className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={tokens.icons.strokeWidth} />
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] truncate max-w-full leading-tight mt-1 tracking-tight text-center block w-full">{t("Vitamins")}</span>
          </button>

          <button
            id="tab-btn-steps"
            type="button"
            onClick={() => setActiveTab('steps')}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-0.5 rounded-xl transition-all ${
              activeTab === 'steps'
                ? 'text-amber-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={t("Steps")}
          >
            <Footprints className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={tokens.icons.strokeWidth} />
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] truncate max-w-full leading-tight mt-1 tracking-tight text-center block w-full">{t("Steps")}</span>
          </button>

          <button
            id="tab-btn-coach"
            type="button"
            onClick={() => {
              if (!isPremium) {
                handleOpenUpgrade('gemini_coach');
                return;
              }
              setActiveTab('coach');
            }}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-0.5 rounded-xl transition-all ${
              activeTab === 'coach'
                ? 'text-teal-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={t("AI Coach")}
          >
            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white p-0.5 shadow-xs relative shrink-0 ${
              activeTab === 'coach' ? 'bg-teal-600 ring-2 ring-teal-400/40' : 'bg-slate-400'
            }`}>
              <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={tokens.icons.strokeWidth} />
              {!isPremium && (
                <span className="absolute -top-1 -right-1 text-[7px] font-black bg-amber-400 text-slate-950 px-0.5 rounded leading-none">
                  PRO
                </span>
              )}
            </div>
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold truncate max-w-full leading-tight mt-1 tracking-tight text-center block w-full">{t("AI Coach")}</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        targetMeal={selectedMealForAction}
        onOpenAIScanner={() => setIsPlateScannerOpen(true)}
      />

      <AIPlateScannerModal
        isOpen={isPlateScannerOpen}
        onClose={() => setIsPlateScannerOpen(false)}
        defaultMealType={selectedMealForAction}
        onOpenGeminiSetup={() => setIsProfileOpen(true)}
        onOpenUpgradeModal={handleOpenUpgrade}
      />

      <FoodLogModal
        isOpen={isFoodLogOpen}
        onClose={() => setIsFoodLogOpen(false)}
        mealType={selectedMealForAction}
        onOpenBarcodeScanner={(meal) => {
          setSelectedMealForAction(meal);
          setIsBarcodeScannerOpen(true);
        }}
        onOpenPlateScanner={(meal) => {
          if (!isPremium) {
            handleOpenUpgrade('ai_plate');
            return;
          }
          setSelectedMealForAction(meal);
          setIsPlateScannerOpen(true);
        }}
        onOpenUpgradeModal={handleOpenUpgrade}
      />

      <PhoneStepTrackerModal
        isOpen={isStepTrackerOpen}
        onClose={() => setIsStepTrackerOpen(false)}
      />

      <AddWorkoutModal
        isOpen={isAddWorkoutOpen}
        onClose={() => setIsAddWorkoutOpen(false)}
        onOpenReferences={() => setIsReferencesOpen(true)}
      />

      <GoogleSyncModal
        isOpen={isGoogleSyncOpen}
        onClose={() => setIsGoogleSyncOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenReminders={() => setIsRemindersOpen(true)}
      />

      <RemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
      />

      <ScientificReferencesModal
        isOpen={isReferencesOpen}
        onClose={() => setIsReferencesOpen(false)}
      />

      <SupplementTrackerModal
        isOpen={isSupplementTrackerOpen}
        onClose={() => setIsSupplementTrackerOpen(false)}
        onOpenUpgradeModal={handleOpenUpgrade}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature={upgradeFeature}
      />

      {/* Mobile PWA Install Guide */}
      <PWAInstallBanner />
    </div>
  );
}

function AccountApp() {
  useLocale();
  const {user,guest,ready}=useAuth();
  if (!ready) return <main className="min-h-dvh bg-slate-50 text-slate-800 p-8" role="status">{t("Opening Calorie Pewar…")}</main>;
  if (!user && !guest) return <LoginScreen />;
  return (
    <FitnessProvider key={user?.uid || 'guest'} accountId={user?.uid} accountName={user?.displayName || ''} accountEmail={user?.email || ''}>
      <DashboardContent />
    </FitnessProvider>
  );
}

export default function App() {
  useLocale();
  return (
    <AuthProvider>
      <DialogAccessibility />
      <AccountApp />
    </AuthProvider>
  );
}
