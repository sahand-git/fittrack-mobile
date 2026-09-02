import { Capacitor, CapacitorHttp } from '@capacitor/core';

// Credentials live only in memory and are never included in backups.
let sessionKey = '';
let sessionModel = 'gemini-2.5-flash';
export const hasGeminiKey = () => Boolean(sessionKey);
export const getGeminiModel = () => sessionModel;
export function setGeminiKey(key: string, model = 'gemini-2.5-flash') { sessionKey = key.trim(); sessionModel = model; }
export function clearGeminiKey() { sessionKey = ''; }

export type GeminiTransport = (url: string, headers: Record<string, string>, body?: unknown, method?: 'GET' | 'POST') => Promise<{ status: number; data: any }>;
const transport: GeminiTransport = async (url, headers, body, method = 'POST') => {
  if (Capacitor.isNativePlatform()) {
    return CapacitorHttp.request({ url, method, headers, ...(body === undefined ? {} : {data: body}), responseType: 'json', connectTimeout: 15000, readTimeout: 60000 });
  }
  const res = await fetch(url, { method, headers, ...(body === undefined ? {} : {body: JSON.stringify(body)}), signal: AbortSignal.timeout(60000) });
  return { status: res.status, data: await res.text() };
};

export class GeminiError extends Error {
  httpStatus: number;
  constructor(message: string, httpStatus: number) { super(message); this.httpStatus = httpStatus; this.name = 'GeminiError'; }
}
function readData(raw: any) { if (typeof raw !== 'string') return raw; try { return JSON.parse(raw); } catch { return null; } }
export function geminiResponseError(status: number, raw: any, key = '') {
  const data = readData(raw);
  let detail = typeof data?.error?.message === 'string' ? data.error.message : '';
  if (key) detail = detail.split(key).join('[redacted]');
  detail = detail.replace(/AIza[A-Za-z0-9_-]+/g, '[redacted]').replace(/https?:\/\/\S+/g, '[link omitted]').slice(0, 450);
  const messages: Record<number, string> = {
    400: 'Google rejected the request. Check the key, model, and any billing or region requirement shown below.',
    401: 'Your Gemini API key was rejected. Replace it with a valid Google AI Studio key.',
    403: 'This key or Google project is not allowed to use this service. Check API restrictions and project access.',
    404: 'This Gemini model is unavailable for your project. Reconnect and choose another available model.',
    429: 'Your Gemini API quota or rate limit was reached. Check Google AI Studio usage and billing before retrying.',
    500: 'Google encountered an internal error. Retry with a shorter request or select another model.',
    502: 'Google returned a gateway error. Try again shortly.',
    503: 'Google reports this model is overloaded. Retry shortly or reconnect with another available model.',
    504: 'Google timed out. Try a shorter request or another model.'
  };
  return new GeminiError((messages[status] || 'Google could not complete the request.') + ' (HTTP ' + status + ')' + (detail ? ' Google: ' + detail : ''), status);
}
async function requestData(url: string, key: string, body: unknown, request: GeminiTransport, method: 'GET'|'POST' = 'POST') {
  let response;
  try { response = await request(url, {'Content-Type':'application/json','x-goog-api-key':key}, body, method); }
  catch { throw new GeminiError('Could not reach Google. Check your connection and try again.', 0); }
  if (response.status < 200 || response.status >= 300) throw geminiResponseError(response.status, response.data, key);
  const data = readData(response.data);
  if (!data) throw new GeminiError('Google returned an unreadable response. Try again.', response.status);
  return data;
}
export async function availableGeminiModels(key: string, request: GeminiTransport = transport): Promise<string[]> {
  const models: string[] = []; let page = '';
  for (let i=0; i<10; i++) {
    const data = await requestData('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100' + (page ? '&pageToken='+encodeURIComponent(page) : ''), key.trim(), undefined, request, 'GET');
    for (const model of data.models || []) {
      const name = String(model.name || '').replace(/^models\//, '');
      if (/^gemini-[a-zA-Z0-9.-]+$/.test(name) && model.supportedGenerationMethods?.includes('generateContent') && !/image|audio|tts|robotics|computer-use|live|embedding/.test(name)) models.push(name);
    }
    page = data.nextPageToken; if (!page) break;
  }
  if (!models.length) throw new Error('Google did not list any compatible text models for this key. Check the project in Google AI Studio.');
  const preferred = ['gemini-3.5-flash-lite','gemini-3.1-flash-lite','gemini-2.5-flash-lite','gemini-3.7-flash','gemini-3.6-flash','gemini-3.5-flash','gemini-2.5-flash'];
  const rank = (m: string) => { const i=preferred.indexOf(m); return i<0 ? 100 : i; };
  return [...new Set(models)].sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));
}
async function generateWithKey(prompt: string, json: boolean, key: string, model: string, request: GeminiTransport, wait = (ms: number) => new Promise<void>(resolve=>setTimeout(resolve,ms))) {
  if (!/^gemini-[a-zA-Z0-9.-]+$/.test(model)) throw new Error('Choose a compatible Gemini model.');
  let data: any;
  // Retry only temporary server errors, never authorization failures or exhausted quota.
  for (let attempt=0; attempt<3; attempt++) {
    try {
      data = await requestData('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent', key,
        { contents:[{role:'user',parts:[{text:prompt}]}], generationConfig:json?{responseMimeType:'application/json'}:{} }, request);
      break;
    } catch (error) {
      if (!(error instanceof GeminiError) || ![500,502,503,504].includes(error.httpStatus) || attempt===2) throw error;
      await wait(750 * (2 ** attempt));
    }
  }
  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') throw new Error('Gemini could not complete this response ('+candidate.finishReason+'). Try a shorter or different request.');
  const text = candidate?.content?.parts?.filter((p:any)=>!p.thought && typeof p.text==='string').map((p:any)=>p.text).join('');
  if (!text?.trim()) throw new Error('Gemini returned no answer. Try a different request.');
  return text.trim();
}
export async function connectGemini(key: string, model: string, request: GeminiTransport = transport) {
  key=key.trim(); if (!key) throw new Error('Enter your Google AI Studio API key.');
  await generateWithKey('Reply with the single word OK.', false, key, model, request);
  setGeminiKey(key,model);
}
export async function generateGemini(prompt: string, json = false, request: GeminiTransport = transport, wait?: (ms: number)=>Promise<void>): Promise<string> {
  if (!sessionKey) throw new Error('Set up Gemini with your own Google AI Studio API key and allow AI access first. A Gmail address alone cannot enable it.');
  return generateWithKey(prompt,json,sessionKey,sessionModel,request,wait);
}

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
    for (const field of ['fiber', 'sugars', 'sodium']) {
      if (!Number.isFinite(item[field]) || item[field] < 0) delete item[field];
    }
  }
  const total = (field: string) => Math.round(data.items.reduce((sum: number, item: any) => sum + item[field], 0) * 10) / 10;
  return { items: data.items, totalCalories: total('calories'), totalProtein: total('protein'), totalCarbs: total('carbs'), totalFat: total('fat') };
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
