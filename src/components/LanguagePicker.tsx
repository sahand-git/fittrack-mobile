import {getLocale, setLocale, useLocale, type Locale} from '../utils/locale';

export function LanguagePicker(){
  useLocale();
  return <div className="language-picker flex items-center gap-2 text-xs">
    <label htmlFor="fittrack-language" className="sr-only">Language / زمان / اللغة</label>
    <select id="fittrack-language" aria-label="Language / زمان / اللغة" value={getLocale()} onChange={e=>setLocale(e.target.value as Locale)} className="max-w-full rounded-xl border border-slate-700 bg-slate-900 text-white px-3 py-2" dir="auto">
      <option value="en">English</option><option value="ckb">کوردیی سۆرانی</option><option value="ar">العربية</option>
    </select>
  </div>;
}
