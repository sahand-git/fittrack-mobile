import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Footprints,
  Flame,
  X,
  Compass,
  Play,
  Pause,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  MapPin,
  Clock,
  Sparkles,
  Bluetooth,
  Activity,
  Heart,
  Watch,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HealthConnection } from './HealthConnection';
import { useFitness } from '../context/FitnessContext';
import { PhonePedometer } from '../utils/pedometer';
import { BluetoothWearableManager, WearableDeviceState } from '../utils/bluetoothWearable';
import { calculateStepCalories } from '../utils/calculator';

interface PhoneStepTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const PhoneStepTrackerModal: React.FC<PhoneStepTrackerModalProps> = ({ isOpen, onClose }) => {
  const { profile, todayLog, updateSteps, updateProfile } = useFitness();

  const [activeTab, setActiveTab] = useState<'phone_sensor' | 'health_sync' | 'bluetooth_wearable'>('phone_sensor');

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

  // Bluetooth Wearable state
  const [wearableState, setWearableState] = useState<WearableDeviceState>({
    connected: false,
    deviceName: null,
    heartRate: null,
    cadenceRpm: null,
    totalSteps: 0,
    lastUpdated: null
  });
  const [isConnectingBt, setIsConnectingBt] = useState<boolean>(false);
  const [btErrorMessage, setBtErrorMessage] = useState<string | null>(null);

  const pedometerRef = useRef<PhonePedometer | null>(null);
  const btManagerRef = useRef<BluetoothWearableManager | null>(null);

  // Initialize Pedometer and Bluetooth Manager
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

    btManagerRef.current = new BluetoothWearableManager((state) => {
      setWearableState(state);
      if (state.totalSteps > 0) {
        updateSteps((prev) => prev + 1);
      }
    });

