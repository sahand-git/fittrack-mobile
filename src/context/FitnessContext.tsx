import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserProfile,
  DayLog,
  FoodItem,
  LoggedMealItem,
  WorkoutEntry,
  MealType,
  WeightEntry,
  AICoachReport
} from '../types';
import { calculateTargets, calculateStepCalories } from '../utils/calculator';
import { VERIFIED_FOOD_DATABASE } from '../data/foodDatabase';
import { getTodayDateString } from '../utils/date';
import { clearGeminiKey } from '../utils/gemini';
import { exportBackupFile } from '../utils/backup';
import { accountStorageKeys } from '../utils/account';
import { parseBackup, serializeBackup, nextRevision, type CloudSnapshot } from '../utils/cloudBackupCore';
import { readCloudBackup, writeCloudBackup } from '../utils/cloudBackup';

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
  includeStepsInCalorieBudget: true,
  stepGoal: 10000,
  waterGoalMl: 2500,
  bmr: 1714,
  tdee: 2657,
  targetCalories: 2357,
  targetProtein: 150,
  targetCarbs: 275,
  targetFat: 73,
  profileCompleted: false,
  isGoogleConnected: false
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
  workouts: []
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
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

export const FitnessProvider: React.FC<{ children: React.ReactNode; accountId?: string; accountName?: string; accountEmail?: string }> = ({ children, accountId, accountName, accountEmail }) => {
  const keys = accountStorageKeys(accountId);
  const STORAGE_KEY_PROFILE = keys.profile;
  const STORAGE_KEY_LOGS = keys.logs;
  const STORAGE_KEY_CUSTOM_FOODS = keys.foods;
  const STORAGE_KEY_WEIGHTS = keys.weights;
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          // Older releases shipped a completed sample profile. Confirm saved details once.
          profileCompleted: parsed.profileCompleted === true && parsed.onboardingVersion === 1,
        };
      }
    } catch (e) {
      console.warn('Error reading profile from localStorage', e);
    }
    return { ...DEFAULT_PROFILE, name: accountName || '', email: accountEmail || '' };
  });

  const [dailyLogs, setDailyLogs] = useState<Record<string, DayLog>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading dailyLogs from localStorage', e);
    }
    return { [getTodayDateString()]: createEmptyDayLog(getTodayDateString()) };
  });

  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());

  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_FOODS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading custom foods', e);
    }
    return [];
  });

  const customFoodsRef = useRef(customFoods);
  customFoodsRef.current = customFoods;

  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WEIGHTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading weight history', e);
    }
    return [];
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cloudSnapshot, setCloudSnapshot] = useState<CloudSnapshot | null | undefined>(undefined);
  const [backedUpContent, setBackedUpContent] = useState<string | null>(null);
  const busyRef = useRef(false);
  const recoveryKey = STORAGE_KEY_PROFILE + '_before_restore';
  const [hasRecoveryBackup, setHasRecoveryBackup] = useState(() => {
    try { return Boolean(localStorage.getItem(recoveryKey)); } catch { return false; }
  });
  const localContent = JSON.stringify({ profile, dailyLogs, customFoods, weightHistory });
  const cloudHasLocalChanges = backedUpContent !== localContent;
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => { clearGeminiKey(); }, [profile.email]);

  // Synchronize localStorage whenever states update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Storage quota error on profile', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(dailyLogs));
    } catch (e) {
      console.warn('Storage quota error on logs', e);
    }
  }, [dailyLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_FOODS, JSON.stringify(customFoods));
    } catch (e) {
      console.warn('Storage quota error on custom foods', e);
    }
  }, [customFoods]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WEIGHTS, JSON.stringify(weightHistory));
    } catch (e) {
      console.warn('Storage quota error on weights', e);
    }
  }, [weightHistory]);

  // Combined searchable food database
  const allFoodDatabase = [...customFoods, ...VERIFIED_FOOD_DATABASE];

  // Active day's log object
  const todayLog = dailyLogs[currentDate] || createEmptyDayLog(currentDate);

  const cloudAction = async (action: () => Promise<void>) => {
    if (busyRef.current) throw new Error('A cloud operation is already in progress.');
    busyRef.current = true; setIsSyncing(true);
    try { await action(); } finally { busyRef.current = false; setIsSyncing(false); }
  };
  const refreshCloudBackup = () => cloudAction(async () => {
    setCloudSnapshot(undefined);
    setCloudSnapshot(await readCloudBackup(accountId));
  });
  const syncWithCloud = () => cloudAction(async () => {
    if (cloudSnapshot === undefined) throw new Error('Check cloud backup before saving.');
    const content = localContent;
    const result = await writeCloudBackup(accountId, JSON.parse(getBackupJSON()), cloudSnapshot?.revision ?? null);
    setCloudSnapshot(result); setLastSyncedAt(result.updatedAt); setBackedUpContent(content);
  });
  const restoreCloudBackup = () => cloudAction(async () => {
    if (!cloudSnapshot) throw new Error('Check cloud backup and select an existing backup first.');
    const latest = await readCloudBackup(accountId);
    nextRevision(cloudSnapshot.revision, latest?.revision ?? null);
    if (!latest || !importBackupJSON(latest.payload)) throw new Error('Restore could not save safely on this device. Free storage space, export your data, and try again.');
    const restored = parseBackup(latest.payload);
    setCloudSnapshot(latest); setLastSyncedAt(latest.updatedAt);
    setBackedUpContent(JSON.stringify({profile:restored.profile,dailyLogs:restored.dailyLogs,customFoods:restored.customFoods,weightHistory:restored.weightHistory}));
  });
  const connectGoogleAccount = async (_email: string, _name?: string) => false;
  const disconnectGoogleAccount = () => { clearGeminiKey(); setProfile(prev => ({ ...prev, isGoogleConnected: false })); };

  const resetAccountAndData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
      localStorage.removeItem(STORAGE_KEY_LOGS);
      localStorage.removeItem(STORAGE_KEY_CUSTOM_FOODS);
      localStorage.removeItem(STORAGE_KEY_WEIGHTS);
    } catch (e) {
      console.warn('Error clearing localStorage', e);
    }
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
    const mult = Math.max(0.01, servingsCount);
    const loggedItem: LoggedMealItem = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      foodId: food.id,
      name: food.name,
      brand: food.brand,
      barcode: food.barcode,
      mealType,
      servingSize: food.servingSize,
      servingGrams: Math.round(food.servingGrams * mult),
      servingsCount: mult,
      calories: Math.round(food.calories * mult),
      protein: Math.round(food.protein * mult * 10) / 10,
      carbs: Math.round(food.carbs * mult * 10) / 10,
      fat: Math.round(food.fat * mult * 10) / 10,
      fiber: food.fiber ? Math.round(food.fiber * mult * 10) / 10 : undefined,
      sugars: food.sugars ? Math.round(food.sugars * mult * 10) / 10 : undefined,
      sodium: food.sodium ? Math.round(food.sodium * mult) : undefined,
      imageUrl: food.imageUrl,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

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
      localStorage.setItem(STORAGE_KEY_CUSTOM_FOODS, JSON.stringify(next));
    } catch {
      throw new Error('Could not save this food on your phone. Free some storage space and try again.');
    }
    customFoodsRef.current = next;
    setCustomFoods(next);

    return newFood;
  };

  const addWorkout = (workoutData: Omit<WorkoutEntry, 'id' | 'loggedAt'>) => {
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
      const day = prev[currentDate] || createEmptyDayLog(currentDate);
      return {
        ...prev,
        [currentDate]: {
          ...day,
          workouts: day.workouts.filter(w => w.id !== workoutId)
        }
      };
    });
  };

  const updateWater = (deltaMl: number) => {
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
    const entry: WeightEntry = {
      date: currentDate,
      weightKg: Math.round(weightKg * 10) / 10,
      bodyFatPercent: bodyFat,
      note
    };
    setWeightHistory(prev => [entry, ...prev.filter(w => w.date !== currentDate)]);
    updateProfile({ weightKg: entry.weightKg });
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
      weightHistory
    };
    return serializeBackup(data, false);
  };
  const exportBackupJSON = () => exportBackupFile(getBackupJSON());

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const parsed = parseBackup(jsonStr);
      // Retain a complete pre-restore copy before changing any existing local data.
      const previous = getBackupJSON();
      const writes = [[STORAGE_KEY_PROFILE, parsed.profile], [STORAGE_KEY_LOGS, parsed.dailyLogs], [STORAGE_KEY_CUSTOM_FOODS, parsed.customFoods], [STORAGE_KEY_WEIGHTS, parsed.weightHistory]] as const;
      const oldValues = writes.map(([key]) => [key, localStorage.getItem(key)] as const);
      localStorage.setItem(recoveryKey, previous);
      setHasRecoveryBackup(true);
      try {
        for (const [key, value] of writes) localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        for (const [key, value] of oldValues) {
          try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* Recovery copy remains available. */ }
        }
        throw error;
      }
      setProfile(parsed.profile); setDailyLogs(parsed.dailyLogs);
      setCustomFoods(parsed.customFoods); customFoodsRef.current = parsed.customFoods;
      setWeightHistory(parsed.weightHistory);
      return true;
    } catch (err) {
      console.error('Import backup failed:', err);
      return false;
    }
  };
  const exportRecoveryBackupJSON = () => {
    const recovery = localStorage.getItem(recoveryKey);
    if (!recovery) throw new Error('No pre-restore copy is available.');
    return exportBackupFile(recovery);
  };

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
        setCurrentDate,
        updateProfile,
        completeOnboarding,
        logFood,
        removeLoggedFood,
        addCustomFood,
        addWorkout,
        removeWorkout,
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
        importBackupJSON
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
