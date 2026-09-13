import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  DayLog,
  FoodItem,
  WorkoutEntry,
  MealType,
  WeightEntry,
  AICoachReport,
  LoggedSupplement
} from '../types';
import { calculateTargets, calculateStepCalories, shouldUpdateCurrentWeight } from '../utils/calculator';
import { VERIFIED_FOOD_DATABASE } from '../data/foodDatabase';
import { getTodayDateString } from '../utils/date';
import { exportBackupFile } from '../utils/backup';
import { accountStorageKeys, clearAccountStorage } from '../utils/account';
import { parseBackup, serializeBackup, nextRevision, type CloudSnapshot } from '../utils/cloudBackupCore';
import { readCloudBackup, writeCloudBackup } from '../utils/cloudBackup';

import { createLoggedFood } from '../utils/nutrition';
import { readStoredJSON, persistStoredJSON, persistRestore, collectCorruptRecovery } from '../utils/storage';
import { useAIStatus } from '../utils/gemini';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  gender: 'male',
  age: 26,
  heightCm: 175,
  weightKg: 75,
  targetWeightKg: 70,
  activityLevel: 'moderate',
  goal: 'fat_loss_moderate',
  includeStepsInCalorieBudget: false,
  stepGoal: 10000,
  waterGoalMl: 2500,
  bmr: 1714,
  tdee: 2657,
  targetCalories: 2357,
  targetProtein: 150,
  targetCarbs: 275,
  targetFat: 73,
  profileCompleted: false,
  isGoogleConnected: false,
  isPremium: false
};

export const createEmptyDayLog = (date: string): DayLog => ({
  date,
  meals: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  },
  waterMl: 0,
  steps: 0,
  stepCaloriesBurned: 0,
  workouts: [],
  supplements: []
});

