export type Locale = 'en' | 'ar' | 'ckb';
export function detectLocale(language: string): Locale {
  if (/^(ckb|ku(?:-Arab|-IQ))/i.test(language)) return 'ckb';
  return /^ar(?:-|$)/i.test(language) ? 'ar' : 'en';
}
export function normalizeSearch(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,'')
    .replace(/[أإآٱ]/g,'ا').replace(/ك/g,'ک').replace(/[يى]/g,'ی')
    .replace(/[٠-٩]/g, c=>String(c.charCodeAt(0)-0x660))
    .replace(/[۰-۹]/g, c=>String(c.charCodeAt(0)-0x6f0)).replace(/\s+/g,' ').trim();
}
export function translateText(text: string, catalog: Record<string,string>): string {
  const key = text.replace(/\s+/g,' ').trim();
  const translated = catalog[key];
  if (!translated) return text;
  return (text.match(/^\s+/)?.[0] || '') + translated + (text.match(/\s+$/)?.[0] || '');
}
