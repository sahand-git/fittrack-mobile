import React, { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, Image as ImageIcon, Sparkles, Check, AlertCircle, Loader2, X, RefreshCw, Utensils, Flame } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { t, useLocale } from '../utils/locale';
import { useFitness } from '../context/FitnessContext';
import { hasAIAccess, generateGeminiVision, parseMealResult } from '../utils/gemini';
import type { MealType, FoodItem, PremiumFeature } from '../types';

interface AIPlateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType?: MealType;
  onOpenGeminiSetup?: () => void;
  onOpenUpgradeModal?: (feature: PremiumFeature) => void;
}

export const AIPlateScannerModal: React.FC<AIPlateScannerModalProps> = ({
  isOpen,
  onClose,
  defaultMealType = 'lunch',
  onOpenGeminiSetup,
  onOpenUpgradeModal,
}) => {
  useLocale();
  const { logFood, isPremium } = useFitness();

  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMealType);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [portionMultipliers, setPortionMultipliers] = useState<Record<number, number>>({});
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSelectedMeal(defaultMealType);
  }, [defaultMealType]);

  useEffect(() => {
    if (!isOpen) {
      setCapturedImage(null);
      setAnalysisResult(null);
      setErrorMessage(null);
      setLoggedSuccess(false);
    }
  }, [isOpen]);

  const handleTakePhoto = async () => {
    setErrorMessage(null);
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });
        if (photo?.dataUrl) {
          setCapturedImage(photo.dataUrl);
          analyzeImage(photo.dataUrl);
        }
      } catch (err: any) {
        if (!err?.message?.includes('cancelled') && !err?.message?.includes('dismissed')) {
          console.warn('Native camera fallback:', err);
          cameraInputRef.current?.click();
        }
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handlePickGallery = async () => {
    setErrorMessage(null);
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });
        if (photo?.dataUrl) {
          setCapturedImage(photo.dataUrl);
          analyzeImage(photo.dataUrl);
        }
      } catch (err: any) {
        if (!err?.message?.includes('cancelled') && !err?.message?.includes('dismissed')) {
          console.warn('Native gallery picker fallback:', err);
          galleryInputRef.current?.click();
        }
      }
    } else {
      galleryInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const analyzeImage = async (dataUrl: string) => {
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('ai_plate');
      return;
    }
    if (!hasAIAccess()) {
      setErrorMessage(t('Allow AI data sharing in the AI consent panel first.'));
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    const prompt = `Analyze this food photo. Identify all individual food items on the plate or in the meal. Estimate realistic portion sizes in grams. For each item provide:
- name: string (concise name)
- portion: string (e.g. "150g grilled chicken", "1 cup steamed rice")
- servingGrams: number (estimated weight in grams, >0)
- calories: number (positive integer)
- protein: number (grams, positive)
- carbs: number (grams, positive)
- fat: number (grams, positive)
- fiber: optional number (grams)
- sodium: optional number (mg)
- vitaminA: optional number (mcg)
- vitaminC: optional number (mg)
- vitaminD: optional number (mcg)
- vitaminB12: optional number (mcg)
- calcium: optional number (mg)
- iron: optional number (mg)
- potassium: optional number (mg)
- magnesium: optional number (mg)
- zinc: optional number (mg)

Also provide:
- dishName: string (a descriptive title for the plate)
- advice: string (short nutritional observation or health feedback)

Return ONLY a valid JSON object matching this schema:
{
  "dishName": "Grilled Chicken and Rice",
  "advice": "Well-balanced lean protein with complex carbohydrates and micronutrients.",
  "items": [
    {
      "name": "Grilled Chicken Breast",
      "portion": "150g",
      "servingGrams": 150,
      "calories": 240,
      "protein": 46,
      "carbs": 0,
      "fat": 5,
      "fiber": 0,
      "sodium": 120,
      "potassium": 380,
      "iron": 1.5,
      "zinc": 1.2
    }
  ]
}`;

    try {
      const responseText = await generateGeminiVision(prompt, dataUrl, 'image/jpeg', true);
      const parsed = parseMealResult(responseText);
      setAnalysisResult(parsed);
      const initialMultipliers: Record<number, number> = {};
      parsed.items.forEach((_: any, idx: number) => { initialMultipliers[idx] = 1; });
      setPortionMultipliers(initialMultipliers);
    } catch (err: any) {
      console.error('Plate vision analysis error:', err);
      setErrorMessage(err.message || t('Could not analyze plate photo. Please try again with good lighting.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogAll = () => {
    if (!analysisResult?.items) return;

    for (let i = 0; i < analysisResult.items.length; i++) {
      const item = analysisResult.items[i];
      const mult = portionMultipliers[i] ?? 1;
      if (mult <= 0) continue;

      const foodItem: FoodItem = {
        id: `ai_plate_${Date.now()}_${i}`,
        name: item.name,
        servingSize: item.portion || `${item.servingGrams}g`,
        servingGrams: item.servingGrams,
        calories: Math.round(item.calories),
        protein: Math.round(item.protein * 10) / 10,
        carbs: Math.round(item.carbs * 10) / 10,
        fat: Math.round(item.fat * 10) / 10,
        fiber: item.fiber !== undefined ? Math.round(item.fiber * 10) / 10 : undefined,
        sodium: item.sodium !== undefined ? Math.round(item.sodium) : undefined,
        vitaminA: item.vitaminA,
        vitaminC: item.vitaminC,
        vitaminD: item.vitaminD,
        vitaminB12: item.vitaminB12,
        calcium: item.calcium,
        iron: item.iron,
        potassium: item.potassium,
        magnesium: item.magnesium,
        zinc: item.zinc,
        source: 'ai_estimated',
        category: 'AI Plate Scan'
      };

      logFood(selectedMeal, foodItem, mult);
    }

    setLoggedSuccess(true);
    navigator.vibrate?.([50, 50, 50]);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <CameraIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base flex items-center gap-1.5">
                {t("AI Plate Vision Scanner")}
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {!isPremium && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
                    PRO
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t("Snap your meal plate to calculate calories & vitamins")}
              </p>
            </div>
          </div>

          <button aria-label={t("Close")}
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Gemini Key Warning */}
          {!hasAIAccess() && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t("AI access and privacy")}</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {t("Allow AI data sharing and check your account access before analyzing a photo.")}
              </p>
              {onOpenGeminiSetup && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenGeminiSetup(); }}
                  className="self-start px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-all mt-1"
                >
                  {t("Review AI access")}
                </button>
              )}
            </div>
          )}

          {/* Hidden inputs for web fallbacks */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Prompt Selection / Action Area */}
          {!capturedImage && (
            <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-3xl p-6 text-center space-y-3 bg-slate-800/30">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CameraIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t("Scan Food Plate")}</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">
                  {t("Take a live photo or select an existing food image from your device.")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="py-3 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <CameraIcon className="w-5 h-5" />
                  <span>{t("Take Photo")}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePickGallery}
                  className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <ImageIcon className="w-5 h-5 text-cyan-400" />
                  <span>{t("Choose from Gallery")}</span>
                </button>
              </div>
            </div>
          )}

          {/* Captured Image Preview & Rescan Action */}
          {capturedImage && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 aspect-video max-h-52 bg-black">
                <img
                  src={capturedImage}
                  alt="Captured Food Plate"
                  className="w-full h-full object-cover"
                />
                {!isAnalyzing && (
                  <div className="absolute top-2 end-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleTakePhoto}
                      className="px-2.5 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold backdrop-blur-sm border border-slate-700 flex items-center gap-1.5 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <CameraIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t("Retake Photo")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePickGallery}
                      className="px-2.5 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold backdrop-blur-sm border border-slate-700 flex items-center gap-1.5 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t("Gallery")}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analyzing Spinner */}
          {isAnalyzing && (
            <div className="p-8 text-center space-y-3 bg-slate-800/40 rounded-2xl border border-slate-800">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">{t("Analyzing Food Plate with Gemini...")}</p>
                <p className="text-xs text-slate-400">{t("Detecting ingredients, portion sizes, calories and vitamins")}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="space-y-4">
              {/* Plate Title & Advice */}
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-400" />
                    <span>{analysisResult.dishName || t("Detected Meal")}</span>
                  </h3>
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1 font-mono">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{analysisResult.totalCalories} kcal</span>
                  </span>
                </div>

                {analysisResult.advice && (
                  <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    "{analysisResult.advice}"
                  </p>
                )}

                {/* Macros Overview */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-slate-900/80 p-2 rounded-xl text-center border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("Protein")}</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">{analysisResult.totalProtein}g</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl text-center border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("Carbs")}</span>
                    <span className="text-xs font-black text-cyan-400 font-mono">{analysisResult.totalCarbs}g</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl text-center border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("Fat")}</span>
                    <span className="text-xs font-black text-rose-400 font-mono">{analysisResult.totalFat}g</span>
                  </div>
                </div>
              </div>

              {/* Meal Type Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">{t("Log to Meal:")}</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMeal(m)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        selectedMeal === m
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t(m)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Itemized Detected Ingredients */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Identified Items on Plate")}</span>
                <div className="space-y-2">
                  {analysisResult.items.map((item: any, idx: number) => {
                    const mult = portionMultipliers[idx] ?? 1;
                    return (
                      <div key={idx} className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                          <p className="text-[11px] text-slate-400">
                            {item.portion} ({Math.round(item.servingGrams * mult)}g)
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                            <span className="text-amber-300 font-bold">{Math.round(item.calories * mult)} kcal</span>
                            <span>•</span>
                            <span>P: {Math.round(item.protein * mult * 10) / 10}g</span>
                            <span>C: {Math.round(item.carbs * mult * 10) / 10}g</span>
                            <span>F: {Math.round(item.fat * mult * 10) / 10}g</span>
                          </div>
                        </div>

                        {/* Portion Multiplier Controls */}
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPortionMultipliers(p => ({ ...p, [idx]: Math.max(0, (p[idx] ?? 1) - 0.25) }))}
                            className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-emerald-400 px-1">
                            {(mult).toFixed(2)}x
                          </span>
                          <button
                            type="button"
                            onClick={() => setPortionMultipliers(p => ({ ...p, [idx]: (p[idx] ?? 1) + 0.25 }))}
                            className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {analysisResult && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
            <button
              type="button"
              onClick={handleLogAll}
              disabled={loggedSuccess}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
                loggedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {loggedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t("Logged to Meal Successfully!")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t("Log All to ")}{t(selectedMeal)}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
