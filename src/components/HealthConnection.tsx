/* localized-render */
import { t, useLocale, localeTag } from "../utils/locale";
import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';
import { useFitness } from '../context/FitnessContext';
import { readHealthSteps } from '../utils/health';
import { Activity, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { formatDateDisplay } from '../utils/date';

export function HealthConnection() {
  useLocale();
  const { currentDate, updateSteps } = useFitness();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const platform = Capacitor.getPlatform();
  const native = platform === 'ios' || platform === 'android';
  const service = platform === 'ios' ? 'Apple Health' : 'Google Health Connect';

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
        setMessage(`Read ${steps.toLocaleString(localeTag())} steps from ${service} for ${formatDateDisplay(currentDate)}.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read steps. Check health permissions and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>{t("Health App Integration")}</span>
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 font-bold border border-emerald-200">
          {service}
        </span>
      </div>

      {native ? (
        <>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {t("Sync steps for ")}<span className="font-bold text-slate-900">{formatDateDisplay(currentDate)}</span>{t(" directly from ")}<span className="font-bold text-slate-900">{service}</span>{t(". This accurately reflects your smartwatch steps.")}
          </p>

          <button
            type="button"
            onClick={sync}
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            <span>{t(busy ? 'Reading steps…' : `Sync ${service} Steps`)}</span>
          </button>

          {platform === 'android' && (
            <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
              <p className="text-[11px] text-slate-500 font-medium">
                {t("Galaxy Watch, Wear OS, Garmin & Pixel Watch sync automatically into Health Connect. Ensure Samsung Health / Garmin has Health Connect sharing enabled.")}
              </p>
              <button
                type="button"
                onClick={() =>
                  Health.openHealthConnectSettings().catch(() =>
                    setMessage('Open Health Connect in Android Settings to manage permissions.')
                  )
                }
                className="text-xs text-teal-700 hover:text-teal-800 font-bold underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t("Open Android Health Connect settings")}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {platform === 'ios' && (
            <p className="text-[11px] text-slate-500 font-medium">
              {t("Allow step access in Apple Health. If no data appears, check Calorie Pewar permissions in iOS Settings > Health.")}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {t("Direct Health Connect sync is enabled inside the installed Android APK. When using web preview, please use the installed app or phone sensors.")}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {t("You can enter your smartwatch total using the manual step inputs below.")}
          </p>
        </>
      )}

      {message && (
        <p role="status" className="text-xs text-teal-800 bg-teal-50 border border-teal-200 p-2.5 rounded-xl font-medium">
          {t(message)}
        </p>
      )}
    </section>
  );
}
