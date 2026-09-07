/* localized-render */
import React, { useMemo, useState } from 'react';
import { Check, Pill, X } from 'lucide-react';
import type { NutrientIntakeEntry, NutrientSourceType } from '../types';
import { MICRONUTRIENT_KEYS, NUTRIENT_META, parseNutrientAmount, type MicronutrientKey, type NutrientGroup } from '../utils/micronutrients';
import { t, useLocale } from '../utils/locale';

type IntakeDraft = Omit<NutrientIntakeEntry, 'id'>;
interface Props { isOpen: boolean; date: string; entry?: NutrientIntakeEntry; initialGroup: NutrientGroup; initialSourceType?: NutrientSourceType; onClose: () => void; onSave: (entry: IntakeDraft) => void; }
const localTime = (iso?: string) => { const value = iso ? new Date(iso) : new Date(); return Number.isNaN(value.getTime()) ? '09:00' : value.toTimeString().slice(0, 5); };

export function NutrientIntakeModal({ isOpen, date, entry, initialGroup, initialSourceType = 'manual', onClose, onSave }: Props) {
  useLocale();
  const initialNutrient = entry?.nutrient as MicronutrientKey | undefined;
  const group = initialNutrient ? NUTRIENT_META[initialNutrient].group : initialGroup;
  const options = useMemo(() => MICRONUTRIENT_KEYS.filter(key => NUTRIENT_META[key].group === group), [group]);
  const [nutrient, setNutrient] = useState<MicronutrientKey>(initialNutrient || options[0]);
  const [amountDraft, setAmountDraft] = useState(entry ? String(entry.amount) : '');
  const [sourceType, setSourceType] = useState<NutrientSourceType>(entry?.sourceType || initialSourceType);
  const [sourceName, setSourceName] = useState(entry?.sourceName || '');
  const [note, setNote] = useState(entry?.note || '');
  const [time, setTime] = useState(localTime(entry?.loggedAt));
  const [error, setError] = useState('');
  if (!isOpen) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseNutrientAmount(amountDraft);
    if (amount === null) { setError(t('Enter an amount greater than zero.')); return; }
    onSave({ nutrient, amount, unit: NUTRIENT_META[nutrient].unit, sourceType, sourceName: sourceName.trim() || undefined, note: note.trim() || undefined, loggedAt: new Date(`${date}T${time || '09:00'}:00`).toISOString() });
    onClose();
  };

  return <div className="fixed inset-0 z-[90] app-modal-backdrop" role="dialog" aria-modal="true" aria-label={t(entry ? 'Edit intake' : 'Add intake')}>
    <div className="app-modal w-full max-w-md">
      <div className="app-modal-header"><div className="flex items-center gap-3 min-w-0"><span className="app-icon-tile"><Pill className="w-5 h-5" /></span><div className="min-w-0"><h2 className="text-lg font-bold text-white">{t(entry ? 'Edit intake' : 'Add intake')}</h2><p className="app-copy text-xs text-slate-400">{t('Record the amount you used. FitTrack does not recommend doses.')}</p></div></div><button type="button" onClick={onClose} aria-label={t('Close')} className="app-icon-button"><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="app-modal-body space-y-4">
        <label className="block"><span className="app-field-label">{t(group === 'vitamin' ? 'Vitamin' : 'Mineral')}</span><select className="app-field" value={nutrient} onChange={event => setNutrient(event.target.value as MicronutrientKey)}>{options.map(key => <option key={key} value={key}>{t(NUTRIENT_META[key].label)}</option>)}</select></label>
        <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-3 items-end"><label className="block"><span className="app-field-label">{t('Amount')}</span><input className="app-field" inputMode="decimal" value={amountDraft} onChange={event => { setAmountDraft(event.target.value); setError(''); }} placeholder="0" aria-invalid={!!error} /></label><div className="app-unit-box" dir="ltr">{NUTRIENT_META[nutrient].unit}</div></div>
        {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="block"><span className="app-field-label">{t('Entry type')}</span><select className="app-field" value={sourceType} onChange={event => setSourceType(event.target.value as NutrientSourceType)}><option value="manual">{t('Manual')}</option><option value="supplement">{t('Supplement')}</option></select></label><label className="block"><span className="app-field-label">{t('Time')}</span><input className="app-field" type="time" value={time} onChange={event => setTime(event.target.value)} /></label></div>
        <label className="block"><span className="app-field-label">{t('Source name')} <span className="font-normal text-slate-500">({t('optional')})</span></span><input className="app-field" value={sourceName} onChange={event => setSourceName(event.target.value)} placeholder={t('Example: multivitamin')} /></label>
        <label className="block"><span className="app-field-label">{t('Note')} <span className="font-normal text-slate-500">({t('optional')})</span></span><textarea className="app-field min-h-20 resize-y" value={note} onChange={event => setNote(event.target.value)} /></label>
        <div className="app-modal-footer"><button type="button" onClick={onClose} className="app-button-secondary">{t('Cancel')}</button><button type="submit" className="app-button-primary"><Check className="w-4 h-4" />{t('Save intake')}</button></div>
      </form>
    </div>
  </div>;
}
