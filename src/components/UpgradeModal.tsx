import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { t, useLocale } from '../utils/locale';
import { GeminiSetup } from './GeminiSetup';
import type { PremiumFeature } from '../types';
export function UpgradeModal({isOpen,onClose}: {isOpen:boolean;onClose:()=>void;feature?:PremiumFeature|null}) {
  useLocale();if(!isOpen)return null;
  return <div id="upgrade-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section role="dialog" aria-modal="true" aria-labelledby="access-title" className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between gap-3"><h2 id="access-title" className="flex gap-2 items-center text-xl font-bold"><ShieldCheck className="text-teal-700"/>{t('Account access')}</h2><button type="button" aria-label={t('Close')} onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X/></button></div>
      <p className="text-slate-600">{t('AI features require account access and a daily usage allowance. Availability is checked securely by our server.')}</p>
      <GeminiSetup/>
      <p className="text-sm text-slate-600">{t('Questions about access?')} <a href="mailto:sahandabas2@gmail.com" className="text-teal-800 underline" dir="ltr">sahandabas2@gmail.com</a></p>
      <button type="button" onClick={onClose} className="w-full rounded-xl border border-slate-300 py-3 font-semibold">{t('Continue tracking')}</button>
    </section>
  </div>;
}