interface FitnessContextType {
  profile: UserProfile;
  dailyLogs: Record<string, DayLog>;
  currentDate: string;
  todayLog: DayLog;
  customFoods: FoodItem[];
  allFoodDatabase: FoodItem[];
  weightHistory: WeightEntry[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setCurrentDate: (date: string) => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  completeOnboarding: (newProfile: UserProfile) => void;
  logFood: (mealType: MealType, food: FoodItem, servingsCount: number) => void;
  removeLoggedFood: (mealType: MealType, logId: string) => void;
  addCustomFood: (food: Omit<FoodItem, 'id'>) => FoodItem;
  addWorkout: (workout: Omit<WorkoutEntry, 'id' | 'loggedAt'>) => void;
  removeWorkout: (workoutId: string) => void;
  logSupplement: (supplement: Omit<LoggedSupplement, 'id' | 'loggedAt'>) => void;
  updateSupplement: (supplementId: string, updates: Partial<LoggedSupplement>) => void;
  removeSupplement: (supplementId: string) => void;
  setDailySupplements: (supplements: LoggedSupplement[]) => void;
  updateWater: (deltaMl: number) => void;
  setWaterAmount: (amountMl: number) => void;
  updateSteps: (stepsOrUpdater: number | ((prev: number) => number)) => void;
  addWeightEntry: (weightKg: number, bodyFat?: number, note?: string) => void;
  saveDayAIReport: (report: AICoachReport) => void;
  connectGoogleAccount: (email: string, name?: string) => Promise<boolean>;
  disconnectGoogleAccount: () => void;
  resetAccountAndData: () => void;
  syncWithCloud: () => Promise<void>;
  cloudSnapshot: CloudSnapshot | null | undefined;
  cloudHasLocalChanges: boolean;
  refreshCloudBackup: () => Promise<void>;
  restoreCloudBackup: () => Promise<void>;
  hasRecoveryBackup: boolean;
  exportRecoveryBackupJSON: () => Promise<'share' | 'download'>;
  exportBackupJSON: () => Promise<'share' | 'download'>;
  getBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => boolean;
  isPremium: boolean;
  exportCorruptRecoveryJSON: () => Promise<'share' | 'download'>;
  hasCorruptRecoveryBackup: boolean;
  storageError: string | null;
  retryStoragePersistence: () => void;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

export const FitnessProvider: React.FC<{ children: React.ReactNode; accountId?: string; accountName?: string; accountEmail?: string }> = ({ children, accountId, accountName, accountEmail }) => {
  const keys = accountStorageKeys(accountId);
  const STORAGE_KEY_PROFILE = keys.profile;
  const STORAGE_KEY_LOGS = keys.logs;
  const STORAGE_KEY_CUSTOM_FOODS = keys.foods;
  const STORAGE_KEY_WEIGHTS = keys.weights;
  const initialReadError = useRef<string | null>(null);
  const readInitial = <T,>(key: string, fallback: T, validate: (value: unknown) => boolean): T => {
    const result = readStoredJSON(localStorage, key, fallback, validate);
    if (result.error) initialReadError.current = result.error;
    return result.value;
  };
  const [profile, setProfile] = useState<UserProfile>(() => {
    const parsed = readInitial(STORAGE_KEY_PROFILE, DEFAULT_PROFILE, value => !!value && typeof value === 'object' && !Array.isArray(value) && typeof (value as UserProfile).weightKg === 'number');
    return {...DEFAULT_PROFILE, ...parsed, name: parsed.name || accountName || '', email: parsed.email || accountEmail || '', isPremium: false,
      profileCompleted: parsed.profileCompleted === true && parsed.onboardingVersion === 1};
  });
  const [dailyLogs, setDailyLogs] = useState<Record<string, DayLog>>(() => readInitial(STORAGE_KEY_LOGS,
    {[getTodayDateString()]: createEmptyDayLog(getTodayDateString())}, value => !!value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every((day: any) => day && day.meals && ['breakfast','lunch','dinner','snack'].every(meal => Array.isArray(day.meals[meal])) && Array.isArray(day.workouts))));
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => readInitial(STORAGE_KEY_CUSTOM_FOODS, [], value => Array.isArray(value) && value.every(food => food && typeof food.id === 'string' && typeof food.name === 'string' && ['calories','protein','carbs','fat','servingGrams'].every(key => typeof food[key] === 'number' && Number.isFinite(food[key]) && food[key] >= 0))));
  const customFoodsRef = useRef(customFoods);
  customFoodsRef.current = customFoods;
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(() => readInitial(STORAGE_KEY_WEIGHTS, [], value => Array.isArray(value) && value.every(entry => entry && typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && typeof entry.weightKg === 'number' && Number.isFinite(entry.weightKg) && entry.weightKg > 0)));
  const recoveryDataKeys = [keys.profile, keys.logs, keys.foods, keys.weights, keys.supplementRoutine];
  const checkCorruptRecovery = () => {
    try { return Object.keys(collectCorruptRecovery(localStorage, recoveryDataKeys)).length > 0; } catch { return false; }
  };
  const [hasCorruptRecoveryBackup, setHasCorruptRecoveryBackup] = useState(checkCorruptRecovery);
  if (hasCorruptRecoveryBackup && !initialReadError.current) initialReadError.current = 'Original recovery copies are retained on this device. Export the recovery data before clearing browser storage.';
  const [storageError, setStorageError] = useState<string | null>(initialReadError.current);
  const failedWrites = useRef(new Set<string>());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cloudSnapshot, setCloudSnapshot] = useState<CloudSnapshot | null | undefined>(undefined);
  const [backedUpContent, setBackedUpContent] = useState<string | null>(null);
  const busyRef = useRef(false);
  const recoveryKey = STORAGE_KEY_PROFILE + '_before_restore';
  const [hasRecoveryBackup, setHasRecoveryBackup] = useState(() => {
    try { return Boolean(localStorage.getItem(recoveryKey)); } catch { return false; }
  });
  const readRoutineContent = () => {
    try { return localStorage.getItem(keys.supplementRoutine) || '[]'; } catch { return 'unavailable'; }
  };
  const [routineContent, setRoutineContent] = useState(readRoutineContent);
  useEffect(() => {
    const refresh = () => setRoutineContent(readRoutineContent());
    window.addEventListener('calorie-pewar-routine-change', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('calorie-pewar-routine-change', refresh); window.removeEventListener('storage', refresh); };
  }, [keys.supplementRoutine]);
  const localContent = JSON.stringify({ profile, dailyLogs, customFoods, weightHistory, routineContent });
  const cloudHasLocalChanges = backedUpContent !== localContent;
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const persist = (key: string, value: unknown) => {
    try { persistStoredJSON(localStorage, key, value); failedWrites.current.delete(key); }
    catch { failedWrites.current.add(key); }
    setHasCorruptRecoveryBackup(checkCorruptRecovery());
    setStorageError(failedWrites.current.size ? 'Changes are not saved on this device. Keep this page open, export a backup, free storage space and retry.' : initialReadError.current);
  };
  const retryStoragePersistence = () => {
    persist(STORAGE_KEY_PROFILE, profile); persist(STORAGE_KEY_LOGS, dailyLogs);
    persist(STORAGE_KEY_CUSTOM_FOODS, customFoods); persist(STORAGE_KEY_WEIGHTS, weightHistory);
  };
  useEffect(() => { persist(STORAGE_KEY_PROFILE, profile); }, [profile]);
  useEffect(() => { persist(STORAGE_KEY_LOGS, dailyLogs); }, [dailyLogs]);
  useEffect(() => { persist(STORAGE_KEY_CUSTOM_FOODS, customFoods); }, [customFoods]);
  useEffect(() => { persist(STORAGE_KEY_WEIGHTS, weightHistory); }, [weightHistory]);

