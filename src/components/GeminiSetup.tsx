import React, { useState } from 'react';
import { hasGeminiKey, clearGeminiKey, availableGeminiModels, connectGemini, getGeminiModel } from '../utils/gemini';

export function GeminiSetup() {
  const [configured, setConfigured] = useState(hasGeminiKey);
  const [key, setKey] = useState('');
  const [consent, setConsent] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const check = async () => {
    if (busy || !consent) return;
    setBusy(true); setError('');
    try {
      if (!models.length) {
        const available = await availableGeminiModels(key);
        setModels(available); setModel(available[0]);
      } else {
        await connectGemini(key, model);
        setKey(''); setConfigured(true);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Connection test failed.'); }
    finally { setBusy(false); }
  };
  return <details className="rounded-xl border border-slate-700 p-3 text-xs text-slate-300" open={!configured}>
    <summary className="cursor-pointer font-bold text-cyan-300">Gemini setup — {configured ? 'connected for this session' : 'setup required'}</summary>
    <div className="space-y-3 mt-3">
      <p>Smart Text, Calculate Macros, and AI Coach use the Gemini API. Google sign-in and a Gemini chat subscription do not supply an API key.</p>
      <p>Optional: use your own key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-cyan-300 underline">Google AI Studio</a>. Your project’s API limits and charges apply. The key is kept only while this app session is open and is excluded from backups.</p>
      <p>The connection test sends only a short test prompt, not your fitness data.</p>
      {configured ? <>
        <p role="status" className="text-emerald-300 break-words">Connection tested successfully · {getGeminiModel()}</p>
        <button type="button" onClick={() => { clearGeminiKey(); setConfigured(false); setConsent(false); setModels([]); setError(''); }} className="text-rose-300 underline">Disconnect or change Gemini model</button>
      </> : <>
        <label className="block">Your Gemini API key
          <input aria-label="Gemini API key" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} value={key} disabled={busy} onChange={e => { setKey(e.target.value); setModels([]); setError(''); }} className="block w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700" />
        </label>
        <label className="flex items-start gap-2"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 shrink-0" />
          <span>I allow connection testing and sending my AI requests and relevant fitness details (age, measurements, goals, meals and activity) to Google when I use AI. My Gmail inbox is not accessed.</span>
        </label>
        {models.length > 0 && <label className="block">Available text model
          <select aria-label="Gemini model" value={model} disabled={busy} onChange={e=>setModel(e.target.value)} className="block w-full p-2 mt-1 bg-slate-950 rounded-lg border border-slate-700">{models.map(m=><option key={m}>{m}</option>)}</select>
          <span className="block mt-1 text-slate-400">Listed by Google for this key. Availability, cost and quota differ by model.</span>
        </label>}
        <button type="button" disabled={!consent || !key.trim() || busy} onClick={check} className="px-3 py-2 rounded-lg bg-cyan-700 text-white disabled:opacity-40">{busy ? 'Checking Google…' : models.length ? 'Test connection & enable Gemini' : 'Check key & load models'}</button>
      </>}
      {error && <p role="alert" className="text-rose-300 break-words">{error}</p>}
    </div>
  </details>;
}
