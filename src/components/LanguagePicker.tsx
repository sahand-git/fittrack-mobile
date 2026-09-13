import React from 'react';
import { Globe } from 'lucide-react';
import { getLocale, setLocale, useLocale, type Locale } from '../utils/locale';
import { tokens } from '../theme/tokens';

export function LanguagePicker() {
  useLocale();
  return (
    <div className="language-picker flex items-center text-xs">
      <label htmlFor="fittrack-language" className="sr-only">Language / زمان / اللغة</label>
      <div className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/90 hover:bg-slate-100/90 text-slate-800 shadow-2xs transition-all flex items-center gap-1 sm:gap-1.5 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 shrink-0">
        <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0 pointer-events-none" strokeWidth={tokens.icons.strokeWidth} />
        <select
          id="fittrack-language"
          aria-label="Language / زمان / اللغة"
          value={getLocale()}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="bg-transparent border-0 text-slate-800 text-[11px] sm:text-xs font-bold cursor-pointer focus:outline-none py-0.5 pe-0.5 max-w-[80px] sm:max-w-none truncate"
          dir="auto"
        >
          <option value="en" className="bg-white text-slate-900 py-1 font-sans">English</option>
          <option value="ckb" className="bg-white text-slate-900 py-1 font-sans">کوردیی سۆرانی</option>
          <option value="ar" className="bg-white text-slate-900 py-1 font-sans">العربية</option>
        </select>
      </div>
    </div>
  );
}
