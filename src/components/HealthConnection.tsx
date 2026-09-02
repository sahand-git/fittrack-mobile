import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';
import { useFitness } from '../context/FitnessContext';
import { readHealthSteps } from '../utils/health';

export function HealthConnection() {
  const { currentDate, updateSteps } = useFitness();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const platform = Capacitor.getPlatform();
  const native = platform === 'ios' || platform === 'android';
  const service = platform === 'ios' ? 'Apple Health' : 'Health Connect';

  async function sync() {
    setBusy(true);
    setMessage('Requesting step access…');
    try {
      const steps = await readHealthSteps(currentDate);
      if (steps === null) {
        setMessage('No readable steps were returned for this date. Check health permissions and the date in your health app. Your saved total has not changed.');
      } else {
        // Replace the total, rather than adding it again on every sync.
        updateSteps(steps);
        setMessage(`Read ${steps.toLocaleString()} steps from ${service} for ${currentDate}.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read steps. Check health permissions and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
      <h3 className="text-sm font-bold text-white">Health app connection</h3>
      {native ? <>
        <p className="text-xs text-slate-300">Read steps for {currentDate} from {service}. This replaces the day's saved total. Only step-reading permission is requested.</p>
        <button type="button" onClick={sync} disabled={busy} className="w-full py-2 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold disabled:opacity-50">
          {busy ? 'Reading steps…' : `Connect & read ${service} steps`}
        </button>
        {platform === 'android' && <>
          <p className="text-xs text-slate-400">For Samsung Health, enable step sharing with Health Connect in Samsung Health settings first. Other apps must also share their steps with Health Connect.</p>
          <button type="button" onClick={() => Health.openHealthConnectSettings().catch(() => setMessage('Open Health Connect in Android Settings to manage permissions.'))} className="text-xs text-emerald-400 underline">Open Health Connect settings</button>
        </>}
        {platform === 'ios' && <p className="text-xs text-slate-400">Allow step access in Apple Health. If no data appears, check this app's permissions in Health settings.</p>}
      </> : <>
        <p className="text-xs text-slate-300">Direct health access needs the installed Android or iPhone app. This browser version cannot read Apple Health or Health Connect, even when added to your home screen.</p>
        <p className="text-xs text-slate-400">You can enter the actual step total shown in your health app below, or use Phone Sensor while this page stays open.</p>
      </>}
      {message && <p role="status" className="text-xs text-amber-300">{message}</p>}
    </section>
  );
}
