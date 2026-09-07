/* localized-render */
import React, { useMemo, useState } from 'react';
import { Bell, Check, Edit3, FlaskConical, Plus, Trash2 } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import type { NutrientIntakeEntry } from '../types';
import { combineNutrientTotals, MICRONUTRIENT_KEYS, NUTRIENT_META, sumMicronutrients, sumNutrientEntries, type MicronutrientKey, type NutrientGroup } from '../utils/micronutrients';
import { t, useLocale } from '../utils/locale';
import { NutrientIntakeModal } from './NutrientIntakeModal';

interface Props { onOpenNotifications: () => void; }

export function WellnessPanel({ onOpenNotifications }: Props) {
  useLocale();
  const { profile, todayLog, currentDate, markSupplementTaken, addNutrientIntake, updateNutrientIntake, removeNutrientIntake } = useFitness();
  const [group, setGroup] = useState<NutrientGroup>('vitamin');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<NutrientIntakeEntry>();
  const [initialSource, setInitialSource] = useState<'manual' | 'supplement'>('manual');
  const foods = Object.values(todayLog.meals).flat();
  const foodTotals = useMemo(() => sumMicronutrients(foods), [foods]);
  const entryTotals = useMemo(() => sumNutrientEntries(todayLog.nutrientIntakes || []), [todayLog.nutrientIntakes]);
  const scheduledTotals = useMemo(() => {
    const result: Partial<Record<MicronutrientKey, number>> = {};
    const taken = new Set(todayLog.supplementsTaken || []);
    for (const supplement of profile.reminders?.supplements || []) {
      if (!taken.has(supplement.id) || !supplement.nutrients) continue;
      for (const key of MICRONUTRIENT_KEYS) {
        const value = supplement.nutrients[key];
        if (value !== undefined) result[key] = Math.round(((result[key] || 0) + value) * 100) / 100;
      }
    }
    return result;
  }, [profile.reminders?.supplements, todayLog.supplementsTaken]);
  const totals = useMemo(() => combineNutrientTotals(foodTotals, entryTotals, scheduledTotals), [foodTotals, entryTotals, scheduledTotals]);
  const keys = MICRONUTRIENT_KEYS.filter(key => NUTRIENT_META[key].group === group);
  const entries = (todayLog.nutrientIntakes || []).filter(entry => NUTRIENT_META[entry.nutrient].group === group);
  const supplements = profile.reminders?.supplements || [];

  const openNew = (source: 'manual' | 'supplement') => { setEditing(undefined); setInitialSource(source); setEditorOpen(true); };
  const remove = (entry: NutrientIntakeEntry) => { if (window.confirm(t('Delete this intake?'))) removeNutrientIntake(entry.id); };

  return <>
    <section className="app-surface space-y-5" aria-labelledby="nutrition-title">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0"><span className="app-icon-tile"><FlaskConical className="w-5 h-5" /></span><div className="min-w-0"><h3 id="nutrition-title" className="text-base font-bold text-white">{t('Nutrition')}</h3><p className="app-copy text-xs text-slate-400 mt-1">{t('Track nutrients from food and amounts you add yourself.')}</p></div></div>
        <button type="button" onClick={onOpenNotifications} className="app-icon-button shrink-0" aria-label={t('Notifications & Schedule')} title={t('Notifications & Schedule')}><Bell className="w-5 h-5" /></button>
      </div>

      <div className="app-tab-list" role="tablist" aria-label={t('Nutrient group')}>
        {(['vitamin', 'mineral'] as const).map(value => <button key={value} type="button" role="tab" aria-selected={group === value} onClick={() => setGroup(value)} className={`app-tab ${group === value ? 'app-tab-active' : ''}`}>{t(value === 'vitamin' ? 'Vitamins' : 'Minerals')}</button>)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {keys.map(key => { const meta = NUTRIENT_META[key]; const total = totals[key]; const added = total.manual + total.supplement; return <article key={key} className="app-surface-muted p-4"><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold text-white">{t(meta.label)}</h4><span className="app-unit-pill" dir="ltr">{meta.unit}</span></div><div className="mt-3 text-2xl font-black text-teal-200" dir="ltr">{total.total ? `${total.total} ${meta.unit}` : '—'}</div><dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-slate-500">{t('Food')}</dt><dd className="text-slate-200 mt-0.5" dir="ltr">{total.coverage ? `${total.food} ${meta.unit}` : '—'}</dd></div><div><dt className="text-slate-500">{t('Added')}</dt><dd className="text-slate-200 mt-0.5" dir="ltr">{added ? `${added} ${meta.unit}` : '—'}</dd></div></dl></article>; })}
      </div>

      <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-white">{t('Today’s entries')}</h4><button type="button" onClick={() => openNew('manual')} className="app-button-primary app-button-compact"><Plus className="w-4 h-4" />{t('Add intake')}</button></div>
      {entries.length ? <div className="space-y-2">{entries.map(entry => <div key={entry.id} className="app-list-row"><div className="min-w-0"><div className="font-semibold text-sm text-white">{t(NUTRIENT_META[entry.nutrient].label)}</div><div className="app-copy text-xs text-slate-400 mt-1"><span dir="ltr">{entry.amount} {entry.unit}</span>{entry.sourceName ? ` · ${entry.sourceName}` : ''}{` · ${new Date(entry.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</div>{entry.note && <p className="app-copy text-xs text-slate-500 mt-1">{entry.note}</p>}</div><div className="flex gap-1 shrink-0"><button type="button" className="app-icon-button" aria-label={t('Edit intake')} onClick={() => { setEditing(entry); setEditorOpen(true); }}><Edit3 className="w-4 h-4" /></button><button type="button" className="app-icon-button app-danger" aria-label={t('Delete intake')} onClick={() => remove(entry)}><Trash2 className="w-4 h-4" /></button></div></div>)}</div> : <p className="app-empty-state">{t('No vitamin or mineral intake added for this day.')}</p>}

      <div className="border-t border-slate-700/60 pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-bold text-white">{t('Supplements')}</h4><p className="app-copy text-xs text-slate-500 mt-1">{t('Log supplements here. Change reminder times in Settings.')}</p></div><button type="button" onClick={() => openNew('supplement')} className="app-button-secondary app-button-compact"><Plus className="w-4 h-4" />{t('Log supplement')}</button></div>
        {!!supplements.length && <div className="app-scroll-row flex gap-2 pb-1">{supplements.filter(item => item.enabled).map(item => { const taken = (todayLog.supplementsTaken || []).includes(item.id); return <button type="button" key={item.id} onClick={() => markSupplementTaken(item.id, !taken)} className={`app-chip ${taken ? 'app-chip-active' : ''}`}><Check className="w-4 h-4" />{item.name || t('Supplement')} · {taken ? t('Taken') : t('Mark taken')}</button>; })}</div>}
      </div>
    </section>
    {editorOpen && <NutrientIntakeModal isOpen={editorOpen} date={currentDate} entry={editing} initialGroup={editing ? NUTRIENT_META[editing.nutrient].group : group} initialSourceType={initialSource} onClose={() => { setEditorOpen(false); setEditing(undefined); }} onSave={value => editing ? updateNutrientIntake(editing.id, value) : addNutrientIntake(value)} />}
  </>;
}