  // Combined searchable food database
  const allFoodDatabase = [...customFoods, ...VERIFIED_FOOD_DATABASE];

  // Active day's log object
  const todayLog = dailyLogs[currentDate] || createEmptyDayLog(currentDate);

  const cloudAction = async (action: () => Promise<void>) => {
    if (busyRef.current) throw new Error('A cloud operation is already in progress.');
    busyRef.current = true; setIsSyncing(true);
    try { await action(); } finally { busyRef.current = false; setIsSyncing(false); }
  };
  useEffect(() => {
    if (!accountId) {
      setCloudSnapshot(null);
      return;
    }
    let isCurrent = true;
    readCloudBackup(accountId)
      .then(snapshot => {
        if (!isCurrent) return;
        setCloudSnapshot(snapshot);
        if (snapshot) {
          setLastSyncedAt(snapshot.updatedAt);
        }
      })
      .catch(err => {
        console.warn('Auto cloud check notice:', err);
        if (isCurrent) setCloudSnapshot(null);
      });
    return () => { isCurrent = false; };
  }, [accountId]);

  const refreshCloudBackup = () => cloudAction(async () => {
    setCloudSnapshot(undefined);
    setCloudSnapshot(await readCloudBackup(accountId));
  });
  const syncWithCloud = () => cloudAction(async () => {
    let currentSnap = cloudSnapshot;
    if (currentSnap === undefined) {
      try {
        currentSnap = await readCloudBackup(accountId);
        setCloudSnapshot(currentSnap);
      } catch (err) {
        console.warn('Could not read existing backup before sync', err);
      }
    }
    const content = localContent;
    const result = await writeCloudBackup(accountId, JSON.parse(getBackupJSON()), currentSnap?.revision ?? null);
    setCloudSnapshot(result); setLastSyncedAt(result.updatedAt); setBackedUpContent(content);
  });
  const restoreCloudBackup = () => cloudAction(async () => {
    if (!cloudSnapshot) throw new Error('Check cloud backup and select an existing backup first.');
    const latest = await readCloudBackup(accountId);
    nextRevision(cloudSnapshot.revision, latest?.revision ?? null);
    if (!latest || !importBackupJSON(latest.payload)) throw new Error('Restore could not save safely on this device. Free storage space, export your data, and try again.');
    const restored = parseBackup(latest.payload);
    setCloudSnapshot(latest); setLastSyncedAt(latest.updatedAt);
    setBackedUpContent(JSON.stringify({profile:restored.profile,dailyLogs:restored.dailyLogs,customFoods:restored.customFoods,weightHistory:restored.weightHistory,routineContent:JSON.stringify(restored.settings?.supplementRoutine ?? JSON.parse(readRoutineContent()))}));
  });
  const connectGoogleAccount = async (_email: string, _name?: string) => false;
  const disconnectGoogleAccount = () => { setProfile(prev => ({ ...prev, isGoogleConnected: false })); };

