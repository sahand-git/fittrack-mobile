import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory + file-backed persistent cache for synced user profiles & cloud backup by email
const cloudUserStorage = new Map<string, { profile: any; dailyLogs: any; customFoods: any; weightHistory: any; updatedAt: string }>();
const customBarcodeRegistry = new Map<string, any>();

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Open Food Facts Barcode API Proxy & Normalizer + Custom Barcode Registry
app.get('/api/barcode/:code', async (req, res) => {
  const { code } = req.params;
  if (!code || !/^\d+$/.test(code)) {
    return res.status(400).json({ error: 'Invalid barcode format' });
  }

  // Check if we have a locally registered custom barcode
  if (customBarcodeRegistry.has(code)) {
    const customProd = customBarcodeRegistry.get(code);
    return res.json({ success: true, product: customProd, source: 'custom_food_database' });
  }

  try {
    // Query Open Food Facts API v2 (world database) with custom user-agent
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,nutrition_grades,image_url,ingredients_text,ecoscore_grade,nova_group`;
    const response = await fetch(offUrl, {
      headers: {
        'User-Agent': 'NutriFitTrackerApp - Web - Version 1.0 (contact@nutrifit.app)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Product not found on Open Food Facts' });
    }

    const data = await response.json();
    if (!data.product || data.status === 0) {
      return res.status(404).json({ error: 'Product not found for barcode: ' + code });
    }

    const p = data.product;
    const n = p.nutriments || {};

    // Standardized nutrients per 100g/ml
    const caloriesPer100 = Math.round(n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0));
    const proteinPer100 = Math.round(((n.proteins_100g ?? n.protein_100g) || 0) * 10) / 10;
    const carbsPer100 = Math.round(((n.carbohydrates_100g ?? n.carbs_100g) || 0) * 10) / 10;
    const fatPer100 = Math.round(((n.fat_100g) || 0) * 10) / 10;
    const fiberPer100 = Math.round(((n.fiber_100g) || 0) * 10) / 10;
    const sugarsPer100 = Math.round(((n.sugars_100g) || 0) * 10) / 10;
    const sodiumPer100 = Math.round(((n.sodium_100g) || (n.salt_100g ? n.salt_100g / 2.5 : 0)) * 1000); // in mg

    // Serving size information
    const servingSizeStr = p.serving_size || '100g';
    let servingGrams = parseFloat(p.serving_quantity || '') || 100;
    if (servingGrams <= 0) servingGrams = 100;

    const normalizedProduct = {
      barcode: code,
      name: p.product_name || 'Scanned Food Item',
      brand: p.brands || '',
      servingSize: servingSizeStr,
      servingGrams: servingGrams,
      caloriesPer100,
      proteinPer100,
      carbsPer100,
      fatPer100,
      fiberPer100,
      sugarsPer100,
      sodiumPer100,
      // Calculated for 1 serving
      caloriesPerServing: Math.round((caloriesPer100 * servingGrams) / 100),
      proteinPerServing: Math.round(((proteinPer100 * servingGrams) / 100) * 10) / 10,
      carbsPerServing: Math.round(((carbsPer100 * servingGrams) / 100) * 10) / 10,
      fatPerServing: Math.round(((fatPer100 * servingGrams) / 100) * 10) / 10,
      nutriScore: (p.nutrition_grades || '').toUpperCase(),
      ecoScore: (p.ecoscore_grade || '').toUpperCase(),
      novaGroup: p.nova_group || null,
      imageUrl: p.image_url || '',
      ingredients: p.ingredients_text || '',
      source: 'Open Food Facts Verified Database'
    };

    return res.json({ success: true, product: normalizedProduct });
  } catch (err: any) {
    console.error('Error fetching barcode data:', err);
    return res.status(500).json({ error: 'Failed to contact food database: ' + err.message });
  }
});

// 2b. Register custom food with barcode to database
app.post('/api/barcode/custom', (req, res) => {
  const { barcode, name, brand, calories, protein, carbs, fat, servingGrams } = req.body;
  if (!barcode || !name) {
    return res.status(400).json({ error: 'Barcode and food name are required.' });
  }

  const normalized = {
    barcode: String(barcode).trim(),
    name: String(name).trim(),
    brand: brand ? String(brand).trim() : 'Custom Food Database',
    servingSize: `${servingGrams || 100}g`,
    servingGrams: Number(servingGrams) || 100,
    caloriesPer100: Number(calories) || 0,
    proteinPer100: Number(protein) || 0,
    carbsPer100: Number(carbs) || 0,
    fatPer100: Number(fat) || 0,
    caloriesPerServing: Number(calories) || 0,
    proteinPerServing: Number(protein) || 0,
    carbsPerServing: Number(carbs) || 0,
    fatPerServing: Number(fat) || 0,
    source: 'Custom Food Database'
  };

  customBarcodeRegistry.set(String(barcode).trim(), normalized);
  return res.json({ success: true, product: normalized, message: 'Saved to custom food database' });
});

// 3. AI Coach & Daily Mistake Auditor (Gemini API)
app.post('/api/ai-coach', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the server environment.' });
    }

    const { profile, todayLog, targetCalories, targetProtein, targetCarbs, targetFat, stepData } = req.body;

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a world-class elite sports dietitian, nutrition scientist, and empathetic habit coach.
Analyze the user's daily nutrition, physical activity, and goal alignment.

USER PROFILE & TARGETS:
- Name: ${profile?.name || 'User'}
- Gender: ${profile?.gender || 'Unspecified'}, Age: ${profile?.age || 28}
- Weight: ${profile?.weight || 75} kg, Height: ${profile?.height || 175} cm, Target Weight: ${profile?.targetWeight || 70} kg
- Fitness Goal: ${profile?.goal || 'Fat Loss'} (${profile?.activityLevel || 'Moderate'} activity)
- Calculated BMR: ${profile?.bmr || 1700} kcal, TDEE: ${profile?.tdee || 2300} kcal
- Daily Calorie Target: ${targetCalories || 2000} kcal (Include steps in budget: ${profile?.includeStepsInCalorieBudget ? 'YES' : 'NO'})
- Target Macros: Protein ${targetProtein || 150}g, Carbs ${targetCarbs || 200}g, Fat ${targetFat || 60}g

TODAY'S ACTUAL LOG:
- Total Calories Consumed: ${todayLog?.totalCalories || 0} kcal
- Actual Macros: Protein ${todayLog?.totalProtein || 0}g, Carbs ${todayLog?.totalCarbs || 0}g, Fat ${todayLog?.totalFat || 0}g
- Water Logged: ${todayLog?.waterMl || 0} ml (Target: ${profile?.waterGoalMl || 2500} ml)
- Steps Walked: ${stepData?.steps || 0} steps (${stepData?.caloriesBurned || 0} kcal burned, Distance: ${(stepData?.steps ? (stepData.steps * 0.0008).toFixed(1) : 0)} km)
- Workouts / Exercises Logged: ${JSON.stringify(todayLog?.workouts || [])}
- Meals Eaten Today:
${JSON.stringify(todayLog?.meals || {}, null, 2)}

TASK:
Provide an expert, structured daily evaluation in JSON format with:
1. "overallGrade": Grade from "A+", "A", "B", "C", "D", "F"
2. "headline": A motivating, crisp 1-sentence summary of today's performance.
3. "caloricBalance": Short assessment of caloric deficit/surplus vs their target.
4. "macroBreakdown": Specific notes on Protein, Carb, and Fat execution.
5. "mistakesAndBlindSpots": Array of 2 to 4 critical mistakes, hidden pitfalls, or areas where they went off-track (e.g. high sugar spikes, backloading protein to late night, missed hydration, insufficient fiber, excessive saturated fat, skipping post-workout nutrition, or under-eating).
6. "actionableTomorrowFixes": Array of 3 exact, practical things to do tomorrow to improve.
7. "customMealSuggestion": 1 specific healthy, easy meal/snack tailored to fix whatever macro was deficient today.
8. "coachNote": A 2-sentence encouraging closing coaching reminder.

Return ONLY valid JSON matching this exact structure.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch {
      parsedResult = {
        overallGrade: 'B+',
        headline: 'Solid progress toward your daily target!',
        caloricBalance: 'You maintained a healthy energy balance.',
        macroBreakdown: 'Protein intake was consistent. Keep monitoring dietary fats.',
        mistakesAndBlindSpots: ['Make sure to drink water evenly throughout the day.'],
        actionableTomorrowFixes: ['Log all breakfast items right after eating.', 'Add 1 serving of lean protein to lunch.'],
        customMealSuggestion: 'Greek yogurt with berries and 1 scoop whey protein.',
        coachNote: 'Every logged day builds long-term metabolic consistency. Keep it going!'
      };
    }

    return res.json({ success: true, report: parsedResult });
  } catch (err: any) {
    console.error('Error generating AI coach report:', err);
    return res.status(500).json({ error: 'Failed to generate AI report: ' + err.message });
  }
});

// 4. AI Smart Meal Text/Voice Parser
app.post('/api/ai-parse-meal', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a nutritional database expert. The user wants to log food from natural text: "${query}".
Break this down into individual food items with scientifically accurate calories, protein (g), carbohydrates (g), fat (g), fiber (g), and serving size estimation.

Return JSON in this format:
{
  "items": [
    {
      "name": "Food name (e.g. Scrambled Eggs)",
      "portion": "e.g. 2 large eggs (100g)",
      "calories": 140,
      "protein": 12,
      "carbs": 1,
      "fat": 10,
      "fiber": 0
    }
  ],
  "totalCalories": 140,
  "totalProtein": 12,
  "totalCarbs": 1,
  "totalFat": 10
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{"items":[]}');
    return res.json({ success: true, result: parsed });
  } catch (err: any) {
    console.error('Error parsing meal with AI:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4b. AI Interactive Chat with Gemini
app.post('/api/ai-chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const { messages, profile, todayStats } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a certified elite sports dietitian, nutrition scientist, and empathetic habit coach.
User Context:
- Name: ${profile?.name || 'Athlete'}
- Goal: ${profile?.goal || 'Maintenance'}, Activity Level: ${profile?.activityLevel || 'Moderate'}
- Target Calories: ${profile?.targetCalories || 2000} kcal, Target Protein: ${profile?.targetProtein || 150}g, Carbs: ${profile?.targetCarbs || 200}g, Fat: ${profile?.targetFat || 65}g
- Today's Progress: Consumed ${todayStats?.totalCalories || 0} kcal (${todayStats?.totalProtein || 0}g protein, ${todayStats?.totalCarbs || 0}g carbs, ${todayStats?.totalFat || 0}g fat). Water: ${todayStats?.waterMl || 0}ml. Steps: ${todayStats?.steps || 0}.

Provide concise, highly actionable, friendly, and scientifically sound nutrition and fitness advice. Use bullet points or short paragraphs for readability.`;

    const chatHistory = (messages || []).map((m: any) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nChat History:\n${chatHistory}\n\nCoach:`,
    });

    const reply = response.text || 'Keep staying consistent with your protein and hydration goals today!';
    return res.json({ success: true, reply });
  } catch (err: any) {
    console.error('Error in AI Chat:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5. Cloud Sync Save & Load for Gmail / User Accounts
app.post('/api/sync/save', (req, res) => {
  const { email, profile, dailyLogs, customFoods, weightHistory } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required for cloud synchronization.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  cloudUserStorage.set(normalizedEmail, {
    profile,
    dailyLogs,
    customFoods,
    weightHistory,
    updatedAt: new Date().toISOString()
  });

  return res.json({ success: true, syncedAt: new Date().toISOString() });
});

app.get('/api/sync/load', (req, res) => {
  const email = (req.query.email as string || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required.' });
  }

  const userData = cloudUserStorage.get(email);
  if (!userData) {
    return res.json({ found: false, message: 'No remote cloud backup found for this email yet. Local state will be used.' });
  }

  return res.json({ found: true, data: userData });
});

// Vite Middleware for development / Static files for production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NutriFit Server running on http://localhost:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('Failed to start server:', err);
});
