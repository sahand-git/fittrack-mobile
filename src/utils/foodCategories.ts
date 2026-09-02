import type {FoodItem} from '../types';

export function foodCategory(food: Pick<FoodItem,'name'|'category'>): string {
  const name=food.name.toLowerCase(), category=(food.category || '').toLowerCase();
  if (/beef|lamb|chicken|turkey|steak|burger/.test(name)||category==='meat')return 'Meat';
  if (/salmon|tuna|cod|tilapia|shrimp/.test(name)||category==='fish & seafood')return 'Fish & Seafood';
  if (category==='dairy alternative'||category==='beverages')return 'Drinks';
  if (/\beggs?\b|milk|yogurt|cheese|butter/.test(name)&&!name.includes('peanut')&&!name.includes('almond'))return 'Eggs & Dairy';
  if (['grains','bakery'].includes(category))return 'Grains & Bread';
  if (category==='fruits')return 'Fruit';
  if (['vegetables','produce'].includes(category))return 'Vegetables';
  if (['beans & lentils','plant protein'].includes(category))return 'Beans & Lentils';
  if (['nuts','nut butter'].includes(category))return 'Nuts & Seeds';
  if (['snacks','supplements'].includes(category))return 'Snacks & Protein';
  if (category==='dairy')return 'Eggs & Dairy';
  return 'Other';
}
