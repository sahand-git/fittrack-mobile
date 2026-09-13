import type { FoodItem, FoodNutrients, LoggedMealItem, MealType } from '../types';

export const NUTRIENT_KEYS = ['calories','protein','carbs','fat','fiber','sugars','sodium','vitaminA','vitaminC','vitaminD','vitaminB12','calcium','iron','potassium','magnesium','zinc'] as const;

/** Logged nutrients and grams are totals for the selected portion, never per serving. */
export function createLoggedFood(food: FoodItem, mealType: MealType, servingsCount: number, id: string, loggedAt: string): LoggedMealItem {
 if (!Number.isFinite(servingsCount) || servingsCount <= 0) throw new Error('Enter a positive serving amount.');
 const nutrients = {} as FoodNutrients;
 for (const key of NUTRIENT_KEYS) {
  const value = food[key];
  if (value !== undefined) {
   if (!Number.isFinite(value) || value < 0) throw new Error('Food nutrients must be finite and nonnegative.');
   nutrients[key] = value * servingsCount;
  }
 }
 return {id,foodId:food.id,name:food.name,brand:food.brand,barcode:food.barcode,mealType,servingSize:food.servingSize,servingGrams:food.servingGrams*servingsCount,servingsCount,...nutrients,imageUrl:food.imageUrl,loggedAt};
}

export function sumNutrients(items: readonly FoodNutrients[]): Required<FoodNutrients> {
 const totals = Object.fromEntries(NUTRIENT_KEYS.map(key => [key,0])) as Required<FoodNutrients>;
 for (const item of items) for (const key of NUTRIENT_KEYS) totals[key] += item[key] ?? 0;
 return totals;
}