  const resetAccountAndData = () => {
    try {
      clearAccountStorage(localStorage, accountId);
    } catch (e) {
      setStorageError('Some device data could not be removed. Please retry.');
      throw e;
    }
    setHasRecoveryBackup(false);
    setHasCorruptRecoveryBackup(false);
    initialReadError.current = null;
    setStorageError(null);
    setRoutineContent('[]');
    setProfile(DEFAULT_PROFILE);
    setDailyLogs({ [getTodayDateString()]: createEmptyDayLog(getTodayDateString()) });
    setCustomFoods([]);
    setWeightHistory([]);
    setLastSyncedAt(null);
    setBackedUpContent(null);
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setProfile(prev => {
      const merged = { ...prev, ...updated };
      const targets = calculateTargets(
        merged.gender,
        merged.weightKg,
        merged.heightCm,
        merged.age,
        merged.activityLevel,
        merged.goal
      );
      return {
        ...merged,
        bmr: targets.bmr,
        tdee: targets.tdee,
        targetCalories: targets.targetCalories,
        targetProtein: targets.targetProtein,
        targetCarbs: targets.targetCarbs,
        targetFat: targets.targetFat
      };
    });
  };

  const completeOnboarding = (newProfile: UserProfile) => {
    const targets = calculateTargets(
      newProfile.gender,
      newProfile.weightKg,
      newProfile.heightCm,
      newProfile.age,
      newProfile.activityLevel,
      newProfile.goal
    );
    const finalized: UserProfile = {
      ...newProfile,
      bmr: targets.bmr,
      tdee: targets.tdee,
      targetCalories: targets.targetCalories,
      targetProtein: targets.targetProtein,
      targetCarbs: targets.targetCarbs,
      targetFat: targets.targetFat,
      profileCompleted: true,
      onboardingVersion: 1
    };
    setProfile(finalized);
    setWeightHistory(prev => [{ date: getTodayDateString(), weightKg: finalized.weightKg }, ...prev.filter(w => w.date !== getTodayDateString())]);
  };

