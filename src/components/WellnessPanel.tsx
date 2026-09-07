/* localized-render */
import React, { useMemo, useState } from 'react';
import { Bell, Check, Droplets, Pill, Plus, Trash2, X } from 'lucide-react';
import { useFitness, DEFAULT_REMINDERS } from '../context/FitnessContext';
import type { MealType, ReminderSettings } from '../types';
import { MICRONUTRIENT_KEYS, sumMicronutrients, type MicronutrientKey } from '../utils/micronutrients';
import { enableNotifications, notificationStatus } from '../utils/notifications';
import { t, useLocale } from '../utils/locale';

const labels: Record<MicronutrientKey, [string, string]> = {
  calciumMg: ['Calcium', 'mg'], ironMg: ['Iron', 'mg'], magnesiumMg: ['Magnesium', 'mg'],
  potassiumMg: ['Potassium', 'mg'], zincMg: ['Zinc', 'mg'], vitaminCmg: ['Vitamin C', 'mg'],
  vitaminDmcg: ['Vitamin D', 'mcg'], vitaminB12mcg: ['Vitamin B12', 'mcg']
};

const cloneSettings = (value?: ReminderSettings): ReminderSettings => JSON.parse(JSON.stringify(value || DEFAULT_REMINDERS));

export function WellnessPanel() {
  useLocale();
  const { profile, todayLog, updateReminderSettings, markSupplementTaken } = useFitness();
  const [open, setOpen] = useState(!profile.reminderSetupCompleted);
  const [settings, setSettings] = useState(() => cloneSettings(profile.reminders));
  const [message, setMessage] = useState('');
  const foods = Object.values(todayLog.meals).flat();
  const totals = useMemo(() => sumMicronutrients(foods), [foods]);
  const updateMeal = (meal: 'breakfast' | 'lunch' | 'dinner', value: string) => setSettings(current => ({ ...current, mealTimes: { ...current.mealTimes, [meal]: value } }));

  const save = async () => {
    setMessage('');
    if (settings.enabled) {
      const state = await notificationStatus();
      if (state !== 'granted' && !await enableNotifications()) setMessage(t('Notifications are blocked in phone settings. Your times were saved.'));
    }
    updateReminderSettings(settings); setOpen(false);
  };
  const addSupplement = () => settings.supplements.length < 5 && setSettings(current => ({ ...current, supplements: [...current.supplements, { id: `supp_${Date.now()}`, name: '', amount: '', time: '09:00', enabled: true }] }));

  return <>
    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-white flex items-center gap-2"><Pill className="w-5 h-5 text-violet-400" />{t('Vitamins, Minerals & Reminders')}</h3>
          <p className="text-xs text-slate-400 mt-1">{t('Known nutrients from today’s foods. Missing label values are not counted.')}</p>
        </div>
        <button type="button" onClick={() => { setSettings(cloneSettings(profile.reminders)); setOpen(true); }} className="px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold flex items-center gap-2"><Bell className="w-4 h-4" />{t('Reminder settings')}</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MICRONUTRIENT_KEYS.map(key => {
          const total = totals[key]; const [label, unit] = labels[key];
          return <div key={key} className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3 min-w-0">
            <div className="text-[11px] text-slate-400">{t(label)}</div>
            <div className="font-bold text-sm text-white mt-1">{total ? `${total.value} ${unit}` : t('Not available')}</div>
            {total && <div className="text-[10px] text-slate-500 mt-1">{t('from')} {total.coverage} {t(total.coverage === 1 ? 'food' : 'foods')}</div>}
          </div>;
        })}
      </div>
      {!!settings.supplements.length && <div className="flex flex-wrap gap-2">
        {settings.supplements.filter(item => item.enabled).map(item => {
          const taken = (todayLog.supplementsTaken || []).includes(item.id);
          return <button type="button" key={item.id} onClick={() => markSupplementTaken(item.id, !taken)} className={`px-3 py-2 rounded-xl text-xs border flex items-center gap-2 ${taken ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}><Check className="w-4 h-4" />{item.name || t('Supplement')} {taken ? t('Taken') : t('Mark taken')}</button>;
        })}
      </div>}
    </section>

    {open && <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t('Reminder setup')}>
      <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-xl font-black text-white">{t('Choose your reminders')}</h2><p className="text-sm text-slate-400 mt-1">{t('You control every time. You can change these settings later.')}</p></div>
          <button type="button" aria-label={t('Close')} onClick={() => setOpen(false)} className="shrink-0 p-2 rounded-xl bg-slate-800 text-slate-300"><X className="w-5 h-5" /></button>
        </div>
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800"><span className="font-bold">{t('Enable phone reminders')}</span><input type="checkbox" checked={settings.enabled} onChange={event => setSettings(current => ({ ...current, enabled: event.target.checked }))} className="w-5 h-5" /></label>
        <div><h3 className="font-bold mb-2">{t('Meal times')}</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{(['breakfast','lunch','dinner'] as const).map(meal => <label key={meal} className="text-xs text-slate-400">{t(meal[0].toUpperCase() + meal.slice(1))}<input type="time" value={settings.mealTimes[meal] || ''} onChange={event => updateMeal(meal, event.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" /></label>)}</div></div>
        <div className="space-y-2"><h3 className="font-bold flex items-center gap-2"><Droplets className="w-4 h-4 text-cyan-400" />{t('Water reminders')}</h3>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.water.enabled} onChange={event => setSettings(current => ({ ...current, water: { ...current.water, enabled: event.target.checked } }))} />{t('Remind me to drink water')}</label>
          <div className="grid grid-cols-3 gap-2"><input aria-label={t('Start time')} type="time" value={settings.water.start} onChange={event => setSettings(current => ({ ...current, water: {...current.water, start:event.target.value} }))} className="bg-slate-950 border border-slate-700 rounded-xl p-2" /><input aria-label={t('End time')} type="time" value={settings.water.end} onChange={event => setSettings(current => ({ ...current, water: {...current.water, end:event.target.value} }))} className="bg-slate-950 border border-slate-700 rounded-xl p-2" /><select aria-label={t('Interval')} value={settings.water.intervalMinutes} onChange={event => setSettings(current => ({ ...current, water: {...current.water, intervalMinutes:Number(event.target.value)} }))} className="bg-slate-950 border border-slate-700 rounded-xl p-2"><option value="60">1h</option><option value="120">2h</option><option value="180">3h</option></select></div>
        </div>
        <div className="space-y-2"><div className="flex items-center justify-between"><h3 className="font-bold">{t('Supplements')}</h3><button type="button" onClick={addSupplement} disabled={settings.supplements.length >= 5} className="text-xs text-violet-300 flex items-center gap-1 disabled:opacity-40"><Plus className="w-4 h-4" />{t('Add supplement')}</button></div>
          {settings.supplements.map((item, index) => <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center"><input aria-label={t('Supplement name')} placeholder={t('Vitamin D')} value={item.name} onChange={event => setSettings(current => ({...current,supplements:current.supplements.map((value,i)=>i===index?{...value,name:event.target.value}:value)}))} className="min-w-0 w-full bg-slate-950 border border-slate-700 rounded-xl p-2" /><input aria-label={t('Amount')} placeholder={t('Amount')} value={item.amount} onChange={event => setSettings(current => ({...current,supplements:current.supplements.map((value,i)=>i===index?{...value,amount:event.target.value}:value)}))} className="min-w-0 w-full bg-slate-950 border border-slate-700 rounded-xl p-2" /><input aria-label={t('Time')} type="time" value={item.time} onChange={event => setSettings(current => ({...current,supplements:current.supplements.map((value,i)=>i===index?{...value,time:event.target.value}:value)}))} className="w-full sm:w-[6.5rem] bg-slate-950 border border-slate-700 rounded-xl p-2" /><button type="button" aria-label={t('Delete supplement')} onClick={() => setSettings(current => ({...current,supplements:current.supplements.filter((_,i)=>i!==index)}))} className="justify-self-end p-2 text-rose-400"><Trash2 className="w-4 h-4" /></button></div>)}
          <p className="text-[11px] text-slate-500">{t('Enter only the supplement and amount you already use. FitTrack does not recommend doses.')}</p>
        </div>
        {message && <p className="text-xs text-amber-300">{message}</p>}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2"><button type="button" onClick={() => { updateReminderSettings({...settings,enabled:false}); setOpen(false); }} className="px-4 py-2 rounded-xl text-slate-400">{t('Skip reminders')}</button><button type="button" onClick={save} className="px-5 py-2 rounded-xl bg-violet-500 text-white font-bold">{t('Save reminder choices')}</button></div>
      </div>
    </div>}
  </>;
}
