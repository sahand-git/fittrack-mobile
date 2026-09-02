import { Capacitor, CapacitorHttp } from '@capacitor/core';

// Personal credentials stay in memory, never in a backup, localStorage, or the APK.
let sessionKey = '';
export const hasGeminiKey = () => Boolean(sessionKey);
export function setGeminiKey(key: string) { sessionKey = key.trim(); }
export function clearGeminiKey() { sessionKey = ''; }

type Transport = (url: string, headers: Record<string, string>, body: unknown) => Promise<{ status: number; data: any }>;
const transport: Transport = async (url, headers, body) => {
  if (Capacitor.isNativePlatform()) {
    return CapacitorHttp.post({ url, headers, data: body, connectTimeout: 15000, readTimeout: 60000 });
  }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  return { status: res.status, data: await res.json() };
};

export async function generateGemini(prompt: string, json = false, request: Transport = transport): Promise<string> {
  if (!sessionKey) throw new Error('Set up Gemini below with your own Google AI Studio API key and allow AI access first. A Gmail address alone cannot enable it.');
  let response;
  try {
    response = await request('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      { 'Content-Type': 'application/json', 'x-goog-api-key': sessionKey },
      { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: json ? { responseMimeType: 'application/json' } : {} });
  } catch {
    throw new Error('Could not reach Gemini. Check your connection and try again.');
  }
  if (response.status === 429) throw new Error('Your Gemini API quota is exhausted or requests are too frequent. Check your Google AI Studio usage, then try again.');
  if ([400, 401, 403].includes(response.status)) throw new Error('Google rejected this request. Check your Gemini API key, project access, billing, and regional availability in Google AI Studio.');
  if (response.status < 200 || response.status >= 300) throw new Error('Gemini is temporarily unavailable. Try again later.');
  let data = response.data;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { throw new Error('Gemini returned an unreadable response. Try again.'); } }
  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') throw new Error('Gemini could not complete this response. Try a shorter or different request.');
  const text = candidate?.content?.parts?.filter((p: any) => !p.thought && typeof p.text === 'string').map((p: any) => p.text).join('');
  if (!text?.trim()) throw new Error('Gemini returned no answer. Try a different request.');
  return text.trim();
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
