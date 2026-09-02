import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Bot,
  X,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  TrendingUp,
  Award,
  Utensils,
  Lightbulb,
  MessageSquareText,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { GeminiSetup } from './GeminiSetup';
import { generateGemini, parseCoachResult } from '../utils/gemini';
import { AICoachReport } from '../types';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({ isOpen, onClose }) => {
  const { profile, todayLog, currentDate, saveDayAIReport } = useFitness();

  const [activeTab, setActiveTab] = useState<'audit' | 'chat'>('audit');
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello ${profile.name || 'there'}! I'm your AI fitness assistant. Set up Gemini to ask questions. Ask me anything about your meals, macronutrient splits, pre/post workout fuel, or healthy recipes!`
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
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
    setIsLoadingAudit(true);
    setAuditError(null);

    try {
      const payload = {
        profile: { age: profile.age, gender: profile.gender, heightCm: profile.heightCm, weightKg: profile.weightKg, targetWeightKg: profile.targetWeightKg, goal: profile.goal, activityLevel: profile.activityLevel },
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

      const text = await generateGemini(`You are an AI fitness assistant, not a medical professional. Give balanced general nutrition feedback using only the supplied log; do not invent meals or diagnose conditions. Respect uncertainty and do not recommend extreme restriction. Return JSON with string fields overallGrade, headline, caloricBalance, macroBreakdown, customMealSuggestion, coachNote and string arrays mistakesAndBlindSpots, actionableTomorrowFixes. If the log is sparse, say so. Data: ${JSON.stringify(payload)}`, true);
      const generatedReport: AICoachReport = {
        ...parseCoachResult(text),
        generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      saveDayAIReport(generatedReport);
    } catch (err: any) {
      setAuditError(err instanceof Error ? err.message : 'Could not generate your report.');
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsChatSending(true);

    try {
      const context = { goal: profile.goal, targetCalories: profile.targetCalories, targetProtein: profile.targetProtein, totalCalories, totalProtein, totalCarbs, totalFat, steps: todayLog.steps, waterMl: todayLog.waterMl };
      const history = [...chatMessages.filter(m => m.role === 'user' || !m.text.startsWith('Hello ')), { role: 'user', text: userText }].slice(-12);
      const reply = await generateGemini(`You are an AI fitness assistant, not a medical professional. Give concise, balanced general fitness advice. Do not diagnose or recommend extreme restriction. Context: ${JSON.stringify(context)}. Conversation: ${JSON.stringify(history)}. Answer the last user message.`);
      setChatMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: err instanceof Error ? err.message : 'Could not contact Gemini. Try again.' }]);
    } finally {
      setIsChatSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="ai-coach-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88dvh]"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 sticky top-0 z-30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Gemini AI Nutrition & Mistake Auditor</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    Live Coach
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Daily nutritional blind spot analysis & guidance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close AI Coach"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Tab switcher */}
        <div className="flex px-5 pt-3 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          <button
            id="tab-ai-audit"
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'audit'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Daily Mistake & Macro Audit</span>
          </button>
          <button
            id="tab-ai-chat"
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'chat'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareText className="w-4 h-4" />
            <span>Chat with Nutritionist</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
          <GeminiSetup />
          {activeTab === 'audit' ? (
            <div className="space-y-5">
              {/* Audit Trigger Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Evaluate Today's Intake ({currentDate})
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Logged: {totalCalories} / {profile.targetCalories} kcal • {totalProtein}g protein • {todayLog.steps} steps
                  </p>
                </div>

                <button
                  id="btn-run-ai-audit"
                  type="button"
                  disabled={isLoadingAudit}
                  onClick={handleRunAudit}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 active:scale-95"
                >
                  {isLoadingAudit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Auditing Nutrition...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{report ? 'Re-Analyze Today' : 'Run Daily Audit Report'}</span>
                    </>
                  )}
                </button>
              </div>

              {auditError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{auditError}</span>
                </div>
              )}

              {/* Display Report Result */}
              {report ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Grade Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex flex-col items-center justify-center text-emerald-300 shrink-0 shadow-lg shadow-emerald-500/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Grade</span>
                      <span className="text-2xl font-black text-white">{report.overallGrade}</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-bold text-white leading-snug">{report.headline}</h3>
                      <p className="text-xs text-slate-300">{report.caloricBalance}</p>
                      <span className="text-[10px] text-slate-500 block">Generated at {report.generatedAt}</span>
                    </div>
                  </div>

                  {/* CRITICAL SECTION: Mistakes & Blind Spots */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                    <div className="flex items-center gap-2 text-rose-400">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Identified Nutritional Mistakes & Pitfalls</span>
                    </div>
                    <ul className="space-y-2">
                      {report.mistakesAndBlindSpots?.map((mistake, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Macro Notes & Tomorrow Fixes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Macro Breakdown */}
                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        Macro Execution
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">{report.macroBreakdown}</p>
                    </div>

                    {/* Actionable Tomorrow Fixes */}
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Action Plan for Tomorrow
                      </span>
                      <ul className="space-y-1.5">
                        {report.actionableTomorrowFixes?.map((fix, idx) => (
                          <li key={idx} className="text-xs text-emerald-200/90 flex items-start gap-2">
                            <span className="font-bold text-emerald-400 shrink-0">#{idx + 1}</span>
                            <span>{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Custom Tailored Meal Suggestion */}
                  {report.customMealSuggestion && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                          Tailored Meal Idea for Today
                        </span>
                        <p className="text-xs text-amber-100/90 leading-relaxed">{report.customMealSuggestion}</p>
                      </div>
                    </div>
                  )}

                  {/* Closing Coach Note */}
                  {report.coachNote && (
                    <div className="p-3 bg-slate-800/40 rounded-xl text-center text-xs text-slate-400 italic">
                      "{report.coachNote}"
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="py-10 text-center space-y-3 bg-slate-800/20 border border-slate-800/60 rounded-3xl p-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Audit Run Yet for Today</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Click "Run Daily Audit Report" to let Gemini AI analyze your logged meals, macro balance, hydration, and phone steps, highlighting exact mistakes to correct.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Tab: Interactive AI Chat */
            <div className="flex flex-col h-[400px] space-y-4">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatSending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700/80 flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Gemini is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything (e.g. 'How can I get 40g more protein?')..."
                  className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatSending}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
