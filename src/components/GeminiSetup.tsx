import React, { useState } from 'react';
import { t, useLocale } from '../utils/locale';
import { useAIStatus, refreshAIStatus, setAIConsent } from '../utils/gemini';
export function GeminiSetup() {
  useLocale();const status=useAIStatus();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function check(){setBusy(true);setError('');try{await refreshAIStatus();}catch(e){setError(e instanceof Error?e.message:'Could not check AI access.');}finally{setBusy(false);}}
  return <section className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 space-y-3 text-sm text-slate-700" aria-label={t('AI access and privacy')}>
    <h3 className="font-bold text-teal-900">{t('AI access and privacy')}</h3>
    <p>{t('AI is optional. Your requests, selected photos and relevant fitness details are sent through our protected server to Google Gemini only when you use AI.')}</p>
    <p className="text-slate-600">{t('AI estimates can be wrong. Review portions and nutrition before saving. AI does not diagnose conditions or replace professional advice.')}</p>
    {!status.signedIn ? <p role="status">{t('Sign in to check AI availability. Core tracking works offline without an account.')}</p> : <>
      <label className="flex gap-3 items-start"><input type="checkbox" checked={status.consent} onChange={e=>setAIConsent(e.target.checked)} className="mt-1 accent-teal-700"/><span>{t('I allow my selected fitness details and photos to be processed for AI features during this session. I can turn this off at any time.')}</span></label>
      <p role="status">{t(status.checked ? status.enabled ? 'AI access is available.' : 'AI access is not enabled for this account.' : 'Check your account to see AI availability.')}</p>
      {status.enabled && <p>{t('AI requests remaining today')}: <b>{status.remaining} / {status.limit}</b></p>}
      <button type="button" disabled={busy} onClick={check} className="rounded-xl bg-teal-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{t(busy?'Checking access…':'Refresh AI access')}</button>
    </>}
    {error&&<p role="alert" className="text-rose-700">{t(error)}</p>}
  </section>;
}
