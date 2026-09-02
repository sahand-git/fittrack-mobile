import React, { useState } from 'react';
import { hasGeminiKey, setGeminiKey, clearGeminiKey } from '../utils/gemini';

export function GeminiSetup() {
  const [configured, setConfigured] = useState(hasGeminiKey);
  const [key, setKey] = useState('');
  const [consent, setConsent] = useState(false);
  return <details className="rounded-xl border border-slate-700 p-3 text-xs text-slate-300" open={!configured}>
    <summary className="cursor-pointer font-bold text-cyan-300">Gemini setup — {configured ? 'key set for this session' : 'setup required'}</summary>
    <div className="space-y-3 mt-3">
      <p>Smart Text, Calculate Macros, and AI Coach use the Gemini API. Google sign-in and a Gemini chat subscription do not supply an API key.</p>
      <p>Optional: use your own key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-cyan-300 underline">Google AI Studio</a>. Your project’s API limits and charges apply. The key is kept only while this app session is open and is excluded from backups.</p>
      {configured ? <button type="button" onClick={() => { clearGeminiKey(); setConfigured(false); setConsent(false); }} className="text-rose-300 underline">Disconnect Gemini and clear key</button> : <>
        <label className="block">Your Gemini API key
          <input aria-label="Gemini API key" type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} className="block w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700" />
        </label>
        <label className="flex items-start gap-2"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 shrink-0" />
          <span>I allow FitTrack to send my AI requests and relevant fitness details (age, body measurements, goals, meals and activity) to Google when I use AI. My Gmail inbox is not accessed.</span>
        </label>
        <button type="button" disabled={!consent || !key.trim()} onClick={() => { setGeminiKey(key); setKey(''); setConfigured(true); }} className="px-3 py-2 rounded-lg bg-cyan-700 text-white disabled:opacity-40">Allow Gemini for this session</button>
      </>}
    </div>
  </details>;
}
