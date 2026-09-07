import type { Micronutrients, NutrientIntakeEntry } from '../types.ts';

export const MICRONUTRIENT_KEYS = [
  'calciumMg', 'ironMg', 'magnesiumMg', 'potassiumMg', 'zincMg',
  'vitaminCmg', 'vitaminDmcg', 'vitaminB12mcg'
] as const;

export type MicronutrientKey = typeof MICRONUTRIENT_KEYS[number];

export type NutrientGroup = 'vitamin' | 'mineral';

export interface NutrientMeta {
  label: string;
  unit: 'mg' | 'mcg';
  group: NutrientGroup;
}

export const NUTRIENT_META: Record<MicronutrientKey, NutrientMeta> = {
  calciumMg: { label: 'Calcium', unit: 'mg', group: 'mineral' },
  ironMg: { label: 'Iron', unit: 'mg', group: 'mineral' },
  magnesiumMg: { label: 'Magnesium', unit: 'mg', group: 'mineral' },
  potassiumMg: { label: 'Potassium', unit: 'mg', group: 'mineral' },
  zincMg: { label: 'Zinc', unit: 'mg', group: 'mineral' },
  vitaminCmg: { label: 'Vitamin C', unit: 'mg', group: 'vitamin' },
  vitaminDmcg: { label: 'Vitamin D', unit: 'mcg', group: 'vitamin' },
  vitaminB12mcg: { label: 'Vitamin B12', unit: 'mcg', group: 'vitamin' }
};

export interface NutrientSourceTotals {
  manual: number;
  supplement: number;
}

export interface CombinedNutrientTotal extends NutrientSourceTotals {
  food: number;
  total: number;
  coverage?: number;
}

export function parseNutrientAmount(value: string): number | null {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount * 100) / 100
    : null;
}

export function scaleMicronutrients(values: Micronutrients, multiplier: number): Micronutrients {
  const result: Micronutrients = {};
  for (const key of MICRONUTRIENT_KEYS) {
    const value = values[key];
    if (value !== undefined) result[key] = Math.round(value * multiplier * 100) / 100;
  }
  return result;
}

export function sumMicronutrients(items: Micronutrients[]) {
  const result: Partial<Record<MicronutrientKey, { value: number; coverage: number }>> = {};
  for (const key of MICRONUTRIENT_KEYS) {
    const known = items.map(item => item[key]).filter((value): value is number => value !== undefined);
    if (known.length) result[key] = { value: Math.round(known.reduce((sum, value) => sum + value, 0) * 100) / 100, coverage: known.length };
  }
  return result;
}

export function sumNutrientEntries(
  entries: NutrientIntakeEntry[]
): Record<MicronutrientKey, NutrientSourceTotals> {
  const result = Object.fromEntries(
    MICRONUTRIENT_KEYS.map(key => [key, { manual: 0, supplement: 0 }])
  ) as Record<MicronutrientKey, NutrientSourceTotals>;

  for (const entry of entries) {
    const bucket = result[entry.nutrient];
    bucket[entry.sourceType] = Math.round(
      (bucket[entry.sourceType] + entry.amount) * 100
    ) / 100;
  }
  return result;
}

export function combineNutrientTotals(
  foodTotals: ReturnType<typeof sumMicronutrients>,
  entryTotals: Record<MicronutrientKey, NutrientSourceTotals>,
  scheduledSupplementTotals: Partial<Record<MicronutrientKey, number>>
): Record<MicronutrientKey, CombinedNutrientTotal> {
  return Object.fromEntries(MICRONUTRIENT_KEYS.map(key => {
    const food = foodTotals[key]?.value ?? 0;
    const manual = entryTotals[key]?.manual ?? 0;
    const supplement = Math.round(
      ((entryTotals[key]?.supplement ?? 0) + (scheduledSupplementTotals[key] ?? 0)) * 100
    ) / 100;
    const total: CombinedNutrientTotal = {
      food,
      manual,
      supplement,
      total: Math.round((food + manual + supplement) * 100) / 100
    };
    const coverage = foodTotals[key]?.coverage;
    if (coverage !== undefined) total.coverage = coverage;
    return [key, total];
  })) as Record<MicronutrientKey, CombinedNutrientTotal>;
}
