import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { HttpOptions, HttpResponse } from '@capacitor/core';
import type { FoodItem } from '../types.ts';

type Transport = {
  native?: boolean;
  nativeGet?: (options: HttpOptions) => Promise<HttpResponse>;
  fetch?: typeof fetch;
};
const fields = 'product_name,product_name_en,brands,nutriments,serving_size,serving_quantity,serving_quantity_unit,nutrition_grades,image_url,ingredients_text';
const number = (value: unknown): number | undefined => {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (typeof value === 'string' && !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const round = (value: number) => Math.round(value * 100) / 100;

// FoodItem stores ALL nutrients per serving (sodium in mg), not a mix of bases.
export function normalizeProduct(barcode: string, product: Record<string, any>): FoodItem {
  const n = product.nutriments ?? {};
  const energyKj = number(n.energy_100g);
  const calories = number(n['energy-kcal_100g']) ?? (energyKj === undefined ? undefined : energyKj / 4.184);
  const protein = number(n.proteins_100g);
  const carbs = number(n.carbohydrates_100g);
  const fat = number(n.fat_100g);
  const name = text(product.product_name) || text(product.product_name_en);
  if (!name || [calories, protein, carbs, fat].some(value => value === undefined)) {
    throw new Error('This product’s nutrition information is incomplete. Use Create Custom Food to enter the values from its label.');
  }
  const label = text(product.serving_size);
  const metric = label.match(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i);
  const unit = text(product.serving_quantity_unit).toLowerCase() || metric?.[2]?.toLowerCase();
  const quantity = number(product.serving_quantity) ?? (metric ? number(metric[1].replace(',', '.')) : undefined);
  const serving = quantity && (unit === 'g' || unit === 'ml') ? quantity : 100;
  const servingSize = quantity && (unit === 'g' || unit === 'ml') ? (label || `${serving} ${unit}`) : '100 g';
  const scale = (value: number | undefined) => value === undefined ? undefined : round(value * serving / 100);
  const sodiumGrams = number(n.sodium_100g) ?? (number(n.salt_100g) === undefined ? undefined : number(n.salt_100g)! / 2.5);
  const image = text(product.image_url);
  return {
    id: `barcode_${barcode}`, barcode, name, brand: text(product.brands),
    servingSize, servingGrams: serving,
    calories: scale(calories)!, protein: scale(protein)!, carbs: scale(carbs)!, fat: scale(fat)!,
    fiber: scale(number(n.fiber_100g)), sugars: scale(number(n.sugars_100g)),
    sodium: scale(sodiumGrams === undefined ? undefined : sodiumGrams * 1000),
    nutriScore: /^[a-e]$/i.test(text(product.nutrition_grades)) ? text(product.nutrition_grades).toUpperCase() : undefined,
    imageUrl: image.startsWith('https://') ? image : undefined,
    ingredients: text(product.ingredients_text), source: 'open_food_facts'
  };
}

export async function lookupBarcode(raw: string, saved: FoodItem[] = [], transport: Transport = {}): Promise<FoodItem> {
  const code = raw.trim().replace(/[\s-]/g, '');
  if (!/^(\d{8}|\d{12,14})$/.test(code)) throw new Error('Enter an 8, 12, 13 or 14 digit barcode number from the package.');
  const cached = saved.find(food => food.barcode === code);
  if (cached) return cached;
  const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${fields}`;
  let response: { status: number; data: unknown };
  try {
    if (transport.native ?? Capacitor.isNativePlatform()) {
      response = await (transport.nativeGet ?? CapacitorHttp.get)({ url, responseType: 'json',
        connectTimeout: 15000, readTimeout: 15000,
        headers: { Accept: 'application/json', 'User-Agent': 'FitTrack/1.1 (https://github.com/sahand-git/fittrack-mobile)' } });
    } else {
      const res = await (transport.fetch ?? fetch)(url, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
      response = { status: res.status, data: await res.text() };
    }
  } catch {
    throw new Error('Could not reach Open Food Facts. Try again shortly. Previously saved foods are still available offline.');
  }
  if (response.status === 404) throw new Error(`Product ${code} was not found in Open Food Facts. You can create a custom food from its label.`);
  if (response.status === 429) throw new Error('Too many barcode lookups. Please wait a moment and try again.');
  if (response.status < 200 || response.status >= 300) throw new Error('Open Food Facts is temporarily unavailable. Please try again shortly.');
  let data: any;
  try { data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data; }
  catch { throw new Error('The food database returned an invalid response. Please try again.'); }
  if (data?.status === 0) throw new Error(`Product ${code} was not found in Open Food Facts. You can create a custom food from its label.`);
  if (!data?.product || typeof data.product !== 'object') throw new Error('The food database returned an invalid response. Please try again.');
  return normalizeProduct(code, data.product);
}
