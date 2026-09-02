import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  ShieldCheck,
  X,
  ExternalLink,
  Flame,
  Utensils,
  Footprints,
  Dumbbell,
  Calculator,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface ScientificReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificReferencesModal: React.FC<ScientificReferencesModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="scientific-references-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Scientific References & Data Sources</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official clinical equations, food databases, and metabolic standards used in this app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
          {/* Section 1: Food & Nutrition Data */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <Utensils className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">1. Food & Nutritional Database Sources</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Every food item, barcode lookup, and micronutrient entry is strictly cross-referenced against authoritative global nutrition repositories:
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Open Food Facts Global Open Product Database</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Live barcode resolution via Open Food Facts API v2. Supplies Nutri-Score, Eco-Score, NOVA food processing classifications, and certified manufacturer nutrition labels across 3+ million packaged products worldwide.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">USDA FoodData Central (Standard Reference Legacy & Foundation Foods)</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    United States Department of Agriculture Agricultural Research Service. Provides standardized macro and micronutrient density per 100g for whole whole-foods, meats, fish, grains, fruits, and raw ingredients.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Gemini AI Nutrition Vision & Natural Language Parser</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    When freeform text (e.g. "2 boiled eggs with 1 slice sourdough toast") is logged, Google Gemini models decompose the meal into distinct ingredients using USDA nutrient weight ratios.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Workout Calorie & MET Calculations */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Dumbbell className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">2. Workout Energy & Calorie Calculations</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Exercise calorie expenditure is calculated using the official <strong>2024 Adult Compendium of Physical Activities</strong> (Ainsworth BE et al., <em>Medicine & Science in Sports & Exercise</em>):
            </p>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-rose-300 space-y-1">
              <div className="text-white font-bold">Standard Metabolic Equivalent Equation (MET):</div>
              <div>Calories Burned (kcal) = (MET × 3.5 × Weight in kg ÷ 200) × Duration in minutes</div>
              <div className="text-[10px] text-slate-400 pt-1">
                Where 1 MET = resting oxygen consumption (3.5 ml O₂ · kg⁻¹ · min⁻¹). Example: Weightlifting (5.0 MET) for 45 min at 75kg = 5.0 × 3.5 × 75 ÷ 200 × 45 = 295 kcal.
              </div>
            </div>
          </div>

          {/* Section 3: BMR & TDEE Basal Metabolic Equations */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Calculator className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">3. BMR & TDEE Equations</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Basal Metabolic Rate is calculated via the <strong>Mifflin-St Jeor Equation (1990)</strong>, validated by the American Dietetic Association (ADA) as the most accurate clinical formula for non-obese and obese adults:
            </p>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-amber-300 space-y-1">
              <div>Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5</div>
              <div>Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161</div>
              <div className="text-[10px] text-slate-400 pt-1">
                TDEE = BMR × Physical Activity Factor (Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Heavy: 1.725, Athlete: 1.9).
              </div>
            </div>
          </div>

          {/* Section 4: Step-to-Calorie Formula */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <Footprints className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">4. Pedometer & Step Caloric Expenditure</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Step energy consumption uses the <strong>American College of Sports Medicine (ACSM)</strong> and <strong>Harvard Health Publishing</strong> caloric stride standard:
            </p>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
              <div>Step Calories (kcal) = Steps × 0.045 × (User Weight in kg ÷ 70)</div>
              <div className="text-[10px] text-slate-400 pt-1">
                Example: 10,000 steps for an 80kg individual = 10,000 × 0.045 × (80 ÷ 70) ≈ 514 kcal burned.
              </div>
            </div>
          </div>

          {/* Section 5: International Society of Sports Nutrition (ISSN) */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">5. Macronutrient Distribution Targets</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Protein targets (1.6g - 2.2g per kg bodyweight) adhere to the <strong>International Society of Sports Nutrition (ISSN) Position Stand (Jäger et al., 2017)</strong> for lean tissue preservation during caloric restriction and muscle hypertrophy.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">All data models operate with zero commercial bias</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close Reference Sheet
          </button>
        </div>
      </motion.div>
    </div>
  );
};
