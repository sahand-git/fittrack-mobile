import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Barcode,
  Sparkles,
  Plus,
  X,
  Flame,
  Check,
  Loader2,
  Utensils,
  BookOpen,
  Zap,
  Info,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFitness } from '../context/FitnessContext';
import { MealType, FoodItem } from '../types';

interface FoodLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  onOpenBarcodeScanner: (meal: MealType) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const FoodLogModal: React.FC<FoodLogModalProps> = ({
  isOpen,
  onClose,
  mealType,
  onOpenBarcodeScanner
}) => {
  const { allFoodDatabase, logFood, addCustomFood } = useFitness();

  const [activeTab, setActiveTab] = useState<'search' | 'ai_parser' | 'custom'>('search');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Selected food for logging
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingsCount, setServingsCount] = useState<number>(1);
  const [targetMeal, setTargetMeal] = useState<MealType>(mealType);

  useEffect(() => {
    setTargetMeal(mealType);
  }, [mealType, isOpen]);

  // AI Meal Parser
  const [aiMealText, setAiMealText] = useState<string>('');
  const [isParsingAI, setIsParsingAI] = useState<boolean>(false);
  const [aiParsedResult, setAiParsedResult] = useState<any | null>(null);

  // Custom Food Form
  const [customName, setCustomName] = useState<string>('');
  const [customBrand, setCustomBrand] = useState<string>('');
  const [customServingSize, setCustomServingSize] = useState<string>('1 serving (100g)');
  const [customCalories, setCustomCalories] = useState<string>('');
  const [customProtein, setCustomProtein] = useState<string>('');
  const [customCarbs, setCustomCarbs] = useState<string>('');
  const [customFat, setCustomFat] = useState<string>('');

  const categories = ['All', 'Protein', 'Grains', 'Produce', 'Dairy', 'Supplements', 'Snacks', 'Beverages'];

  const filteredFoods = allFoodDatabase.filter((food) => {
    const matchesSearch =
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (food.brand && food.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (food.barcode && food.barcode.includes(searchQuery));

    const matchesCat = categoryFilter === 'All' || food.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setServingsCount(1);
  };

  const handleConfirmLog = () => {
    if (!selectedFood) return;
    logFood(targetMeal, selectedFood, servingsCount);

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.75 }
      });
    } catch (e) {}

    onClose();
  };

  const handleParseAiMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMealText.trim() || isParsingAI) return;

    setIsParsingAI(true);
    setAiParsedResult(null);

    try {
      const res = await fetch('/api/ai-parse-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiMealText })
      });
      const data = await res.json();
      if (res.ok && data.success && data.result) {
        setAiParsedResult(data.result);
      }
    } catch (err) {
      console.error('AI parse error:', err);
    } finally {
      setIsParsingAI(false);
    }
  };

  const handleLogAiItems = () => {
    if (!aiParsedResult || !aiParsedResult.items) return;

    aiParsedResult.items.forEach((item: any) => {
      const foodItem: FoodItem = {
        id: 'ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: item.name,
        servingSize: item.portion || '1 serving',
        servingGrams: 100,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        source: 'ai_estimated'
      };
      addCustomFood(foodItem);
      logFood(targetMeal, foodItem, 1);
    });

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.75 } });
    } catch (e) {}

    onClose();
  };

  const handleCreateCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customCalories) return;

    const newFood: FoodItem = {
      id: 'custom_' + Date.now(),
      name: customName.trim(),
      brand: customBrand.trim() || undefined,
      servingSize: customServingSize.trim() || '100g',
      servingGrams: 100,
      calories: parseInt(customCalories) || 0,
      protein: parseFloat(customProtein) || 0,
      carbs: parseFloat(customCarbs) || 0,
      fat: parseFloat(customFat) || 0,
      source: 'custom'
    };

    addCustomFood(newFood);
    logFood(targetMeal, newFood, 1);
    onClose();
  };

  const getSourceLabel = (source?: string, brand?: string) => {
    if (source === 'open_food_facts') return 'Ref: Open Food Facts';
    if (source === 'verified_database') return 'Ref: USDA FoodData Central';
    if (source === 'ai_estimated') return 'Ref: Gemini AI Engine';
    if (brand) return `Ref: ${brand}`;
    return 'Ref: Verified Standard';
  };

  if (!isOpen) return null;

  return (
    <div
      id="food-log-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-4 sm:p-5 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Log Food Intake</span>
              </h2>
              <p className="text-xs text-slate-400">USDA database, barcode scanner & AI meal logger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Food Log"
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Barcode Quick Trigger */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <label htmlFor="food-log-meal" className="text-xs font-bold text-slate-300">Meal</label>
            <select
              id="food-log-meal"
              value={targetMeal}
              onChange={(e) => setTargetMeal(e.target.value as MealType)}
              className="min-w-0 flex-1 py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snacks</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-trigger-barcode-scanner-from-foodlog"
              type="button"
              onClick={() => {
                onClose();
                onOpenBarcodeScanner(targetMeal);
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <Barcode className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>

            <div className="flex-1 flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('search');
                  setSelectedFood(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'search'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Food Database
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('ai_parser');
                  setSelectedFood(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ai_parser'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AI Smart Text
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('custom');
                  setSelectedFood(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'custom'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Food
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="min-h-0 p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Search Database */}
          {activeTab === 'search' && !selectedFood && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-food-search-query"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chicken, eggs, rice, oats, protein bar, barcode..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === cat
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Foods List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {filteredFoods.length > 0 ? (
                  filteredFoods.map((food) => (
                    <div
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">{food.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            {getSourceLabel(food.source, food.brand)}
                          </span>
                          {food.nutriScore && (
                            <span className="text-[9px] px-1 font-bold bg-lime-400 text-slate-950 rounded">
                              Nutri-Score {food.nutriScore}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {food.servingSize} • P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-emerald-400 font-mono">{food.calories} kcal</span>
                        <div className="w-6 h-6 rounded-lg bg-slate-700 text-slate-300 group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-slate-500 italic">
                      No foods matching "{searchQuery}" in local database.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBarcodeScanner(targetMeal);
                      }}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Barcode className="w-4 h-4" />
                      <span>Search Global Open Food Facts by Barcode</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Item Portion Selector */}
          {activeTab === 'search' && selectedFood && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                    {getSourceLabel(selectedFood.source, selectedFood.brand)}
                  </span>
                  <span className="text-[10px] text-slate-400">Serving size: {selectedFood.servingSize}</span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedFood.name}</h3>

                {/* Macro Breakdown */}
                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 font-semibold block">Calories</span>
                    <span className="text-sm font-extrabold text-white">
                      {Math.round(selectedFood.calories * servingsCount)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] text-rose-400 font-semibold block">Protein</span>
                    <span className="text-sm font-extrabold text-white">
                      {Math.round(selectedFood.protein * servingsCount * 10) / 10}g
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] text-amber-400 font-semibold block">Carbs</span>
                    <span className="text-sm font-extrabold text-white">
                      {Math.round(selectedFood.carbs * servingsCount * 10) / 10}g
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[10px] text-blue-400 font-semibold block">Fat</span>
                    <span className="text-sm font-extrabold text-white">
                      {Math.round(selectedFood.fat * servingsCount * 10) / 10}g
                    </span>
                  </div>
                </div>
              </div>

              {/* Servings Adjuster */}
              <div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Portion Servings</label>
                  <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setServingsCount(Math.max(0.25, servingsCount - 0.25))}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.25"
                      min="0.1"
                      value={servingsCount}
                      onChange={(e) => setServingsCount(parseFloat(e.target.value) || 1)}
                      className="w-full text-center bg-transparent text-white font-bold text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setServingsCount(servingsCount + 0.25)}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFood(null)}
                  className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Back to List
                </button>
                <button
                  id="btn-confirm-log-food-item"
                  type="button"
                  onClick={handleConfirmLog}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log {Math.round(selectedFood.calories * servingsCount)} kcal to {targetMeal.toUpperCase()}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: AI Natural Text / Voice Parser */}
          {activeTab === 'ai_parser' && (
            <div className="space-y-4">
              <form onSubmit={handleParseAiMeal} className="space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Describe what you ate in natural language:
                </label>
                <div className="relative">
                  <textarea
                    id="input-ai-meal-text"
                    rows={3}
                    value={aiMealText}
                    onChange={(e) => setAiMealText(e.target.value)}
                    placeholder="e.g. 2 fried eggs, 2 slices whole wheat toast with 1 tbsp butter, and a black coffee with 1 cup whole milk"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Powered by Gemini AI + USDA nutritional composition</span>
                  <button
                    type="submit"
                    disabled={!aiMealText.trim() || isParsingAI}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isParsingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{isParsingAI ? 'Decomposing...' : 'Calculate Macros'}</span>
                  </button>
                </div>
              </form>

              {aiParsedResult && (
                <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="text-xs font-bold text-white">AI Decomposed Ingredients</span>
                    <span className="text-xs font-bold text-emerald-400">{aiParsedResult.totalCalories} kcal Total</span>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {aiParsedResult.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-800/80 p-2 rounded-xl">
                        <div>
                          <span className="text-white font-semibold block">{item.name}</span>
                          <span className="text-[10px] text-slate-400">{item.portion}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400">{item.calories} kcal</span>
                          <span className="text-[10px] text-slate-400 block">P:{item.protein}g C:{item.carbs}g F:{item.fat}g</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogAiItems}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log All Items to {targetMeal.toUpperCase()}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Custom Food Creator */}
          {activeTab === 'custom' && (
            <form onSubmit={handleCreateCustomFood} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Food Name *</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Grandma's Meatballs"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Brand / Source</label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="e.g. Homemade"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Calories *</label>
                  <input
                    type="number"
                    required
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    placeholder="kcal"
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    placeholder="g"
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    placeholder="g"
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    placeholder="g"
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Save to Library & Log to {targetMeal.toUpperCase()}</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
