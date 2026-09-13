/* localized-render */
import { t, useLocale, localeTag, matchesLocalized, aiLanguageInstruction } from "../utils/locale";
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  TrendingUp,
  Award,
  Utensils,
  MessageSquareText,
  ShieldAlert,
  ChevronLeft
} from "lucide-react";
import { useFitness } from "../context/FitnessContext";
import { GeminiSetup } from "./GeminiSetup";
import { generateGemini, parseCoachResult } from "../utils/gemini";
import { AICoachReport, PremiumFeature } from "../types";
import { tokens } from "../theme/tokens";
import { formatDateDisplay } from "../utils/date";

interface AICoachSectionProps {
  onOpenUpgradeModal?: (feature: PremiumFeature) => void;
  onBackToDashboard?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const AICoachSection: React.FC<AICoachSectionProps> = ({
  onOpenUpgradeModal,
  onBackToDashboard
}) => {
  useLocale();
  const { profile, todayLog, currentDate, saveDayAIReport, isPremium, setActiveTab: setAppTab } = useFitness();

  const [currentSubView, setCurrentSubView] = useState<"audit" | "chat">("audit");
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: `Hello ${profile.name || "there"}! I am your AI fitness & nutrition coach. Ask me anything about your daily meals, macro targets, workout recovery, or recipes tailored to your goals!`
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatSending, setIsChatSending] = useState<boolean>(false);

  // Computed nutrients consumed today
  const allMeals = [
    ...todayLog.meals.breakfast,
    ...todayLog.meals.lunch,
    ...todayLog.meals.dinner,
    ...todayLog.meals.snack
  ];

