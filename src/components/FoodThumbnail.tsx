/* localized-render */
import { t, useLocale, localeTag, matchesLocalized } from "../utils/locale";
import React, { useState } from 'react';

const icons: [RegExp, string][] = [
  [/chicken|turkey|poultry/i, '1f357'], [/beef|lamb|steak|meat|burger/i, '1f969'],
  [/shrimp|prawn/i, '1f364'], [/fish|salmon|tuna|tilapia|cod/i, '1f41f'],
  [/eggplant/i, '1f346'], [/egg/i, '1f95a'], [/peanut butter|almond butter/i, '1f95c'], [/butter|ghee/i, '1f9c8'],
  [/cheese/i, '1f9c0'], [/milk/i, '1f95b'], [/yogurt|oat|cereal|quinoa|bulgur|couscous/i, '1f963'],
  [/rice/i, '1f35a'], [/pasta|spaghetti/i, '1f35d'], [/pita|bread|toast/i, '1f35e'],
  [/potato/i, '1f954'], [/carrot/i, '1f955'], [/cucumber/i, '1f952'], [/tomato/i, '1f345'],
  [/onion/i, '1f9c5'], [/broccoli/i, '1f966'], [/lettuce|spinach|okra|salad/i, '1f96c'],
  [/lentil|bean|chickpea|hummus/i, '1fad8'], [/falafel/i, '1f9c6'],
  [/banana/i, '1f34c'], [/apple/i, '1f34e'], [/orange/i, '1f34a'], [/watermelon/i, '1f349'],
  [/grape/i, '1f347'], [/strawberr/i, '1f353'], [/blueberr|berries/i, '1fad0'],
  [/avocado/i, '1f951'], [/almond|walnut|peanut|nuts/i, '1f95c'],
  [/date/i, '1f334'], [/olive|oil/i, '1fad2'], [/coffee/i, '2615'], [/tea/i, '1f375'],
  [/chocolate|protein bar/i, '1f36b'], [/sugar|honey/i, '1f36f'],
  [/protein powder|whey/i, '1f964'],
];

export function foodIllustration(name: string) {
  return '/food-images/' + (icons.find(([pattern]) => pattern.test(name))?.[1] || '1f37d') + '.svg';
}

export function FoodThumbnail({ name, imageUrl, large = false }: { name: string; imageUrl?: string; large?: boolean }) {
  useLocale();
  const [failedUrl, setFailedUrl] = useState('');
  const photo = imageUrl?.startsWith('https://') && failedUrl !== imageUrl;
  return <img src={photo ? imageUrl : foodIllustration(name)}
    alt={t(photo ? name : `Illustration for ${name}`)} loading="lazy" decoding="async" referrerPolicy="no-referrer"
    onError={() => { if (imageUrl) setFailedUrl(imageUrl); }}
    className={`${large ? 'w-20 h-20' : 'w-12 h-12'} shrink-0 rounded-xl ${photo ? 'object-cover' : 'object-contain p-2'} bg-slate-800`} />;
}
