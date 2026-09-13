/* localized-render */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Pill,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Bell,
  Send,
  Edit3,
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { t, useLocale } from '../utils/locale';
import { requestNotificationPermission } from '../utils/notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { tokens } from '../theme/tokens';
import confetti from 'canvas-confetti';
import { PremiumFeature } from '../types';

interface SupplementTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpgradeModal?: (feature: PremiumFeature) => void;
}

const PRESET_SUPPLEMENTS = [
  { name: 'Vitamin D3', category: 'vitamin' as const, dosage: '2000 IU', icon: '☀️', color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { name: 'Vitamin C', category: 'vitamin' as const, dosage: '1000 mg', icon: '🍊', color: 'bg-orange-50 border-orange-200 text-orange-900' },
  { name: 'Zinc', category: 'mineral' as const, dosage: '25 mg', icon: '🛡️', color: 'bg-teal-50 border-teal-200 text-teal-900' },
  { name: 'Magnesium', category: 'mineral' as const, dosage: '400 mg', icon: '⚡', color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
  { name: 'Daily Multivitamin', category: 'supplement' as const, dosage: '1 tablet', icon: '💊', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { name: 'Iron', category: 'mineral' as const, dosage: '18 mg', icon: '🩸', color: 'bg-rose-50 border-rose-200 text-rose-900' },
  { name: 'Calcium', category: 'mineral' as const, dosage: '600 mg', icon: '🦴', color: 'bg-sky-50 border-sky-200 text-sky-900' },
  { name: 'Vitamin B12', category: 'vitamin' as const, dosage: '500 mcg', icon: '🧠', color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900' },
  { name: 'Omega-3 Fish Oil', category: 'supplement' as const, dosage: '1000 mg', icon: '🐟', color: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
];

const DOSAGE_CHIPS = ['1 tablet', '1 capsule', '500 mg', '1000 mg', '2000 IU', '5 g', '1 scoop'];

export const SupplementTrackerModal: React.FC<SupplementTrackerModalProps> = ({ isOpen, onClose, onOpenUpgradeModal }) => {
  useLocale();
  const { todayLog, profile, logSupplement, removeSupplement, updateProfile, isPremium } = useFitness();

  const [activeTab, setActiveTab] = useState<'write' | 'presets' | 'schedule'>('write');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'vitamin' | 'mineral' | 'supplement' | 'other'>('vitamin');
  const [customDosage, setCustomDosage] = useState('1 tablet');
  const [customTime, setCustomTime] = useState<'morning' | 'noon' | 'evening' | 'bedtime'>('morning');
  const [customNote, setCustomNote] = useState('');
  const [testNotifSuccess, setTestNotifSuccess] = useState(false);

  if (!isOpen) return null;

  const currentSchedule = profile.supplementSchedule || {
    enabled: true,
    frequency: 'daily_morning'
  };

  const loggedList = todayLog.supplements || [];

  const handleLogPreset = (item: typeof PRESET_SUPPLEMENTS[0]) => {
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    logSupplement({
      name: item.name,
      category: item.category,
      dosage: item.dosage,
      icon: item.icon
    });
    try {
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.75 } });
    } catch {}
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    if (!customName.trim()) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }

    const categoryIcons: Record<string, string> = {
      vitamin: '💊',
      mineral: '🛡️',
      supplement: '🌿',
      other: '⚡'
    };

    const dosageFinal = customDosage.trim() || '1 dose';
    const timeLabel = customTime === 'morning' ? t('Morning')
      : customTime === 'noon' ? t('Lunch')
      : customTime === 'evening' ? t('Evening')
      : t('Bedtime');

    const displayDosage = customNote.trim()
      ? `${dosageFinal} (${timeLabel} - ${customNote.trim()})`
      : `${dosageFinal} (${timeLabel})`;

    logSupplement({
      name: customName.trim(),
      category: customCategory,
      dosage: displayDosage,
      icon: categoryIcons[customCategory] || '💊'
    });

    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.75 } });
    } catch {}

    setCustomName('');
    setCustomNote('');
  };

  const handleScheduleChange = (frequency: any) => {
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    updateProfile({
      supplementSchedule: {
        enabled: currentSchedule.enabled,
        frequency
      }
    });
  };

  const handleToggleSchedule = async (enabled: boolean) => {
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    if (enabled) {
      await requestNotificationPermission();
    }
    updateProfile({
      supplementSchedule: {
        ...currentSchedule,
        enabled
      }
    });
  };

  const handleTestNotification = async () => {
    if (!isPremium && onOpenUpgradeModal) {
      onOpenUpgradeModal('vitamins');
      return;
    }
    const hasPerm = await requestNotificationPermission();
    if (!hasPerm) return;

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 99999,
              title: t("Vitamin & Supplement Check 💊"),
              body: t("Time for your daily vitamins and supplements to maintain peak health!"),
              channelId: 'fittrack_vitamins',
              schedule: { at: new Date(Date.now() + 500) }
            }
          ]
        });
        setTestNotifSuccess(true);
        setTimeout(() => setTestNotifSuccess(false), 3000);
      } catch (err) {
        console.warn('Native notification test error:', err);
      }
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(t("Vitamin & Supplement Check 💊"), {
        body: t("Time for your daily vitamins and supplements to maintain peak health!"),
        icon: '/food-images/1f964.svg'
      });
      setTestNotifSuccess(true);
      setTimeout(() => setTestNotifSuccess(false), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
              <Pill className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{t("Vitamins & Daily Supplements")}</span>
                {!isPremium ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 font-mono shrink-0 whitespace-nowrap">
                    PRO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-mono shrink-0 whitespace-nowrap">
                    {loggedList.length} {t("logged")}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t("Enter custom supplements or choose quick presets")}
              </p>
            </div>
          </div>
          <button aria-label={t("Close")}
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={tokens.icons.strokeWidth} />
          </button>
        </div>

        {/* 3-Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'write'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
            <span>{t("Enter by Writing")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
            <span>{t("Quick Presets")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
            <span>{t("Reminder")}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: Enter by Writing */}
          {activeTab === 'write' && (
            <form onSubmit={handleAddCustom} className="space-y-4">
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t("Supplement / Vitamin Name")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t("e.g. Vitamin D3, Creatine Monohydrate, Zinc, Biotin...")}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  />
                </div>

                {/* Category Pills */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {t("Category")}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'vitamin', label: 'Vitamin', icon: '💊' },
                      { id: 'mineral', label: 'Mineral', icon: '🛡️' },
                      { id: 'supplement', label: 'Supplement', icon: '🌿' },
                      { id: 'other', label: 'Fitness', icon: '⚡' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCustomCategory(cat.id as any)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                          customCategory === cat.id
                            ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="text-sm">{cat.icon}</span>
                        <span className="text-[11px] truncate">{t(cat.label)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dosage Input + Quick Suggestion Chips */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t("Dosage & Quantity")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t("e.g. 500 mg, 1 tablet, 5g")}
                    value={customDosage}
                    onChange={(e) => setCustomDosage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors mb-2"
                  />

                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {DOSAGE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCustomDosage(chip)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                          customDosage === chip
                            ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timing Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
                    <span>{t("Intake Time")}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'morning', label: 'Morning' },
                      { id: 'noon', label: 'Lunch' },
                      { id: 'evening', label: 'Evening' },
                      { id: 'bedtime', label: 'Bedtime' },
                    ].map((time) => (
                      <button
                        key={time.id}
                        type="button"
                        onClick={() => setCustomTime(time.id as any)}
                        className={`py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                          customTime === time.id
                            ? 'bg-teal-50 border-teal-300 text-teal-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t(time.label)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {t("Optional Note (e.g. With meal, before gym)")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("e.g. Take with water after breakfast")}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer mt-2 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
                  <span>{t("Save & Log Supplement")}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Quick Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                {t("Tap any essential vitamin or mineral to log instantly:")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_SUPPLEMENTS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleLogPreset(item)}
                    className={`p-3 rounded-2xl border ${item.color} text-start transition-all active:scale-95 flex flex-col justify-between hover:shadow-sm`}
                  >
                    <div className="flex items-center justify-between text-base font-bold">
                      <span>{item.icon}</span>
                      <span className="text-[10px] font-mono font-bold bg-white/70 px-1.5 py-0.5 rounded border border-black/5">{item.dosage}</span>
                    </div>
                    <span className="text-xs font-black mt-2 truncate block">
                      {t(item.name)}
                    </span>
                    <span className="text-[10px] opacity-75 capitalize mt-0.5 block font-medium">
                      {t(item.category)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Schedule & Notification Interval */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {/* Enable Switch */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-center justify-between gap-3 text-start">
                <div className="flex items-center gap-3 text-start min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
                  </div>
                  <div className="text-start min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-slate-900">
                      {t("Send Reminders to Phone Screen")}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t("Pushes alerts to your Android status bar & lock screen")}
                    </p>
                  </div>
                </div>

                <div dir="ltr" className="inline-flex shrink-0 ms-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSchedule(!currentSchedule.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      currentSchedule.enabled ? 'bg-teal-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentSchedule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Frequency Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {t("How often should Calorie Pewar ask for vitamin checks?")}
                </label>

                {[
                  { id: 'daily_morning', label: 'Once Daily (Morning 9:00 AM)', desc: 'Standard for Vitamin D, Multivitamins, & Vitamin C' },
                  { id: 'twice_daily', label: 'Twice Daily (Morning 9:00 AM & Evening 8:00 PM)', desc: 'Best for morning energy vitamins & evening minerals (Magnesium/Zinc)' },
                  { id: 'interval_4h', label: 'Every 4 Hours Check', desc: 'Frequent hydration & supplement reminder throughout daytime' },
                  { id: 'interval_6h', label: 'Every 6 Hours Check', desc: 'Periodic check for active fitness routines' },
                  { id: 'interval_8h', label: 'Every 8 Hours Check', desc: 'Morning, Afternoon, and Evening checks' },
                  { id: 'interval_12h', label: 'Every 12 Hours Check', desc: 'Twice-daily spaced supplement routine' },
                ].map((item) => {
                  const isSelected = currentSchedule.frequency === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleScheduleChange(item.id)}
                      className={`w-full p-3 rounded-xl border text-start transition-all ${
                        isSelected
                          ? 'bg-teal-50 border-teal-300 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={isSelected ? 'text-teal-900' : 'text-slate-800'}>
                          {t(item.label)}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{t(item.desc)}</p>
                    </button>
                  );
                })}
              </div>

              {/* Test Phone Notification Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
                  <span>{t("Test Phone Screen Notification Now")}</span>
                </button>
                {testNotifSuccess && (
                  <p className="text-[11px] text-teal-700 font-bold text-center mt-1.5 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
                    <span>{t("Notification dispatched to your phone status bar!")}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Today's Logged Supplements List (Always visible below active tab) */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" strokeWidth={tokens.icons.strokeWidth} />
                <span>{t("Taken Today")}</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                {loggedList.length} {t("recorded")}
              </span>
            </div>

            {loggedList.length > 0 ? (
              <div className="space-y-2">
                {loggedList.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{entry.icon || '💊'}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{t(entry.name)}</span>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">
                          {entry.dosage} • {entry.loggedAt}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={t("Delete supplement")}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                          navigator.vibrate(20);
                        }
                        removeSupplement(entry.id);
                      }}
                      className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 active:scale-90 transition-all border border-slate-200 shrink-0 shadow-xs"
                      title={t("Delete")}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={tokens.icons.strokeWidth} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p>{t("No vitamins or supplements logged yet today.")}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{t("Write or tap a preset above to log.")}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
