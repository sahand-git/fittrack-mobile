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

const STORAGE_KEY_PROFILE = 'nutrifit_user_profile_v2';
const STORAGE_KEY_LOGS = 'nutrifit_daily_logs_v2';
const STORAGE_KEY_CUSTOM_FOODS = 'nutrifit_custom_foods_v2';
const STORAGE_KEY_WEIGHTS = 'nutrifit_weights_v2';

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
  exportBackupJSON: () => void;
  importBackupJSON: (jsonStr: string) => boolean;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

export const FitnessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    return DEFAULT_PROFILE;
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Initial cloud restore on mount only if user already has an active profile email
  useEffect(() => {
    const emailToUse = profile.email?.trim();
    if (!emailToUse || !profile.profileCompleted || !profile.isGoogleConnected) return;

    fetch(`/api/sync/load?email=${encodeURIComponent(emailToUse)}`)
      .then(res => res.json())
      .then(result => {
        if (result && result.found && result.data) {
          const { profile: rProfile, dailyLogs: rLogs, customFoods: rFoods, weightHistory: rWeights } = result.data;
          if (rProfile) setProfile(prev => ({ ...prev, ...rProfile, isGoogleConnected: true }));
          if (rLogs) setDailyLogs(prev => ({ ...prev, ...rLogs }));
          if (rFoods && Array.isArray(rFoods) && rFoods.length > 0) setCustomFoods(rFoods);
          if (rWeights && Array.isArray(rWeights) && rWeights.length > 0) setWeightHistory(rWeights);
          setLastSyncedAt(new Date().toISOString());
        }
      })
      .catch(err => console.warn('Could not load remote cloud profile', err));
  }, []);

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

  // Cloud Sync Handler
  const syncWithCloud = useCallback(async () => {
    if (!profile.email) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          profile,
          dailyLogs,
          customFoods,
          weightHistory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLastSyncedAt(data.syncedAt || new Date().toISOString());
      }
    } catch (err) {
      console.error('Cloud sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [profile, dailyLogs, customFoods, weightHistory]);

  const connectGoogleAccount = async (email: string, name?: string): Promise<boolean> => {
    if (!email || !email.includes('@')) return false;
    setIsSyncing(true);
    try {
      // First try to load existing cloud backup if any
      const res = await fetch(`/api/sync/load?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const result = await res.json();
        if (result.found && result.data) {
          const { profile: rProfile, dailyLogs: rLogs, customFoods: rFoods, weightHistory: rWeights } = result.data;
          if (rProfile) setProfile({ ...rProfile, isGoogleConnected: true, email });
          if (rLogs) setDailyLogs(rLogs);
          if (rFoods) setCustomFoods(rFoods);
          if (rWeights) setWeightHistory(rWeights);
          setLastSyncedAt(new Date().toISOString());
          setIsSyncing(false);
          return true;
        }
      }

      // If no remote backup exists yet, save current local state to cloud under this email
      const updatedProfile = {
        ...profile,
        email,
        name: name || profile.name || email.split('@')[0],
        isGoogleConnected: true
      };
      setProfile(updatedProfile);

      await fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          profile: updatedProfile,
          dailyLogs,
          customFoods,
          weightHistory
        })
      });
      setLastSyncedAt(new Date().toISOString());
      return true;
    } catch (e) {
      console.error('Error connecting Google account:', e);
      setProfile(prev => ({ ...prev, email, isGoogleConnected: true }));
      return true;
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectGoogleAccount = () => {
    setProfile(prev => ({ ...prev, isGoogleConnected: false }));
  };

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

  const exportBackupJSON = () => {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      profile,
      dailyLogs,
      customFoods,
      weightHistory
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrifit_backup_${profile.name || 'user'}_${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.dailyLogs) setDailyLogs(parsed.dailyLogs);
      if (parsed.customFoods) setCustomFoods(parsed.customFoods);
      if (parsed.weightHistory) setWeightHistory(parsed.weightHistory);
      return true;
    } catch (err) {
      console.error('Import backup failed:', err);
      return false;
    }
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
        exportBackupJSON,
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