  const logFood = (mealType: MealType, food: FoodItem, servingsCount: number) => {
    if (currentDate > getTodayDateString()) {
      return;
    }
    const loggedItem = createLoggedFood(food, mealType, servingsCount,
      'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    setDailyLogs(prev => {
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      const updatedMeals = {
        ...day.meals,
        [mealType]: [loggedItem, ...day.meals[mealType]]
      };
      return {
        ...prev,
        [currentDate]: {
          ...day,
          meals: updatedMeals
        }
      };
    });
  };

  const removeLoggedFood = (mealType: MealType, logId: string) => {
    setDailyLogs(prev => {
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      const updatedMeals = {
        ...day.meals,
        [mealType]: day.meals[mealType].filter(item => item.id !== logId)
      };
      return {
        ...prev,
        [currentDate]: {
          ...day,
          meals: updatedMeals
        }
      };
    });
  };

  const addCustomFood = (foodData: Omit<FoodItem, 'id'>): FoodItem => {
    const newFood: FoodItem = {
      ...foodData,
      id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      source: foodData.source || 'custom'
    };
    const next = [newFood, ...customFoodsRef.current.filter(f =>
      f.barcode && newFood.barcode ? f.barcode !== newFood.barcode : f.name !== newFood.name)];
    try {
      persistStoredJSON(localStorage, STORAGE_KEY_CUSTOM_FOODS, next);
    } catch {
      throw new Error('Could not save this food on your phone. Free some storage space and try again.');
    }
    customFoodsRef.current = next;
    setCustomFoods(next);

    return newFood;
  };

  const addWorkout = (workoutData: Omit<WorkoutEntry, 'id' | 'loggedAt'>) => {
    if (currentDate > getTodayDateString()) {
      return;
    }
    const workout: WorkoutEntry = {
      ...workoutData,
      id: 'wo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDailyLogs(prev => {
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      return {
        ...prev,
        [currentDate]: {
          ...day,
          workouts: [workout, ...day.workouts]
        }
      };
    });
  };

  const removeWorkout = (workoutId: string) => {
    setDailyLogs(prev => {
      const next: Record<string, DayLog> = {};
      for (const dateKey of Object.keys(prev)) {
        const day = prev[dateKey];
        if (day && day.workouts && day.workouts.some(w => w.id === workoutId)) {
          next[dateKey] = {
            ...day,
            workouts: day.workouts.filter(w => w.id !== workoutId)
          };
        } else if (day) {
          next[dateKey] = day;
        }
      }
      if (!next[currentDate]) {
        const day = prev[currentDate] || createEmptyDayLog(currentDate);
        next[currentDate] = {
          ...day,
          workouts: day.workouts.filter(w => w.id !== workoutId)
        };
      }
      return next;
    });
  };

  const logSupplement = (suppData: Omit<LoggedSupplement, 'id' | 'loggedAt'>) => {
    if (currentDate > getTodayDateString()) {
      return;
    }
    const supplement: LoggedSupplement = {
      ...suppData,
      id: 'supp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDailyLogs(prev => {
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      const updated = [supplement, ...(day.supplements || [])];
      return {
        ...prev,
        [currentDate]: {
          ...day,
          supplements: updated
        }
      };
    });
  };

  const updateSupplement = (supplementId: string, updates: Partial<LoggedSupplement>) => {
    setDailyLogs(prev => {
      const day = prev[currentDate];
      if (!day || !day.supplements) return prev;
      return {
        ...prev,
        [currentDate]: {
          ...day,
          supplements: day.supplements.map(s => (s.id === supplementId ? { ...s, ...updates } : s))
        }
      };
    });
  };

  const removeSupplement = (supplementId: string) => {
    setDailyLogs(prev => {
      const day = prev[currentDate];
      if (!day || !day.supplements) return prev;
      return {
        ...prev,
        [currentDate]: {
          ...day,
          supplements: day.supplements.filter(s => s.id !== supplementId)
        }
      };
    });
  };

  const setDailySupplements = (supplements: LoggedSupplement[]) => {
    if (currentDate > getTodayDateString()) {
      return;
    }
    setDailyLogs(prev => {
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      return {
        ...prev,
        [currentDate]: {
          ...day,
          supplements
        }
      };
    });
  };

  const safeSetCurrentDate = (date: string) => {
    const today = getTodayDateString();
    if (date > today) {
      setCurrentDate(today);
      return;
    }
    setCurrentDate(date);
  };

  const updateWater = (deltaMl: number) => {
    if (currentDate > getTodayDateString()) {
      return;
    }
    setDailyLogs(prev => {
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      const newWater = Math.max(0, day.waterMl + deltaMl);
      return {
        ...prev,
        [currentDate]: {
          ...day,
          waterMl: newWater
        }
      };
    });
  };

  const setWaterAmount = (amountMl: number) => {
    if (currentDate > getTodayDateString()) {
      return;
    }
    setDailyLogs(prev => {
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      return {
        ...prev,
        [currentDate]: {
          ...day,
          waterMl: Math.max(0, amountMl)
        }
      };
    });
  };

  const updateSteps = (stepsOrUpdater: number | ((prev: number) => number)) => {
    if (currentDate > getTodayDateString()) {
      return;
    }
    setDailyLogs(prev => {
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      const newSteps = typeof stepsOrUpdater === 'function' ? stepsOrUpdater(day.steps) : stepsOrUpdater;
      const validSteps = Math.max(0, newSteps);
      const burned = calculateStepCalories(validSteps, profile.weightKg);
      return {
        ...prev,
        [currentDate]: {
          ...day,
          steps: validSteps,
          stepCaloriesBurned: burned
        }
      };
    });
  };

  const addWeightEntry = (weightKg: number, bodyFat?: number, note?: string) => {
    if (currentDate > getTodayDateString()) {
      return;
    }
    const entry: WeightEntry = {
      date: currentDate,
      weightKg: Math.round(weightKg * 10) / 10,
      bodyFatPercent: bodyFat,
      note
    };
    setWeightHistory(prev => [entry, ...prev.filter(w => w.date !== currentDate)]);
    if (shouldUpdateCurrentWeight(weightHistory, currentDate)) updateProfile({ weightKg: entry.weightKg });
  };

  const saveDayAIReport = (report: AICoachReport) => {
    setDailyLogs(prev => {
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      return {
        ...prev,
        [currentDate]: {
          ...day,
          aiReport: report
        }
      };
    });
  };

  const getBackupJSON = () => {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      profile,
      dailyLogs,
      customFoods,
      weightHistory,
      settings: { supplementRoutine: JSON.parse(localStorage.getItem(keys.supplementRoutine) || '[]') }
    };
    return serializeBackup(data, false);
  };
  const exportBackupJSON = () => exportBackupFile(getBackupJSON());

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const parsed = parseBackup(jsonStr);
      // Retain a complete pre-restore copy before changing any existing local data.
      const previous = getBackupJSON();
      const writes = [[STORAGE_KEY_PROFILE, parsed.profile], [STORAGE_KEY_LOGS, parsed.dailyLogs], [STORAGE_KEY_CUSTOM_FOODS, parsed.customFoods], [STORAGE_KEY_WEIGHTS, parsed.weightHistory], ...(parsed.settings?.supplementRoutine ? [[keys.supplementRoutine, parsed.settings.supplementRoutine] as const] : [])] as const;
      persistRestore(localStorage, recoveryKey, previous, writes);
      setHasRecoveryBackup(true);
      setProfile(parsed.profile); setDailyLogs(parsed.dailyLogs);
      setCustomFoods(parsed.customFoods); customFoodsRef.current = parsed.customFoods;
      setWeightHistory(parsed.weightHistory);
      setRoutineContent(readRoutineContent());
      window.dispatchEvent(new Event('calorie-pewar-routine-change'));
      return true;
    } catch (err) {
      try { setHasRecoveryBackup(Boolean(localStorage.getItem(recoveryKey))); } catch { /* Storage unavailable. */ }
      console.error('Import backup failed:', err);
      return false;
    }
  };
  const exportRecoveryBackupJSON = () => {
    const recovery = localStorage.getItem(recoveryKey);
    if (!recovery) throw new Error('No pre-restore copy is available.');
    return exportBackupFile(recovery);
  };

  const exportCorruptRecoveryJSON = () => {
    const records = collectCorruptRecovery(localStorage, recoveryDataKeys);
    if (!Object.keys(records).length) throw new Error('No damaged-data recovery copy is available.');
    return exportBackupFile(JSON.stringify({format: 'calorie-pewar-raw-recovery', exportedAt: new Date().toISOString(), records}, null, 2));
  };

  const aiStatus = useAIStatus();
  const isPremium = aiStatus.isPremium;

  return (
    <FitnessContext.Provider
      value={{
        profile,
        dailyLogs,
        currentDate,
        todayLog,
        customFoods,
        allFoodDatabase,
        weightHistory,
        isSyncing,
        lastSyncedAt,
        activeTab,
        setActiveTab,
        setCurrentDate: safeSetCurrentDate,
        updateProfile,
        completeOnboarding,
        logFood,
        removeLoggedFood,
        addCustomFood,
        addWorkout,
        removeWorkout,
        logSupplement,
        updateSupplement,
        removeSupplement,
        setDailySupplements,
        updateWater,
        setWaterAmount,
        updateSteps,
        addWeightEntry,
        saveDayAIReport,
        connectGoogleAccount,
        disconnectGoogleAccount,
        resetAccountAndData,
        syncWithCloud,
        cloudSnapshot,
        cloudHasLocalChanges,
        refreshCloudBackup,
        restoreCloudBackup,
        hasRecoveryBackup,
        exportRecoveryBackupJSON,
        exportBackupJSON,
        getBackupJSON,
        importBackupJSON,
        isPremium,
        exportCorruptRecoveryJSON,
        hasCorruptRecoveryBackup,
        storageError,
        retryStoragePersistence
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
};
