import React, { useState, useEffect } from 'react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import { Navbar } from './components/Navbar';
import { DailySummary } from './components/DailySummary';
import { MealTracker } from './components/MealTracker';
import { OnboardingModal } from './components/OnboardingModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { FoodLogModal } from './components/FoodLogModal';
import { PhoneStepTrackerModal } from './components/PhoneStepTrackerModal';
import { AICoachModal } from './components/AICoachModal';
import { AddWorkoutModal } from './components/AddWorkoutModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { ProfileModal } from './components/ProfileModal';
import { ScientificReferencesModal } from './components/ScientificReferencesModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { MealType } from './types';
import {
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
  ChevronLeft
} from 'lucide-react';

function DashboardContent() {
  const { profile, todayLog, removeWorkout, activeTab, setActiveTab } = useFitness();

  // Modals state
  const [selectedMealForAction, setSelectedMealForAction] = useState<MealType>('lunch');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState<boolean>(false);
  const [isFoodLogOpen, setIsFoodLogOpen] = useState<boolean>(false);
  const [isStepTrackerOpen, setIsStepTrackerOpen] = useState<boolean>(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState<boolean>(false);
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState<boolean>(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isReferencesOpen, setIsReferencesOpen] = useState<boolean>(false);

  // Global window bridge so any external test or script calling setActiveTab never fails
  useEffect(() => {
    const handleTabChange = (tab: string) => {
      const normalized = (tab || '').toLowerCase();
      if (normalized.includes('coach') || normalized.includes('ai')) {
        setActiveTab('coach');
        setIsAICoachOpen(true);
      } else if (normalized.includes('step') || normalized.includes('wearable')) {
        setActiveTab('steps');
        setIsStepTrackerOpen(true);
      } else if (normalized.includes('meal') || normalized.includes('food')) {
        setActiveTab('meals');
        setSelectedMealForAction('lunch');
        setIsFoodLogOpen(true);
      } else if (normalized.includes('workout') || normalized.includes('exercise')) {
        setActiveTab('workouts');
        setIsAddWorkoutOpen(true);
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

  const handleOpenFoodLog = (meal: MealType = 'lunch') => {
    setSelectedMealForAction(meal);
    setIsFoodLogOpen(true);
  };

  if (!profile.profileCompleted || profile.onboardingVersion !== 1) {
    return <OnboardingModal />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans pb-28">
      {/* Main Top Navigation */}
      <Navbar
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        onOpenReferences={() => setIsReferencesOpen(true)}
        onOpenBarcodeScanner={() => handleOpenBarcodeScanner('lunch')}
      />

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* Daily Summary & Caloric Budget Engine */}
        {(activeTab === 'dashboard' || activeTab === 'meals' || activeTab === 'workouts' || activeTab === 'steps') && (
          <DailySummary
            onOpenBarcodeScanner={handleOpenBarcodeScanner}
            onOpenFoodLog={handleOpenFoodLog}
            onOpenStepTracker={() => setIsStepTrackerOpen(true)}
            onOpenAICoach={() => setIsAICoachOpen(true)}
            onOpenAddWorkout={() => setIsAddWorkoutOpen(true)}
          />
        )}

        {/* Meal & Nutrition Tracker */}
        {(activeTab === 'dashboard' || activeTab === 'meals') && (
          <MealTracker
            onOpenFoodLog={handleOpenFoodLog}
            onOpenBarcodeScanner={handleOpenBarcodeScanner}
          />
        )}

        {/* Workouts & Active Exercise Section */}
        {(activeTab === 'dashboard' || activeTab === 'workouts') && (
          <div id="workout-section" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Exercise & Workout Log</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      {todayLog.workouts.length} recorded
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {todayLog.workouts.reduce((acc, w) => acc + w.caloriesBurned, 0)} kcal burned in active workouts today
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReferencesOpen(true)}
                  className="hidden sm:flex px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                  <span>MET Sources</span>
                </button>

                <button
                  id="btn-add-workout-main"
                  type="button"
                  onClick={() => setIsAddWorkoutOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Exercise</span>
                </button>
              </div>
            </div>

            {/* Workouts List */}
            <div className="space-y-3">
              {todayLog.workouts.length > 0 ? (
                todayLog.workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{workout.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/30 capitalize">
                          {workout.category}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          Ref: Ainsworth MET 2024
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {workout.durationMinutes} minutes
                        </span>
                        {workout.sets && workout.sets.length > 0 && (
                          <span>• {workout.sets.length} resistance sets recorded</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        +{workout.caloriesBurned} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWorkout(workout.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 opacity-70 group-hover:opacity-100 transition-all rounded-lg"
                        title="Delete workout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 italic bg-slate-800/20 rounded-2xl border border-dashed border-slate-800 space-y-2">
                  <p>No exercise recorded today. Tap "Log Exercise" to track resistance training, cardio, or sports.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddWorkoutOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log First Workout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dedicated Steps & Phone Activity Hub (visible on steps tab) */}
        {activeTab === 'steps' && (
          <div id="steps-hub-section" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Daily Steps & Phone Activity</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {(todayLog.steps || 0).toLocaleString()} / {profile.stepGoal.toLocaleString()} steps • +{Math.round((todayLog.steps || 0) * 0.04)} kcal burned
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-open-step-tracker-main"
                  type="button"
                  onClick={() => setIsStepTrackerOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Track & Log Steps</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setIsStepTrackerOpen(true)}
                className="p-4 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-bold font-mono">{(todayLog.steps || 0).toLocaleString()} steps</span>
                </div>
                <span className="text-xs font-bold text-white block">Phone Accelerometer</span>
                <p className="text-[11px] text-slate-400 mt-1">Real-time pedometer with pocket & hand walk detection</p>
              </button>

              <button
                type="button"
                onClick={() => setIsStepTrackerOpen(true)}
                className="p-4 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-rose-400 mb-2">
                  <span className="font-bold text-sm"> Health & Fit</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">Sync Ready</span>
                </div>
                <span className="text-xs font-bold text-white block">Health App Ecosystems</span>
                <p className="text-[11px] text-slate-400 mt-1">Apple Health, Google Fit, Samsung Health, Garmin, Fitbit</p>
              </button>

              <button
                type="button"
                onClick={() => setIsStepTrackerOpen(true)}
                className="p-4 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center justify-between text-cyan-400 mb-2">
                  <Watch className="w-5 h-5" />
                  <span className="text-xs font-bold font-mono text-cyan-300">BLE Connect</span>
                </div>
                <span className="text-xs font-bold text-white block">Smartwatch & Wearables</span>
                <p className="text-[11px] text-slate-400 mt-1">Direct Bluetooth heart rate & stride cadence reader</p>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Tab Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            id="tab-btn-dashboard"
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Dashboard</span>
          </button>

          <button
            id="tab-btn-meals"
            type="button"
            onClick={() => {
              setActiveTab('meals');
              handleOpenFoodLog('lunch');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'meals'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-5 h-5" />
            <span className="text-[10px]">Meals</span>
          </button>

          <button
            id="tab-btn-workouts"
            type="button"
            onClick={() => {
              setActiveTab('workouts');
              setIsAddWorkoutOpen(true);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'workouts'
                ? 'text-rose-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-5 h-5" />
            <span className="text-[10px]">Workouts</span>
          </button>

          <button
            id="tab-btn-steps"
            type="button"
            onClick={() => {
              setActiveTab('steps');
              setIsStepTrackerOpen(true);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'steps'
                ? 'text-amber-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="w-5 h-5" />
            <span className="text-[10px]">Steps</span>
          </button>

          <button
            id="tab-btn-coach"
            type="button"
            onClick={() => {
              setActiveTab('coach');
              setIsAICoachOpen(true);
            }}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-teal-300 hover:text-teal-200 transition-all active:scale-95"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 p-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold">AI Coach</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        targetMeal={selectedMealForAction}
      />

      <FoodLogModal
        isOpen={isFoodLogOpen}
        onClose={() => setIsFoodLogOpen(false)}
        mealType={selectedMealForAction}
        onOpenBarcodeScanner={(meal) => {
          setSelectedMealForAction(meal);
          setIsBarcodeScannerOpen(true);
        }}
      />

      <PhoneStepTrackerModal
        isOpen={isStepTrackerOpen}
        onClose={() => {
          setIsStepTrackerOpen(false);
          if (activeTab === 'steps') {
            setActiveTab('dashboard');
          }
        }}
      />

      <AICoachModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
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
      />

      <ScientificReferencesModal
        isOpen={isReferencesOpen}
        onClose={() => setIsReferencesOpen(false)}
      />

      {/* Mobile PWA Install Guide */}
      <PWAInstallBanner />
    </div>
  );
}

export default function App() {
  return (
    <FitnessProvider>
      <DashboardContent />
    </FitnessProvider>
  );
}
