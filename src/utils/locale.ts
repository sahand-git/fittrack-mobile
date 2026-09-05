import { useSyncExternalStore } from 'react';
import ar from '../locales/ar.json';
import ckb from '../locales/ckb.json';
import { detectLocale, normalizeSearch, translateText, type Locale } from './localeCore';
export { normalizeSearch } from './localeCore';
export type { Locale } from './localeCore';

const storageKey = 'fittrack_language_v1';
const listeners = new Set<()=>void>();
function initialLocale(): Locale {
  try { const saved=localStorage.getItem(storageKey); if(saved==='en'||saved==='ar'||saved==='ckb')return saved; } catch {}
  return detectLocale(typeof navigator==='undefined'?'en':navigator.language);
}
let language:Locale=initialLocale();
export const getLocale=()=>language;
export const localeTag=()=>language==='ckb'?'ckb-IQ':language==='ar'?'ar-IQ':'en-US';
export const languageName=()=>language==='ckb'?'Kurdish Sorani (Arabic-based script)':language==='ar'?'Arabic':'English';
export const aiLanguageInstruction=()=>` Write all user-facing prose in ${languageName()}. Keep JSON property names exactly as requested.`;
function applyDirection(){if(typeof document!=='undefined'){document.documentElement.lang=language;document.documentElement.dir=language==='en'?'ltr':'rtl';}}
applyDirection();
export function setLocale(next:Locale){language=next;try{localStorage.setItem(storageKey,next);}catch{}applyDirection();listeners.forEach(fn=>fn());}
export function useLocale(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},getLocale,()=> 'en' as Locale);}
// Only known labels are translated. User records and external food names remain intact.
export function t<T>(value:T):T {return (typeof value==='string'&&language!=='en'?translateText(value,language==='ar'?ar:ckb):value) as T;}
export function matchesLocalized(query:string,...values:(string|undefined)[]):boolean {
  const needle=normalizeSearch(query);
  return values.some(value=>value!==undefined&&[value,translateText(value,ar),translateText(value,ckb)].some(v=>normalizeSearch(v).includes(needle)));
}
