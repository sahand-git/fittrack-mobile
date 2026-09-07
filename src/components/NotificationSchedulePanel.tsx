/* localized-render */
import React, { useState } from 'react';
import { Bell, Droplets, Plus, Trash2 } from 'lucide-react';
import { DEFAULT_REMINDERS, useFitness } from '../context/FitnessContext';
import type { ReminderSettings } from '../types';
import { enableNotifications, notificationStatus } from '../utils/notifications';
import { t, useLocale } from '../utils/locale';

const clone = (value?: ReminderSettings): ReminderSettings => JSON.parse(JSON.stringify(value || DEFAULT_REMINDERS));

export function NotificationSchedulePanel() {
  useLocale();
  const { profile, updateReminderSettings } = useFitness();
  const [settings, setSettings] = useState(() => clone(profile.reminders));
  const [message, setMessage] = useState('');
  const updateMeal = (meal: 'breakfast' | 'lunch' | 'dinner', value: string) => setSettings(current => ({ ...current, mealTimes: { ...current.mealTimes, [meal]: value } }));
  const addSupplement = () => settings.supplements.length < 8 && setSettings(current => ({ ...current, supplements: [...current.supplements, { id: `supp_${Date.now()}`, name: '', amount: '', time: '09:00', enabled: true }] }));

  const save = async () => {
    setMessage('');
    let nextMessage = t('Notification schedule saved.');
    if (settings.enabled) {
      const state = await notificationStatus();
      if (state !== 'granted' && !await enableNotifications()) nextMessage = t('Notifications are blocked in phone settings. Your times were saved.');
    }
    updateReminderSettings(settings);
    setMessage(nextMessage);
  };

  return <section className="space-y-5" aria-labelledby="notification-settings-title">
    <div className="flex items-start gap-3"><span className="app-icon-tile app-icon-attention"><Bell className="w-5 h-5" /></span><div><h2 id="notification-settings-title" className="text-base font-bold text-white">{t('Notifications & Schedule')}</h2><p className="app-copy text-xs text-slate-400 mt-1">{t('Choose your own meal, water, and supplement reminder times.')}</p></div></div>
    <label className="app-toggle-row"><span><strong className="block text-sm text-white">{t('Enable phone reminders')}</strong><small className="app-copy text-slate-400">{t('Phone permission is required before reminders can appear.')}</small></span><input type="checkbox" checked={settings.enabled} onChange={event => setSettings(current => ({ ...current, enabled: event.target.checked }))} className="w-5 h-5 accent-teal-500" /></label>

    <div className="app-settings-group"><h3 className="text-sm font-bold text-white">{t('Meal times')}</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">{(['breakfast', 'lunch', 'dinner'] as const).map(meal => <label key={meal} className="block"><span className="app-field-label">{t(meal[0].toUpperCase() + meal.slice(1))}</span><input type="time" value={settings.mealTimes[meal] || ''} onChange={event => updateMeal(meal, event.target.value)} className="app-field" /></label>)}</div></div>

    <div className="app-settings-group space-y-3"><div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-cyan-300" /><h3 className="text-sm font-bold text-white">{t('Water reminders')}</h3></div><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={settings.water.enabled} onChange={event => setSettings(current => ({ ...current, water: { ...current.water, enabled: event.target.checked } }))} className="w-5 h-5 accent-teal-500" />{t('Remind me to drink water')}</label><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label><span className="app-field-label">{t('Start time')}</span><input type="time" value={settings.water.start} onChange={event => setSettings(current => ({ ...current, water: { ...current.water, start: event.target.value } }))} className="app-field" /></label><label><span className="app-field-label">{t('End time')}</span><input type="time" value={settings.water.end} onChange={event => setSettings(current => ({ ...current, water: { ...current.water, end: event.target.value } }))} className="app-field" /></label><label><span className="app-field-label">{t('Interval')}</span><select value={settings.water.intervalMinutes} onChange={event => setSettings(current => ({ ...current, water: { ...current.water, intervalMinutes: Number(event.target.value) } }))} className="app-field"><option value="60">1h</option><option value="120">2h</option><option value="180">3h</option></select></label></div></div>

    <div className="app-settings-group space-y-3"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-white">{t('Supplement reminders')}</h3><button type="button" onClick={addSupplement} disabled={settings.supplements.length >= 8} className="app-button-secondary app-button-compact disabled:opacity-40"><Plus className="w-4 h-4" />{t('Add supplement')}</button></div>{settings.supplements.map((item, index) => <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem_3rem] gap-2 items-end"><label><span className="app-field-label">{t('Supplement name')}</span><input value={item.name} onChange={event => setSettings(current => ({ ...current, supplements: current.supplements.map((value, i) => i === index ? { ...value, name: event.target.value } : value) }))} className="app-field" /></label><label><span className="app-field-label">{t('Serving')}</span><input value={item.amount} onChange={event => setSettings(current => ({ ...current, supplements: current.supplements.map((value, i) => i === index ? { ...value, amount: event.target.value } : value) }))} className="app-field" placeholder={t('Example: 1 tablet')} /></label><label><span className="app-field-label">{t('Time')}</span><input type="time" value={item.time} onChange={event => setSettings(current => ({ ...current, supplements: current.supplements.map((value, i) => i === index ? { ...value, time: event.target.value } : value) }))} className="app-field" /></label><button type="button" aria-label={t('Delete supplement')} onClick={() => setSettings(current => ({ ...current, supplements: current.supplements.filter((_, i) => i !== index) }))} className="app-icon-button app-danger"><Trash2 className="w-4 h-4" /></button></div>)}<p className="app-copy text-xs text-slate-500">{t('Enter only the supplement and amount you already use. FitTrack does not recommend doses.')}</p></div>

    {message && <p role="status" className="text-xs text-amber-200">{message}</p>}
    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2"><button type="button" onClick={() => { const disabled = { ...settings, enabled: false }; setSettings(disabled); updateReminderSettings(disabled); setMessage(t('Phone reminders disabled.')); }} className="app-button-secondary">{t('Disable reminders')}</button><button type="button" onClick={save} className="app-button-primary">{t('Save schedule')}</button></div>
  </section>;
}