  const totalCalories = allMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = Math.round(allMeals.reduce((acc, m) => acc + m.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(allMeals.reduce((acc, m) => acc + m.carbs, 0) * 10) / 10;
  const totalFat = Math.round(allMeals.reduce((acc, m) => acc + m.fat, 0) * 10) / 10;

  const report = todayLog.aiReport;

  const handleRunAudit = async () => {
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal("gemini_coach");
      return;
    }
    setIsLoadingAudit(true);
    setAuditError(null);

    try {
      const payload = {
        profile: {
          age: profile.age,
          gender: profile.gender,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          targetWeightKg: profile.targetWeightKg,
          goal: profile.goal,
          activityLevel: profile.activityLevel
        },
        todayLog: {
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          waterMl: todayLog.waterMl,
          workouts: todayLog.workouts,
          meals: todayLog.meals
        },
        targetCalories: profile.targetCalories,
        targetProtein: profile.targetProtein,
        targetCarbs: profile.targetCarbs,
        targetFat: profile.targetFat,
        stepData: {
          steps: todayLog.steps,
          caloriesBurned: todayLog.stepCaloriesBurned
        }
      };

      const text = await generateGemini(
        `You are an AI fitness assistant, not a medical professional. Give balanced general nutrition feedback using only the supplied log; do not invent meals or diagnose conditions. Respect uncertainty and do not recommend extreme restriction. Return JSON with string fields overallGrade, headline, caloricBalance, macroBreakdown, customMealSuggestion, coachNote and string arrays mistakesAndBlindSpots, actionableTomorrowFixes. If the log is sparse, say so. Data: ${JSON.stringify(payload)}${aiLanguageInstruction()}`,
        true
      );
      const generatedReport: AICoachReport = {
        ...parseCoachResult(text),
        generatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      saveDayAIReport(generatedReport);
    } catch (err: any) {
      setAuditError(err instanceof Error ? err.message : "Could not generate your report.");
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal("gemini_coach");
      return;
    }
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsChatSending(true);

    try {
      const context = {
        goal: profile.goal,
        targetCalories: profile.targetCalories,
        targetProtein: profile.targetProtein,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        steps: todayLog.steps,
        waterMl: todayLog.waterMl
      };
      const history = [
        ...chatMessages.filter(m => m.role === "user" || !m.text.startsWith("Hello ")),
        { role: "user", text: userText }
      ].slice(-12);

      const reply = await generateGemini(
        `You are an AI fitness assistant, not a medical professional. Give concise, balanced general fitness advice. Do not diagnose or recommend extreme restriction. Context: ${JSON.stringify(context)}. Conversation: ${JSON.stringify(history)}. Answer the last user message.${aiLanguageInstruction()}`
      );
      setChatMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: err instanceof Error ? err.message : "Could not contact Gemini. Try again." }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleBack = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      setAppTab("dashboard");
    }
  };

  return (
    <div id="ai-coach-screen" className="space-y-4">
      {/* Top Header & Navigation Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900 transition-all active:scale-95 cursor-pointer shadow-2xs"
              title={t("Back to Dashboard")}
              aria-label={t("Back to Dashboard")}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0 shadow-2xs">
              <Bot className="w-6 h-6" strokeWidth={tokens.icons.strokeWidth} />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900 flex flex-wrap items-center gap-2">
                <span>{t("AI Coach & Nutrition Auditor")}</span>
                {!isPremium ? (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full font-mono shrink-0 whitespace-nowrap">
                    PRO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200 shrink-0 whitespace-nowrap">
                    {t("Live Coach")}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {formatDateDisplay(currentDate)} • {t("Daily nutritional blind spot analysis & guidance")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-run-ai-audit-header"
              type="button"
              disabled={isLoadingAudit}
              onClick={handleRunAudit}
              className="w-full sm:w-auto justify-center whitespace-nowrap shrink-0 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoadingAudit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("Auditing...")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{report ? t("Re-Audit Today") : t("Run Daily Audit")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-view Segmented Switcher */}
        <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 gap-1 shadow-inner">
          <button
            id="tab-ai-audit"
            type="button"
            onClick={() => setCurrentSubView("audit")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentSubView === "audit"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Award className="w-4 h-4 text-teal-600" />
            <span>{t("Daily Mistake & Macro Audit")}</span>
          </button>
          <button
            id="tab-ai-chat"
            type="button"
            onClick={() => setCurrentSubView("chat")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentSubView === "chat"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquareText className="w-4 h-4 text-emerald-600" />
            <span>{t("Chat with Nutritionist")}</span>
          </button>
        </div>
      </div>

      {/* Gemini API Key Config Card */}
      <GeminiSetup />

      {/* Audit View */}
      {currentSubView === "audit" && (
        <div className="space-y-4">
          {/* Quick Nutrient Context Strip */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-start">
              <span className="text-xs font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t("Today intake overview")} ({currentDate})</span>
              </span>
              <p className="text-xs text-slate-500 font-medium">
                {totalCalories} / {profile.targetCalories} kcal • {totalProtein}g {t("protein")} • {totalCarbs}g {t("carbs")} • {totalFat}g {t("fat")} • {todayLog.steps} {t("steps")}
              </p>
            </div>

            <button
              id="btn-run-ai-audit"
              type="button"
              disabled={isLoadingAudit}
              onClick={handleRunAudit}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            >
              {isLoadingAudit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("Auditing Nutrition...")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{report ? t("Re-Analyze Today") : t("Run Daily Audit Report")}</span>
                </>
              )}
            </button>
          </div>

          {auditError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{auditError}</span>
            </div>
          )}

          {/* Audit Results */}
          {report ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Overall Grade Banner */}
              <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 border border-teal-700/40 text-white flex items-center gap-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-teal-300 flex flex-col items-center justify-center text-teal-200 shrink-0 shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200/80">{t("Grade")}</span>
                  <span className="text-2xl font-black text-white">{report.overallGrade}</span>
                </div>

                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">{report.headline}</h3>
                  <p className="text-xs text-teal-100/80 font-medium">{report.caloricBalance}</p>
                  <span className="text-[10px] text-teal-200/60 block">{t("Generated at ")}{report.generatedAt}</span>
                </div>
              </div>

              {/* Identified Mistakes & Pitfalls */}
              <div className="p-5 rounded-3xl bg-rose-50/80 border border-rose-200/80 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-rose-800">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t("Identified Nutritional Mistakes & Pitfalls")}</span>
                </div>
                <ul className="space-y-2">
                  {report.mistakesAndBlindSpots?.map((mistake, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-rose-950 font-medium bg-white/80 p-3 rounded-xl border border-rose-100 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                      <span className="leading-relaxed">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Macro Notes & Tomorrow Fixes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Macro Breakdown */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 space-y-2 shadow-xs">
                  <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <span>{t("Macro Execution")}</span>
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{report.macroBreakdown}</p>
                </div>

                {/* Actionable Tomorrow Fixes */}
                <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-2 shadow-xs">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("Action Plan for Tomorrow")}</span>
                  </span>
                  <ul className="space-y-2">
                    {report.actionableTomorrowFixes?.map((fix, idx) => (
                      <li key={idx} className="text-xs text-emerald-950 font-medium flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <span className="font-bold text-emerald-600 shrink-0">#{idx + 1}</span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Custom Tailored Meal Suggestion */}
              {report.customMealSuggestion && (
                <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 shadow-xs">
                  <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 shrink-0 shadow-2xs">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">{t("Tailored Meal Idea for Today")}</span>
                    <p className="text-xs text-amber-950 font-medium leading-relaxed">{report.customMealSuggestion}</p>
                  </div>
                </div>
              )}

              {/* Closing Coach Note */}
              {report.coachNote && (
                <div className="p-4 bg-white border border-slate-200/80 rounded-3xl text-center text-xs text-slate-600 italic font-medium shadow-xs">
                  "{report.coachNote}"
                </div>
              )}
            </motion.div>
          ) : (
            <div className="py-12 text-center space-y-3 bg-white border border-dashed border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 mx-auto flex items-center justify-center shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-slate-900">{t("No Audit Run Yet for Today")}</h4>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                {t("Click \"Run Daily Audit Report\" to let Gemini AI analyze your logged meals, macro balance, hydration, and phone steps, highlighting exact mistakes to correct.")}
              </p>
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isLoadingAudit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("Run Daily Audit Report")}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chat View */}
      {currentSubView === "chat" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col h-[520px] space-y-4">
          <div className="flex-1 overflow-y-auto space-y-3 pe-1">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-2xs ${
                    msg.role === "user"
                      ? "bg-teal-600 text-white font-medium rounded-tr-none"
                      : "bg-slate-50 text-slate-800 border border-slate-200/80 font-medium rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatSending && (
              <div className="flex justify-start">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center gap-2 text-xs text-slate-500 font-medium shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  <span>{t("Gemini is thinking...")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {[
              "What should I eat for dinner?",
              "How can I hit my protein goal today?",
              "What are healthy high-protein snacks?"
            ].map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => setChatInput(promptText)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600 hover:text-teal-800 transition-colors shadow-2xs cursor-pointer"
              >
                {t(promptText)}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("Ask anything (e.g. 'How can I get 40g more protein?')...")}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white placeholder:text-slate-400 font-medium shadow-2xs"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isChatSending}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
