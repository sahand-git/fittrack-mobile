/* localized-render */
import { t, useLocale, localeTag } from "../utils/locale";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Footprints,
  Flame,
  X,
  Compass,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Activity,
  Smartphone,
  RefreshCw,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HealthConnection } from './HealthConnection';
import { useFitness } from '../context/FitnessContext';
import { PhonePedometer } from '../utils/pedometer';
import { calculateStepCalories } from '../utils/calculator';
import { formatDateDisplay } from '../utils/date';

interface PhoneStepTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const PhoneStepTrackerModal: React.FC<PhoneStepTrackerModalProps> = ({ isOpen, onClose }) => {
  useLocale();
  const { profile, todayLog, currentDate, updateSteps, updateProfile } = useFitness();

  const [activeTab, setActiveTab] = useState<'phone_sensor' | 'health_sync'>('phone_sensor');

  // Phone Accelerometer Sensor state
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [sensorStatus, setSensorStatus] = useState<string>('Ready to connect with mobile sensors');
  const [liveMagnitude, setLiveMagnitude] = useState<number>(9.8);
  const [sensitivity, setSensitivity] = useState<number>(11.2);
  const [customStepInput, setCustomStepInput] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nutrifit_motion_permission_granted') === 'true';
    } catch {
      return false;
    }
  });

  const pedometerRef = useRef<PhonePedometer | null>(null);

  // Initialize Pedometer
  useEffect(() => {
    pedometerRef.current = new PhonePedometer(
      (stepsAdded) => {
        updateSteps((prev) => prev + stepsAdded);
        if (navigator.vibrate) {
          try {
            navigator.vibrate(25);
          } catch (e) {}
        }
      },
      (magnitude) => {
        setLiveMagnitude(magnitude);
      }
    );

    return () => {
      if (pedometerRef.current) {
        pedometerRef.current.stop();
      }
    };
  }, []);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRequestMobilePermission = async () => {
    if (!pedometerRef.current) return;
    setSensorStatus('Requesting motion permission…');
    try {
      const granted = await pedometerRef.current.requestSensorPermission();
      setPermissionGranted(granted);
      if (!granted) {
        setSensorStatus('Motion access is unavailable or was denied. Use manual entry or the installed app for health access.');
        return;
      }
      pedometerRef.current.setSensitivity(sensitivity);
      const started = pedometerRef.current.start();
      setIsSensorActive(started);
      setSensorStatus(started
        ? 'Waiting for motion data — keep this page open while walking'
        : 'The motion sensor could not start. Your step total has not changed.');
    } catch {
      setPermissionGranted(false);
      setIsSensorActive(false);
      setSensorStatus('Motion access is unavailable or was denied. Use manual entry or the installed app for health access.');
    }
  };

  const handleToggleSensor = async () => {
    if (!pedometerRef.current) return;
    if (isSensorActive) {
      pedometerRef.current.stop();
      setIsSensorActive(false);
      setSensorStatus('Pedometer paused');
    } else {
      await handleRequestMobilePermission();
    }
  };

  const handleSensitivityChange = (val: number) => {
    setSensitivity(val);
    if (pedometerRef.current) {
      pedometerRef.current.setSensitivity(val);
    }
  };

  const handleAddSteps = (amount: number) => {
    updateSteps((prev) => Math.max(0, prev + amount));
  };

  const handleSetCustomSteps = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customStepInput, 10);
    if (!isNaN(val) && val >= 0) {
      updateSteps(val);
      setCustomStepInput('');
    }
  };

  const currentSteps = todayLog.steps || 0;
  const stepGoal = profile.stepGoal || 10000;
  const progressPercent = Math.min(100, Math.round((currentSteps / stepGoal) * 100));
  const burnedKcal = calculateStepCalories(currentSteps, profile.weightKg);
  const distanceKm = Math.round(currentSteps * 0.00078 * 10) / 10;
  const activeMinutes = Math.round(currentSteps / 100);

  if (!isOpen) return null;

  return (
    <div
      id="step-tracker-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="step-tracker-title"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="step-tracker-panel w-full max-w-lg min-h-0 bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 id="step-tracker-title" className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{t("Step Tracker & Health")}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                  📅 {formatDateDisplay(currentDate)}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">{t("Phone accelerometer & Health app sync")}</p>
            </div>
          </div>

          <button
            id="btn-close-step-modal"
            type="button"
            onClick={onClose}
            aria-label={t("Close Step Tracker")}
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="min-h-0 p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain flex-1">
          {/* Main Step Ring & Progress Card */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center relative overflow-hidden space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>
                {t("Total:")} <strong className="text-amber-600 font-black text-sm">{currentSteps.toLocaleString(localeTag())}</strong> / {stepGoal.toLocaleString(localeTag())}
              </span>
              <span className="text-amber-600 font-black font-mono">{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full"
              />
            </div>

            {/* Metrics Triad */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-center">
              <div className="p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs">
                <span className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-rose-500" />
                  {t("Burned")}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{burnedKcal} kcal</span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs">
                <span className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-teal-600" />
                  {t("Distance")}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{distanceKm} km</span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs">
                <span className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  {t("Active")}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">~{activeMinutes}m</span>
              </div>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('phone_sensor')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'phone_sensor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
              <span>{t("1. Phone Accelerometer")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('health_sync')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'health_sync'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
              <span>{t("2. Health App (Health Connect / Apple Health)")}</span>
            </button>
          </div>

          {/* TAB 1: Phone Accelerometer Sensor */}
          {activeTab === 'phone_sensor' && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSensorActive
                          ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                          : 'bg-slate-200/70 text-slate-500'
                      }`}
                    >
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{t("Accelerometer Detection")}</span>
                      <span className="text-[10px] text-slate-500">{t(sensorStatus)}</span>
                    </div>
                  </div>

                  <button
                    id="btn-toggle-motion-sensor"
                    type="button"
                    onClick={handleToggleSensor}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap ${
                      isSensorActive
                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {isSensorActive ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>{t("Stop")}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>{t("Start")}</span>
                      </>
                    )}
                  </button>
                </div>

                {isSensorActive && (
                  <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{t("Acceleration: ")}<strong className="text-teal-700">{liveMagnitude.toFixed(1)} m/s²</strong></span>
                      <span>{t("Threshold: ")}{sensitivity.toFixed(1)} m/s²</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                        style={{ left: `${Math.min(100, (sensitivity / 20) * 100)}%` }}
                      />
                      <motion.div
                        className="h-full bg-teal-500 transition-all duration-700"
                        style={{ width: `${Math.min(100, (liveMagnitude / 20) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sensitivity Slider */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>{t("Sensitivity threshold:")}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10.0}
                      max={14.0}
                      step={0.2}
                      value={sensitivity}
                      onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                      className="w-24 accent-teal-600 h-1.5"
                    />
                    <span className="font-mono text-teal-700 font-bold text-xs">{sensitivity.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Health Apps & Quick Presets */}
          {activeTab === 'health_sync' && (
            <div className="space-y-3">
              <HealthConnection />

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">{t("Manual Step Shortcuts")}</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddSteps(2000)}
                    className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center transition-colors active:scale-95 shadow-xs cursor-pointer"
                  >
                    <span className="text-xs font-extrabold text-amber-600 block">+2,000</span>
                    <span className="text-[10px] text-slate-500 font-medium block">{t("Short Walk")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddSteps(5000)}
                    className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center transition-colors active:scale-95 shadow-xs cursor-pointer"
                  >
                    <span className="text-xs font-extrabold text-amber-600 block">+5,000</span>
                    <span className="text-[10px] text-slate-500 font-medium block">{t("Long Walk")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddSteps(10000)}
                    className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center transition-colors active:scale-95 shadow-xs cursor-pointer"
                  >
                    <span className="text-xs font-extrabold text-emerald-600 block">+10,000</span>
                    <span className="text-[10px] text-slate-500 font-medium block">{t("Daily Goal")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Increment & Custom Step Input */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block">{t("Manual Step Entry")}</span>
            <div className="grid grid-cols-4 gap-2">
              {[+500, +1000, +2500, +5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAddSteps(amt)}
                  className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors active:scale-95 shadow-xs cursor-pointer"
                >
                  +{amt.toLocaleString(localeTag())}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <form onSubmit={handleSetCustomSteps} className="flex gap-2 pt-1">
              <input
                id="input-custom-steps"
                type="number"
                min={0}
                value={customStepInput}
                onChange={(e) => setCustomStepInput(e.target.value)}
                placeholder={t("Set exact step count...")}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all placeholder-slate-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
              >
                {t("Set Total")}
              </button>
            </form>
          </div>

          {/* Step Calorie Integration Setting */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-start">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 text-start">
                <span className="text-xs font-bold text-slate-900 block">{t("Add Step Burn to Calorie Budget?")}</span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {profile.includeStepsInCalorieBudget
                    ? t("Enabled (Burned calories are added to your daily eating allowance)")
                    : t("Disabled (Calories are tracked as pure deficit without expanding food budget)")}
                </p>
              </div>

              <div dir="ltr" className="inline-flex shrink-0 ms-3">
                <button
                  id="toggle-steps-calorie-budget-in-modal"
                  type="button"
                  onClick={() =>
                    updateProfile({
                      includeStepsInCalorieBudget: !profile.includeStepsInCalorieBudget
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    profile.includeStepsInCalorieBudget ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile.includeStepsInCalorieBudget ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar with Double Close Support */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between gap-3 z-20">
          <button
            id="btn-close-step-footer"
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <X className="w-4 h-4 text-slate-500" />
            <span>{t("Close")}</span>
          </button>

          <button
            id="btn-done-steps-modal"
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t("Done & Save")}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
