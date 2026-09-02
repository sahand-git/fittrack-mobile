import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Utensils,
  Plus,
  Barcode,
  Trash2,
  Coffee,
  Sun,
  Moon,
  Apple,
  Sparkles
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { MealType, LoggedMealItem } from '../types';

interface MealTrackerProps {
  onOpenFoodLog: (meal: MealType) => void;
  onOpenBarcodeScanner: (meal: MealType) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const MEAL_SECTIONS: Array<{
  type: MealType;
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}> = [
  {
    type: 'breakfast',
    title: 'Breakfast',
    icon: <Coffee className="w-4 h-4 text-amber-400" />,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20'
  },
  {
    type: 'lunch',
    title: 'Lunch',
    icon: <Sun className="w-4 h-4 text-emerald-400" />,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20'
  },
  {
    type: 'dinner',
    title: 'Dinner',
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
    colorClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500/10 border-indigo-500/20'
  },
  {
    type: 'snack',
    title: 'Snacks & Extras',
    icon: <Apple className="w-4 h-4 text-rose-400" />,
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10 border-rose-500/20'
  }
];

export const MealTracker: React.FC<MealTrackerProps> = ({
  onOpenFoodLog,
  onOpenBarcodeScanner,
  activeTab,
  setActiveTab
}) => {
  const { todayLog, removeLoggedFood } = useFitness();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Meal & Nutrition Log</h3>
        <span className="text-xs text-slate-400">Tap + to add or scan food</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEAL_SECTIONS.map((section) => {
          const items: LoggedMealItem[] = todayLog.meals[section.type] || [];
          const mealCalories = items.reduce((acc, item) => acc + item.calories, 0);
          const mealProtein = Math.round(items.reduce((acc, item) => acc + item.protein, 0) * 10) / 10;
          const mealCarbs = Math.round(items.reduce((acc, item) => acc + item.carbs, 0) * 10) / 10;
          const mealFat = Math.round(items.reduce((acc, item) => acc + item.fat, 0) * 10) / 10;

          return (
            <div
              key={section.type}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${section.bgClass}`}>{section.icon}</div>
                    <div>
                      <span className="text-sm font-bold text-white block">{section.title}</span>
                      <span className="text-[11px] text-slate-400">
                        {mealProtein}g P • {mealCarbs}g C • {mealFat}g F
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${section.colorClass} block`}>
                      {mealCalories} kcal
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 pt-3 min-h-[60px]">
                  <AnimatePresence>
                    {items.length > 0 ? (
                      items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700/80 flex items-center justify-between gap-3 group transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate block">{item.name}</span>
                              {item.barcode && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 font-semibold shrink-0">
                                  Barcode
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {item.servingsCount > 1 ? `${item.servingsCount}x ` : ''}
                              {item.servingSize} • P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-slate-200">{item.calories} kcal</span>
                            <button
                              type="button"
                              onClick={() => removeLoggedFood(section.type, item.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 opacity-70 group-hover:opacity-100 transition-all rounded-lg"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-500 italic">
                        No food logged yet for {section.title.toLowerCase()}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onOpenFoodLog(section.type)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Food</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenBarcodeScanner(section.type)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  title="Scan package barcode"
                >
                  <Barcode className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
