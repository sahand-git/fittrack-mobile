import type { Micronutrients } from '../types.ts';

export const MICRONUTRIENT_KEYS = [
  'calciumMg', 'ironMg', 'magnesiumMg', 'potassiumMg', 'zincMg',
  'vitaminCmg', 'vitaminDmcg', 'vitaminB12mcg'
] as const;

export type MicronutrientKey = typeof MICRONUTRIENT_KEYS[number];

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
