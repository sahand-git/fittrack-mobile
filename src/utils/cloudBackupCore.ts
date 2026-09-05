import type { UserProfile, DayLog, FoodItem, WeightEntry } from '../types';

// Leave ample room below Firestore's 1 MiB document ceiling for field metadata.
export const CLOUD_MAX_BYTES = 750_000;
export interface FitnessBackup { version: '2.0'; exportedAt: string; profile: UserProfile; dailyLogs: Record<string, DayLog>; customFoods: FoodItem[]; weightHistory: WeightEntry[] }
export interface CloudSnapshot { revision: number; payload: string; updatedAt: string }
type Validator = (value: unknown) => any;
const invalid = (): never => { throw new Error('Invalid backup file format.'); };
const str: Validator = v => typeof v === 'string' ? v : invalid();
const num: Validator = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : invalid();
const bool: Validator = v => typeof v === 'boolean' ? v : invalid();
const date: Validator = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v ? v : invalid();
const choice = (...values: string[]): Validator => v => values.includes(v as string) ? v : invalid();
const optional = (check: Validator): Validator => v => v === undefined ? undefined : check(v);
const list = (check: Validator): Validator => v => Array.isArray(v) ? v.map(check) : invalid();
const record = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : invalid();
const shape = (fields: Record<string, Validator>): Validator => v => {
 const source=record(v), result:Record<string,unknown>={};
 // An allowlist at every level keeps credentials and unknown extension fields out.
 for(const [key,check] of Object.entries(fields)) { const value=check(source[key]); if(value!==undefined) result[key]=value; }
 return result;
};
const nutrients={calories:num,protein:num,carbs:num,fat:num,fiber:optional(num),sugars:optional(num),sodium:optional(num)};
const foodFields={id:str,name:str,brand:optional(str),barcode:optional(str),servingSize:str,servingGrams:num,imageUrl:optional(str),...nutrients};
const meal=shape({...foodFields,foodId:str,mealType:choice('breakfast','lunch','dinner','snack'),servingsCount:num,loggedAt:str});
const food=shape({...foodFields,nutriScore:optional(str),ecoScore:optional(str),novaGroup:optional(num),ingredients:optional(str),source:choice('open_food_facts','verified_database','custom','ai_estimated'),category:optional(str)});
const workout=shape({id:str,name:str,category:choice('strength','cardio','hiit','sports','flexibility'),durationMinutes:num,caloriesBurned:num,loggedAt:str,sets:optional(list(shape({setNum:num,weightKg:num,reps:num,completed:bool})))});
const report=shape({overallGrade:str,headline:str,caloricBalance:str,macroBreakdown:str,mistakesAndBlindSpots:list(str),actionableTomorrowFixes:list(str),customMealSuggestion:str,coachNote:str,generatedAt:str});
const day=shape({date,meals:shape({breakfast:list(meal),lunch:list(meal),dinner:list(meal),snack:list(meal)}),waterMl:num,steps:num,stepCaloriesBurned:num,workouts:list(workout),notes:optional(str),aiReport:optional(report)});
const profile=shape({name:str,email:str,avatarUrl:optional(str),isGoogleConnected:bool,gender:choice('male','female','other'),age:num,heightCm:num,weightKg:num,targetWeightKg:num,activityLevel:choice('sedentary','light','moderate','very_active','athlete'),goal:choice('fat_loss_aggressive','fat_loss_moderate','maintenance','lean_bulk','muscle_gain'),includeStepsInCalorieBudget:bool,stepGoal:num,waterGoalMl:num,bmr:num,tdee:num,targetCalories:num,targetProtein:num,targetCarbs:num,targetFat:num,profileCompleted:bool,onboardingVersion:optional(num),customMacroSplit:optional(shape({proteinPercent:num,carbsPercent:num,fatPercent:num}))});
const backup=shape({version:choice('2.0'),exportedAt:str,profile,dailyLogs:v=>{
 const result:Record<string,DayLog>={};
 for(const [key,value] of Object.entries(record(v))) {date(key);const entry=day(value);if(entry.date!==key)invalid();result[key]=entry;}
 return result;
},customFoods:list(food),weightHistory:list(shape({date,weightKg:num,bodyFatPercent:optional(num),note:optional(str)}))});
export function parseBackup(json: string): FitnessBackup {
 try { return backup(JSON.parse(json)); } catch { return invalid(); }
}
export function serializeBackup(value: unknown, enforceCloudLimit=true): string {
 const json=JSON.stringify(backup(value));
 if(enforceCloudLimit && new TextEncoder().encode(json).byteLength>CLOUD_MAX_BYTES) throw new Error('Backup is too large for cloud storage. Export a JSON file instead.');
 return json;
}
export function nextRevision(expected: number|null, actual: number|null): number {
 if(expected!==actual) throw new Error('Cloud backup changed on another device. Check cloud backup again before choosing which data to keep.');
 return (actual??0)+1;
}
export function validateCloudDocument(value: unknown): CloudSnapshot {
 const doc=record(value);
 if(doc.schemaVersion!==1 || !Number.isSafeInteger(doc.revision) || (doc.revision as number)<1 || typeof doc.payload!=='string' || new TextEncoder().encode(doc.payload).byteLength>CLOUD_MAX_BYTES) return invalid();
 parseBackup(doc.payload);
 if(!doc.updatedAt || typeof (doc.updatedAt as any).toDate!=='function') return invalid();
 const timestamp=(doc.updatedAt as any).toDate();
 if(!(timestamp instanceof Date) || Number.isNaN(timestamp.getTime()))return invalid();
 return {revision:doc.revision as number,payload:doc.payload,updatedAt:timestamp.toISOString()};
}
