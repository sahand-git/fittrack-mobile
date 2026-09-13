import { useSyncExternalStore } from 'react';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { createAIClient, type AITransport } from './aiClient.ts';
import { accountStorageKeys } from './account.ts';

// Old builds persisted developer credentials. Remove them without reading them.
export function clearGeminiKey() {
  try { localStorage.removeItem('fittrack_gemini_api_key'); localStorage.removeItem('fittrack_gemini_model'); } catch {}
}
clearGeminiKey();
const transport:AITransport=async(path,headers,body,method='POST')=>{
  const origin=import.meta.env?.VITE_API_ORIGIN || '';
  if(origin && new URL(origin).protocol!=='https:')throw new Error('The API address must use HTTPS.');
  if(Capacitor.isNativePlatform() && !origin)throw new Error('The app service address has not been configured.');
  const url=origin.replace(/\/$/,'')+path;
  if(Capacitor.isNativePlatform()) {
    const res=await CapacitorHttp.request({url,method,headers,...(body===undefined?{}:{data:body}),responseType:'json',connectTimeout:15000,readTimeout:65000});
    return {status:res.status,data:res.data};
  }
  const res=await fetch(url,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(65000),cache:'no-store'});
  return {status:res.status,data:res.status===204?null:await res.json().catch(()=>null)};
};
const client=createAIClient(transport);
let activeAccount:string|null=null;
export function configureAIAccount(uid:string|null,getToken:(()=>Promise<string>)|null) {
  clearGeminiKey();activeAccount=uid;client.setAccount(uid,getToken);
  // Consent is deliberately renewed after each sign-in/account switch.
}
export const useAIStatus=()=>useSyncExternalStore(client.subscribe,client.getStatus,client.getStatus);
export const refreshAIStatus=()=>client.refresh();
export const hasAIAccess=()=>{const s=client.getStatus();return s.signedIn&&s.consent&&s.enabled;};
export function setAIConsent(value:boolean) {
  client.setConsent(value);
  // No persisted permission can silently re-enable health-data sharing next session.
  if(activeAccount)try{localStorage.removeItem(accountStorageKeys(activeAccount).aiConsent);}catch{}
}
export const deleteServerAccount=()=>client.deleteAccount();
export const generateGemini=(prompt:string,json=false)=>client.generate(prompt,json);
export const generateGeminiVision=(prompt:string,data:string,mimeType='image/jpeg',json=true)=>client.generate(prompt,json,{data:data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/,''),mimeType});

export function parseMealResult(text: string) {
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('Gemini returned an invalid meal estimate. Try again.'); }
  const fields = ['calories', 'protein', 'carbs', 'fat'];
  if (!Array.isArray(data?.items) || !data.items.length || data.items.some((item: any) =>
    typeof item.name !== 'string' || !item.name.trim() || typeof item.portion !== 'string' ||
    !Number.isFinite(item.servingGrams) || item.servingGrams <= 0 ||
    fields.some(f => typeof item[f] !== 'number' || !Number.isFinite(item[f]) || item[f] < 0))) {
    throw new Error('Gemini could not estimate valid food portions. Add quantities and try again.');
  }
  for (const item of data.items) {
    for (const field of ['fiber', 'sugars', 'sodium', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12', 'calcium', 'iron', 'potassium', 'magnesium', 'zinc']) {
      if (!Number.isFinite(item[field]) || item[field] < 0) delete item[field];
    }
  }
  const total = (field: string) => Math.round(data.items.reduce((sum: number, item: any) => sum + item[field], 0) * 10) / 10;
  return { items: data.items, totalCalories: total('calories'), totalProtein: total('protein'), totalCarbs: total('carbs'), totalFat: total('fat'), dishName: data.dishName || data.name, advice: data.advice };
}

export function parseCoachResult(text: string) {
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('Gemini returned an invalid report. Try again.'); }
  if (['overallGrade', 'headline', 'caloricBalance', 'macroBreakdown', 'customMealSuggestion', 'coachNote'].some(f => typeof data?.[f] !== 'string') ||
      ['mistakesAndBlindSpots', 'actionableTomorrowFixes'].some(f => !Array.isArray(data?.[f]) || data[f].some((v: any) => typeof v !== 'string'))) {
    throw new Error('Gemini returned an incomplete report. Try again.');
  }
  return data;
}