    return () => {
      if (pedometerRef.current) {
        pedometerRef.current.stop();
      }
      if (btManagerRef.current) {
        btManagerRef.current.disconnect();
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

  const handleConnectBluetoothWearable = async () => {
    if (!btManagerRef.current) return;
    setIsConnectingBt(true);
    setBtErrorMessage(null);

    const result = await btManagerRef.current.connect();
    setIsConnectingBt(false);

    if (!result.success) {
      setBtErrorMessage(result.message);
    } else {
      try {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      } catch (e) {}
    }
  };

  const handleDisconnectBluetoothWearable = () => {
    if (btManagerRef.current) {
      btManagerRef.current.disconnect();
    }
  };

  const handleAddSteps = (amount: number) => {
    updateSteps((prev) => Math.max(0, prev + amount));
  };

  const handleSetCustomSteps = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customStepInput);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
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
        className="step-tracker-panel w-full max-w-lg min-h-0 bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header stays visible while the content scrolls. */}
        <div className="flex items-center justify-between gap-2 p-4 sm:p-5 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 id="step-tracker-title" className="text-base font-bold text-white flex flex-wrap items-center gap-2">
                <span>Step Tracker & Health</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">Phone steps, health connections & wearables</p>
            </div>
          </div>

          <button
            id="btn-close-step-modal"
            type="button"
            onClick={onClose}
            aria-label="Close Step Tracker"
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="min-h-0 p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain flex-1">
          {/* Main Step Ring & Progress Card */}
          <div className="bg-slate-800/60 border border-slate-800 p-2.5 rounded-xl text-center relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-white">
                  Today: <strong className="text-amber-400 text-sm font-black">{currentSteps.toLocaleString()}</strong> / {stepGoal.toLocaleString()}
                </span>
                <span className="text-amber-400 font-bold">{progressPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full"
                />
              </div>

              {/* Metrics Triad */}
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-700/60 text-center">
                <div className="p-1 rounded bg-slate-900/60">
                  <span className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 text-rose-400" />
                    Calories
                  </span>
                  <span className="text-xs font-bold text-white block">{burnedKcal} kcal</span>
                </div>

                <div className="p-1 rounded bg-slate-900/60">
                  <span className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                    Distance
                  </span>
                  <span className="text-xs font-bold text-white block">{distanceKm} km</span>
                </div>

                <div className="p-1 rounded bg-slate-900/60">
                  <span className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-emerald-400" />
                    Active Time
                  </span>
                  <span className="text-xs font-bold text-white block">~{activeMinutes}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('phone_sensor')}
              className={`flex-1 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'phone_sensor'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>1. Phone Sensor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('health_sync')}
              className={`flex-1 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'health_sync'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>2. Health Apps</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bluetooth_wearable')}
              className={`flex-1 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'bluetooth_wearable'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Watch className="w-3 h-3" />
              <span>3. Watch</span>
            </button>
          </div>

          {/* TAB 1: Phone Accelerometer Sensor */}
          {activeTab === 'phone_sensor' && (
            <div className="space-y-2.5">
              <div className="bg-slate-800/50 border border-slate-800 p-3 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSensorActive
                          ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                          : 'bg-slate-700/40 text-slate-400'
                      }`}
                    >
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Accelerometer Detection</span>
                      <span className="text-[10px] text-slate-400">{sensorStatus}</span>
                    </div>
                  </div>

                  <button
                    id="btn-toggle-motion-sensor"
                    type="button"
                    onClick={handleToggleSensor}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isSensorActive
                        ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-sm'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                    }`}
                  >
                    {isSensorActive ? (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                </div>

                {(isSensorActive) && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Acceleration: <strong className="text-emerald-400">{liveMagnitude.toFixed(1)} m/s²</strong></span>
                      <span>Threshold: {sensitivity.toFixed(1)} m/s²</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700 relative">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                        style={{ left: `${Math.min(100, (sensitivity / 20) * 100)}%` }}
                      />
                      <motion.div
                        className="h-full bg-emerald-500 transition-all duration-75"
                        style={{ width: `${Math.min(100, (liveMagnitude / 20) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sensitivity Slider */}
                <div className="pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Sensitivity threshold:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10.0}
                      max={14.0}
                      step={0.2}
                      value={sensitivity}
                      onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                      className="w-24 accent-amber-500 h-1.5"
                    />
                    <span className="font-mono text-amber-400 text-xs">{sensitivity.toFixed(1)}</span>
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
                <span className="text-[11px] font-semibold text-slate-300 block">Manual Step Shortcuts</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddSteps(2000)}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-center transition-colors active:scale-95"
                  >
                    <span className="text-xs font-bold text-amber-400 block">+2,000</span>
                    <span className="text-[9px] text-slate-400 block">Short Walk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddSteps(5000)}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-center transition-colors active:scale-95"
                  >
                    <span className="text-xs font-bold text-amber-400 block">+5,000</span>
                    <span className="text-[9px] text-slate-400 block">Long Walk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddSteps(10000)}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-center transition-colors active:scale-95"
                  >
                    <span className="text-xs font-bold text-emerald-400 block">+10,000</span>
                    <span className="text-[9px] text-slate-400 block">Daily Goal</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Bluetooth Smart Wearable */}
          {activeTab === 'bluetooth_wearable' && (
            <div className="bg-slate-800/50 border border-slate-800 p-3 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      wearableState.connected
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-700/40 text-slate-400'
                    }`}
                  >
                    <Bluetooth className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {wearableState.connected ? wearableState.deviceName : 'Bluetooth BLE Wearable'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {wearableState.connected
                        ? `Connected • Last sync: ${wearableState.lastUpdated || 'just now'}`
                        : 'Garmin, Polar, Apple Companion, Mi Band'}
                    </span>
                  </div>
                </div>

                {wearableState.connected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectBluetoothWearable}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 active:scale-95"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    id="btn-pair-bluetooth-wearable"
                    type="button"
                    onClick={handleConnectBluetoothWearable}
                    disabled={isConnectingBt}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm flex items-center gap-1 transition-all active:scale-95"
                  >
                    <Bluetooth className="w-3 h-3" />
                    <span>{isConnectingBt ? 'Searching...' : 'Pair'}</span>
                  </button>
                )}
              </div>

              {btErrorMessage && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{btErrorMessage}</span>
                </div>
              )}

              {/* Wearable live telemetry cards */}
              {wearableState.connected && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/60">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
                      <Heart className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
                      Live Heart Rate
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {wearableState.heartRate ? `${wearableState.heartRate} BPM` : 'Reading...'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
                      <Activity className="w-2.5 h-2.5 text-cyan-400" />
                      Cadence / Stride
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {wearableState.cadenceRpm ? `${wearableState.cadenceRpm} RPM` : 'Active'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Increment & Custom Step Input */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-300 block">Manual Step Entry</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[+500, +1000, +2500, +5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAddSteps(amt)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors active:scale-95"
                >
                  +{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <form onSubmit={handleSetCustomSteps} className="flex gap-1.5 pt-0.5">
              <input
                id="input-custom-steps"
                type="number"
                min={0}
                value={customStepInput}
                onChange={(e) => setCustomStepInput(e.target.value)}
                placeholder="Set exact step count..."
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors active:scale-95"
              >
                Set Total
              </button>
            </form>
          </div>

          {/* Step Calorie Integration Setting */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Add Step Burn to Calorie Budget?</span>
                <p className="text-[10px] text-slate-400">
                  {profile.includeStepsInCalorieBudget
                    ? `YES (+${burnedKcal} kcal added to daily food budget)`
                    : `NO (Logged as pure deficit)`}
                </p>
              </div>

              <button
                id="toggle-steps-calorie-budget-in-modal"
                type="button"
                onClick={() =>
                  updateProfile({
                    includeStepsInCalorieBudget: !profile.includeStepsInCalorieBudget
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  profile.includeStepsInCalorieBudget ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    profile.includeStepsInCalorieBudget ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar with Double Close Support */}
        <div className="p-2.5 sm:p-3 border-t border-slate-800 bg-slate-900 shrink-0 flex items-center justify-between gap-2 z-20">
          <button
            id="btn-close-step-footer"
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Close</span>
          </button>

          <button
            id="btn-done-steps-modal"
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Done & Save</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
