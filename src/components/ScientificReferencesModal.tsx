import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { t, useLocale } from '../utils/locale';
const sections=[
 {title:'Food data and regional recipes',body:'Packaged food data comes from Open Food Facts contributors. Compare it with the package label. Regional dishes are recipe estimates: ingredients, oil and portion sizes vary. Adjust portions before saving.',link:'https://support.openfoodfacts.org/help/en-gb/9-open-food-facts/29-is-the-information-and-data-on-products-verified',label:'Open Food Facts data quality'},
 {title:'Daily calorie targets',body:'Targets use the Mifflin–St Jeor equation and an activity multiplier. These are starting estimates, not measured energy needs. The activity multiplier already includes usual exercise; workouts are not added again.',link:'https://pubmed.ncbi.nlm.nih.gov/2305711/',label:'Original Mifflin–St Jeor study'},
 {title:'Exercise and steps',body:'Workout calories use estimated MET values and duration. Step calories use a rough weight-adjusted estimate. Phone movement, stride and device differences affect accuracy.',link:'https://pacompendium.com/adult-compendium/',label:'2024 Adult Compendium'},
 {title:'AI and micronutrients',body:'AI text and photo results are estimates and may miss ingredients. Missing vitamin data means unknown, not zero intake. Supplement presets are logging shortcuts, not recommended doses.',link:'',label:''}
];
export function ScientificReferencesModal({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}) {
 useLocale();if(!isOpen)return null;
 return <div id="scientific-references-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
  <section role="dialog" aria-modal="true" aria-labelledby="sources-title" className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-white rounded-3xl p-6 space-y-5 shadow-xl">
   <div className="flex justify-between items-center gap-3"><h2 id="sources-title" className="flex items-center gap-2 text-xl font-bold"><BookOpen className="text-teal-700"/>{t('Sources and estimates')}</h2><button type="button" aria-label={t('Close')} onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X/></button></div>
   {sections.map(s=><section key={s.title} className="p-4 rounded-2xl bg-slate-50 space-y-2"><h3 className="font-bold text-slate-900">{t(s.title)}</h3><p className="text-sm leading-relaxed text-slate-600">{t(s.body)}</p>{s.link&&<a href={s.link} target="_blank" rel="noreferrer" className="text-sm underline text-teal-800">{t(s.label)}</a>}</section>)}
   <p className="text-sm text-slate-600">{t('This app supports general wellbeing. Seek qualified advice for medical conditions, pregnancy, eating disorders or individualized nutrition needs.')}</p>
   <a href="/privacypolicy.html" target="_blank" rel="noreferrer" className="inline-block underline text-teal-800">{t('Privacy notice')}</a>
  </section>
 </div>;
}
