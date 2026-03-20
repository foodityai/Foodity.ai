/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FOODITY NUTRITION INTELLIGENCE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Pipeline:
 *   classifyQuery → parseFoodItems → fetchUSDA → searchNutrition → modelEstimate
 *   → combineResults (data fusion with weighted avg) → cacheHandler
 *
 * Priority weights:  USDA(0.6) > Search(0.25) > Model(0.15)
 * Cache:             In-memory per process (survives restart if upgraded to Redis)
 */

import '../config/env.js';
import axios from 'axios';
import { tavily } from '@tavily/core';

// ─── In-Memory Global Nutrition Cache ────────────────────────────────────────
// Key = normalised query string, Value = { nutrition, timestamp, source }
const NUTRITION_CACHE = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── API Key Rotation Pool ─────────────────────────────────────────────────────
// Reads comma-separated keys from env: GROQ_API_KEY, TAVILY_API_KEY, USDA_API_KEY
// e.g.  GROQ_API_KEY=key1,key2,key3
function buildKeyPool(envValue = '') {
  return envValue.split(',').map(k => k.trim()).filter(Boolean);
}

const keyState = {
  groq:   { pool: [], index: 0 },
  tavily: { pool: [], index: 0 },
  usda:   { pool: [], index: 0 },
};

function initKeyPools() {
  keyState.groq.pool   = buildKeyPool(process.env.GROQ_API_KEY);
  keyState.tavily.pool = buildKeyPool(process.env.TAVILY_API_KEY);
  keyState.usda.pool   = buildKeyPool(process.env.USDA_API_KEY);
}
initKeyPools();

function nextKey(service) {
  const s = keyState[service];
  if (!s || s.pool.length === 0) return null;
  const key = s.pool[s.index % s.pool.length];
  s.index = (s.index + 1) % s.pool.length;
  return key;
}

// ─── STEP 1: Query Classification ─────────────────────────────────────────────
/**
 * @returns {'greeting'|'nutrition'|'health'|'general'}
 */
export function classifyQuery(text = '') {
  const t = text.trim().toLowerCase();

  // Greetings / social — no API needed
  const greetingPatterns = [
    /^(hi|hello|hey|howdy|hiya|good\s*(morning|evening|afternoon|night))[!.,\s]*$/,
    /^(thanks?|thank you|thx|tysm|ty)[!.,\s]*$/,
    /^(bye|goodbye|see\s*ya|later|cya)[!.,\s]*$/,
    /^(ok|okay|got\s*it|sure|alright|cool)[!.,\s]*$/,
    /^(yes|no|nope|yep|yeah|nah)[!.,\s]*$/,
  ];
  if (greetingPatterns.some(r => r.test(t))) return 'greeting';

  // Nutrition queries
  const nutritionKw = [
    'calorie', 'calories', 'kcal', 'protein', 'carb', 'carbohydrate', 'fat',
    'fiber', 'fibre', 'macro', 'nutrition', 'nutritional', 'nutrient', 'vitamin',
    'mineral', 'sodium', 'potassium', 'sugar', 'ate', 'eat', 'eating', 'food',
    'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'drink', 'drank', 'weight',
    'diet', 'what should i eat', 'how much protein', 'how many calories',
  ];
  if (nutritionKw.some(kw => t.includes(kw))) return 'nutrition';

  // Health queries
  const healthKw = [
    'health', 'healthy', 'exercise', 'workout', 'gym', 'sleep', 'stress',
    'water', 'hydrat', 'wellbeing', 'wellness', 'fit', 'fitness', 'bmi',
  ];
  if (healthKw.some(kw => t.includes(kw))) return 'health';

  return 'general';
}

// ─── STEP 2: Query Normalisation ──────────────────────────────────────────────
/**
 * Normalise raw user input into a consistent cache key and structured food list.
 * Handles things like "2 eggs and a banana" → [{ food:'egg', qty:2 }, ...]
 */
export function parseFoodItems(text = '') {
  // Strip Context Metadata if present
  let cleanText = text.replace(/\[Context:.*?\]/gi, '');
  
  // Remove fillers BUT keep 'and' as a potential separator for splitting
  const FILLERS = /\b(with|also|some|a|an|the|i\s+ate|i\s+had|i\s+eat|just|please|can\s+you|tell\s+me|about|in)\b/gi;
  let clean = cleanText.toLowerCase().replace(FILLERS, ' ').replace(/\s{2,}/g, ' ').trim();

  // Split on delimiters: commas, plus signs, ampersands, or the word 'and'
  const chunks = clean.split(/[,+&]|\band\b/).map(s => s.trim()).filter(Boolean);

  const numWords = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    half: 0.5, quarter: 0.25, dozen: 12,
  };
  const amountRe = /^(\d+\.?\d*|one|two|three|four|five|six|seven|eight|nine|ten|half|quarter|dozen)\s*(g|kg|ml|l|oz|lb|cup|cups|piece|pieces|slice|slices|glass|glasses|bowl|bowls|serving|servings|tbsp|tsp)?\s*/i;

  const foods = [];
  for (const chunk of chunks) {
    const match = chunk.match(amountRe);
    let qty = 1;
    let unit = 'serving';
    let foodName = chunk;

    if (match) {
      const rawQty = match[1].toLowerCase();
      qty = numWords[rawQty] !== undefined ? numWords[rawQty] : parseFloat(rawQty);
      unit = match[2] || 'serving';
      foodName = chunk.slice(match[0].length).trim();
    }

    // Normalise known aliases
    const ALIASES = {
      'coke': 'coca cola',
      'pepsi': 'pepsi cola',
      'roti': 'indian roti',
      'chapati': 'indian chapati',
      'dal': 'lentil dal',
      'daal': 'lentil dal',
    };
    const lower = foodName.toLowerCase();
    foodName = ALIASES[lower] || foodName;

    if (foodName.length > 1) {
      foods.push({ food: foodName, qty, unit });
    }
  }

  // Normalised cache key — sorted for consistency
  const cacheKey = foods.map(f => `${f.qty}x${f.food}`).sort().join('|').toLowerCase();

  return { foods, cacheKey: cacheKey || clean };
}

// ─── STEP 3a: USDA Lookup ─────────────────────────────────────────────────────
const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1/foods/search';

/**
 * Fetches USDA data for a single food name.
 * Returns null if unavailable.
 * @returns {{ calories, protein, carbs, fat, fiber, source:'usda' }|null}
 */
export async function fetchUSDA(foodName) {
  const apiKey = nextKey('usda');
  if (!apiKey || apiKey === 'your_key_here') return null;

  try {
    const res = await axios.get(USDA_BASE, {
      params: {
        query: foodName,
        api_key: apiKey,
        pageSize: 3,
        dataType: 'SR Legacy,Foundation,Survey (FNDDS)',
      },
      timeout: 4000,
    });

    const foods = res.data?.foods;
    if (!foods || foods.length === 0) return null;

    const food = foods[0];
    const nutrients = food.foodNutrients || [];
    const find = (...names) => {
      for (const name of names) {
        const n = nutrients.find(n =>
          n.nutrientName?.toLowerCase().includes(name.toLowerCase())
        );
        if (n && n.value) return n.value;
      }
      return null;
    };

    return {
      calories: find('Energy') || null,
      protein:  find('Protein') || null,
      carbs:    find('Carbohydrate') || null,
      fat:      find('Total lipid') || null,
      fiber:    find('Fiber') || null,
      iron:       find('Iron') || null,
      calcium:    find('Calcium') || null,
      vitamina:   find('Vitamin A') || null,
      vitaminc:   find('Vitamin C') || null,
      vitamind:   find('Vitamin D') || null,
      vitaminb12: find('Vitamin B-12') || null,
      potassium:  find('Potassium') || null,
      sodium:     find('Sodium') || null,
      magnesium:  find('Magnesium') || null,
      zinc:       find('Zinc') || null,
      source: 'usda',
    };
  } catch (err) {
    console.warn(`[NIS] USDA lookup failed for "${foodName}":`, err.message);
    return null;
  }
}

// ─── STEP 3b: Search Nutrition (Tavily) ───────────────────────────────────────
const SEARCH_DOMAINS = [
  'healthline.com',
  'nutritionvalue.org',
  'usda.gov',
  'webmd.com',
  'mayoclinic.org',
  // Indian food nutrition sources
  'indianhealthyrecipes.com',
  'nutritionix.com',
  'calorieking.com',
];

/**
 * Searches nutrition data via Tavily with restricted trusted domains.
 * Extracts numeric calorie/protein/carb/fat values from result snippets.
 * @returns {{ calories, protein, carbs, fat, fiber, source:'search' }|null}
 */
export async function searchNutrition(query) {
  const apiKey = nextKey('tavily');
  if (!apiKey || apiKey === 'your_key_here') return null;

  try {
    const client = tavily({ apiKey });
    const result = await client.search(`${query} nutrition calories protein carbs fat`, {
      searchDepth: 'basic',
      maxResults: 3,
      includeDomains: SEARCH_DOMAINS,
    });

    const results = result.results || [];
    if (results.length === 0) return null;

    // Extract numbers from snippet text using regex
    const combined = results.map(r => `${r.title} ${r.content}`).join(' ');

    const extract = (patterns) => {
      for (const re of patterns) {
        const m = combined.match(re);
        if (m && m[1]) {
          const v = parseFloat(m[1].replace(/,/g, ''));
          if (v > 0 && v < 10000) return v;
        }
      }
      return null;
    };

    return {
      calories: extract([
        /(\d+\.?\d*)\s*(?:kcal|calories|cal)/i,
        /calories[:\s]+(\d+\.?\d*)/i,
      ]),
      protein: extract([
        /protein[:\s]+(\d+\.?\d*)\s*g/i,
        /(\d+\.?\d*)\s*g\s*(?:of\s*)?protein/i,
      ]),
      carbs: extract([
        /carbohydrates?[:\s]+(\d+\.?\d*)\s*g/i,
        /carbs?[:\s]+(\d+\.?\d*)\s*g/i,
        /(\d+\.?\d*)\s*g\s*(?:of\s*)?carbs?/i,
      ]),
      fat: extract([
        /fat[:\s]+(\d+\.?\d*)\s*g/i,
        /(\d+\.?\d*)\s*g\s*(?:of\s*)?fat/i,
      ]),
      fiber: extract([
        /fiber[:\s]+(\d+\.?\d*)\s*g/i,
        /fibre[:\s]+(\d+\.?\d*)\s*g/i,
      ]),
      source: 'search',
      urls: results.map(r => r.url),
    };
  } catch (err) {
    console.warn('[NIS] Tavily search failed:', err.message);
    return null;
  }
}

// ─── STEP 3c: Model Estimate (Groq Fallback) ───────────────────────────────────
/**
 * Uses Groq LLM purely for structured nutrition estimation.
 * Only called when USDA AND search both fail.
 * @returns {{ calories, protein, carbs, fat, fiber, source:'model' }|null}
 */
export async function modelEstimate(foodName, qty = 1, unit = 'serving') {
  const apiKey = nextKey('groq');
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') return null;

  const sysPrompt = `You are a precise nutrition database. Respond only with valid JSON and nothing else.
Never return 0 for any value unless physically impossible.
If unsure, give a best-estimate based on standard values (e.g. USDA SR Legacy).
For Indian regional foods, use standard Indian nutritional references.
Be consistent — same food must always return same numbers.`;

  const userPrompt = `Provide nutrition data for: ${qty} ${unit} of "${foodName}".
Return ONLY this exact JSON (no markdown, no explanation). For nutrients use numeric value, or null if unknown:
{
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>,
  "iron": <number in mg>,
  "calcium": <number in mg>,
  "vitamina": <number in IU or mcg>,
  "vitaminc": <number in mg>,
  "vitamind": <number in IU or mcg>,
  "vitaminb12": <number in mcg>,
  "potassium": <number in mg>,
  "sodium": <number in mg>,
  "magnesium": <number in mg>,
  "zinc": <number in mg>
}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.05, // Very low — we want consistency
        max_tokens: 120,
      }),
    });

    const data = await res.json();
    if (!res.ok) return null;

    const parsed = JSON.parse(data.choices[0].message.content);
    return {
      calories: parsed.calories || null,
      protein:  parsed.protein  || null,
      carbs:    parsed.carbs    || null,
      fat:      parsed.fat      || null,
      fiber:    parsed.fiber    || null,
      iron:       parsed.iron       || null,
      calcium:    parsed.calcium    || null,
      vitamina:   parsed.vitamina   || null,
      vitaminc:   parsed.vitaminc   || null,
      vitamind:   parsed.vitamind   || null,
      vitaminb12: parsed.vitaminb12 || null,
      potassium:  parsed.potassium  || null,
      sodium:     parsed.sodium     || null,
      magnesium:  parsed.magnesium  || null,
      zinc:       parsed.zinc       || null,
      source: 'model',
    };
  } catch (err) {
    console.warn('[NIS] Model estimate failed:', err.message);
    return null;
  }
}

// ─── STEP 4: Consensus-Based Data Fusion ──────────────────────────────────────
// No fixed weights. All sources treated equally.
// Final value determined by agreement → outlier removal → majority consensus.

function getMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function removeOutliers(values) {
  if (values.length <= 2) return values;
  const median = getMedian(values);
  return values.filter(v => v >= median * 0.7 && v <= median * 1.3);
}

function consensusValue(values) {
  if (values.length === 0) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);

  // If all values are close → simple average (strong agreement)
  if (max - min <= max * 0.15) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Remove outliers, then use majority
  const filtered = removeOutliers(values);
  if (filtered.length >= 2) {
    return filtered.reduce((a, b) => a + b, 0) / filtered.length;
  }

  // Last resort → median of all values
  return getMedian(values);
}

export function combineResults(results = []) {
  const valid = results.filter(Boolean);
  if (valid.length === 0) return null;

  const fields = [
    'calories', 'protein', 'carbs', 'fat', 'fiber',
    'iron', 'calcium', 'vitamina', 'vitaminc', 'vitamind',
    'vitaminb12', 'potassium', 'sodium', 'magnesium', 'zinc'
  ];

  const fused = {};

  for (const field of fields) {
    const values = valid
      .map(r => r[field])
      .filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);

    if (values.length === 0) {
      fused[field] = null;
      continue;
    }

    const result = consensusValue(values);
    fused[field] = Math.round(result * 10) / 10;
  }

  const sources = [...new Set(valid.map(r => r.source))];
  fused.source = sources.join('+');
  fused.confidence = sources.length >= 2 ? 'high' : 'medium';

  // Agreement score based on calorie spread across sources
  const calValues = valid.map(r => r.calories).filter(v => v !== null && !isNaN(v));
  if (calValues.length >= 2) {
    const spread = Math.max(...calValues) - Math.min(...calValues);
    fused.agreement =
      spread < 15 ? 'strong' :
      spread < 40 ? 'moderate' :
      'low';
  }

  return fused;
}

// ─── STEP 5a: Invalid Nutrition Detection ─────────────────────────────────────
function isInvalidNutrition(data) {
  if (!data) return true;
  const coreFields = ['calories', 'protein', 'carbs', 'fat'];
  return coreFields.every(f =>
    data[f] === null || data[f] === 0 || isNaN(data[f])
  );
}

// ─── STEP 5: Cache Handler ─────────────────────────────────────────────────────
export const cacheHandler = {
  get(key) {
    const entry = NUTRITION_CACHE.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      NUTRITION_CACHE.delete(key);
      return null;
    }
    return entry.nutrition;
  },

  set(key, nutrition) {
    NUTRITION_CACHE.set(key, { nutrition, timestamp: Date.now() });
  },

  invalidate(key) {
    NUTRITION_CACHE.delete(key);
  },

  clear() {
    NUTRITION_CACHE.clear();
  },

  size() {
    return NUTRITION_CACHE.size;
  },
};

// ─── MASTER PIPELINE ───────────────────────────────────────────────────────────
/**
 * Full nutrition intelligence pipeline for a single food item.
 * 1. Check cache
 * 2. USDA lookup
 * 3. Tavily search (if USDA incomplete)
 * 4. Model estimate (if both above fail or incomplete)
 * 5. Fuse + cache + return
 *
 * @param {string} foodName   normalised food name
 * @param {number} qty        quantity (e.g. 2 for "2 eggs")
 * @param {string} unit       unit (e.g. "g", "serving", "cup")
 * @param {boolean} forceRefresh  skip cache and recompute
 */
/**
 * Full nutrition intelligence pipeline for a single food item.
 * Step 3: Always runs model estimate (never conditional).
 * Step 4: Accepts useSearch flag — false = USDA + Model only.
 * Step 5: Retry once if result is invalid, then ask user for clarification.
 */
export async function getNutritionForFood(foodName, qty = 1, unit = 'serving', forceRefresh = false, useSearch = true) {
  const cacheKey = `${qty}x${unit}|${foodName.toLowerCase().trim()}`;

  if (!forceRefresh) {
    const cached = cacheHandler.get(cacheKey);
    if (cached) {
      console.log(`[NIS Cache HIT] ${cacheKey}`);
      return { ...cached, fromCache: true };
    }
  }

  console.log(`[NIS] Fetching nutrition for: ${qty} ${unit} of "${foodName}" (search: ${useSearch})`);

  // Run USDA, Web Search (if enabled), and Model all in parallel
  const [usdaRaw, searchRaw, modelRaw] = await Promise.all([
    fetchUSDA(foodName),
    useSearch ? searchNutrition(foodName) : null,
    modelEstimate(foodName, qty, unit),  // Always run — Step 3
  ]);

  // Scale all results by quantity
  const scale = (r, q) => {
    if (!r) return null;
    const factor = q || 1;
    return {
      ...r,
      calories:   r.calories   !== null ? Math.round(r.calories   * factor)        : null,
      protein:    r.protein    !== null ? Math.round(r.protein    * factor * 10) / 10 : null,
      carbs:      r.carbs      !== null ? Math.round(r.carbs      * factor * 10) / 10 : null,
      fat:        r.fat        !== null ? Math.round(r.fat        * factor * 10) / 10 : null,
      fiber:      r.fiber      !== null ? Math.round(r.fiber      * factor * 10) / 10 : null,
      iron:       r.iron       !== null ? Math.round(r.iron       * factor * 10) / 10 : null,
      calcium:    r.calcium    !== null ? Math.round(r.calcium    * factor * 10) / 10 : null,
      vitamina:   r.vitamina   !== null ? Math.round(r.vitamina   * factor * 10) / 10 : null,
      vitaminc:   r.vitaminc   !== null ? Math.round(r.vitaminc   * factor * 10) / 10 : null,
      vitamind:   r.vitamind   !== null ? Math.round(r.vitamind   * factor * 10) / 10 : null,
      vitaminb12: r.vitaminb12 !== null ? Math.round(r.vitaminb12 * factor * 100) / 100 : null,
      potassium:  r.potassium  !== null ? Math.round(r.potassium  * factor * 10) / 10 : null,
      sodium:     r.sodium     !== null ? Math.round(r.sodium     * factor * 10) / 10 : null,
      magnesium:  r.magnesium  !== null ? Math.round(r.magnesium  * factor * 10) / 10 : null,
      zinc:       r.zinc       !== null ? Math.round(r.zinc       * factor * 10) / 10 : null,
    };
  };

  const useScale = unit === 'serving' || unit === 'piece' || unit === 'pieces';
  const scaledUSDA   = useScale ? scale(usdaRaw,   qty) : usdaRaw;
  const scaledSearch = useScale ? scale(searchRaw, qty) : searchRaw;
  const scaledModel  = scale(modelRaw, qty);

  const fused = combineResults([scaledUSDA, scaledSearch, scaledModel].filter(Boolean));

  // ─── STEP 5b: Retry Logic ──────────────────────────────────────────────────
  if (isInvalidNutrition(fused)) {
    if (!forceRefresh) {
      console.warn(`[NIS] Invalid result for "${foodName}", retrying once with forceRefresh...`);
      return await getNutritionForFood(foodName, qty, unit, true, useSearch);
    }
    // Even after retry → flag for clarification
    console.warn(`[NIS] Still invalid after retry for "${foodName}", needs clarification.`);
    return {
      ...(fused || {}),
      source: 'unavailable',
      confidence: 'none',
      needsClarification: true,
    };
  }

  if (fused) {
    cacheHandler.set(cacheKey, fused);
    console.log(`[NIS Cache SET] ${cacheKey} (confidence: ${fused.confidence}, agreement: ${fused.agreement || 'n/a'})`);
  }

  return fused;
}

/**
 * Full pipeline for an ENTIRE user message containing multiple foods.
 * Returns enriched food list ready for AI context injection.
 *
 * @param {string} message   raw user message
 * @returns {{ isFoodQuery: boolean, foods: Array, totalNutrition: object|null }}
 */
export async function processNutritionQuery(message, useSearch = true) {
  const type = classifyQuery(message);
  if (type === 'greeting') {
    return { isFoodQuery: false, type: 'greeting', foods: [] };
  }
  if (type !== 'nutrition') {
    return { isFoodQuery: false, type, foods: [] };
  }

  const { foods, cacheKey } = parseFoodItems(message);

  // Check full-query cache first
  const cached = cacheHandler.get(cacheKey);
  if (cached) {
    console.log(`[NIS Full Cache HIT] ${cacheKey}`);
    return { isFoodQuery: true, fromCache: true, ...cached };
  }

  if (foods.length === 0) {
    return { isFoodQuery: true, foods: [], totalNutrition: null };
  }

  // Fetch all foods in parallel
  const enriched = await Promise.all(
    foods.map(async ({ food, qty, unit }) => {
      const nutrition = await getNutritionForFood(food, qty, unit, false, useSearch);
      return {
        name:      food,
        amount:    `${qty} ${unit}`,
        nutrition: nutrition || {
          calories: null, protein: null, carbs: null, fat: null, fiber: null,
          iron: null, calcium: null, vitamina: null, vitaminc: null, vitamind: null,
          vitaminb12: null, potassium: null, sodium: null, magnesium: null, zinc: null,
          source: 'unavailable', confidence: 'none',
        },
      };
    })
  );

  // Aggregate total nutrition
  const sum = (field) => {
    const vals = enriched
      .map(e => e.nutrition[field])
      .filter(v => v !== null && !isNaN(v));
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((s, v) => s + v, 0) * 10) / 10;
  };

  const totalNutrition = {
    calories: sum('calories'),
    protein:  sum('protein'),
    carbs:    sum('carbs'),
    fat:      sum('fat'),
    fiber:    sum('fiber'),
    iron:       sum('iron'),
    calcium:    sum('calcium'),
    vitamina:   sum('vitamina'),
    vitaminc:   sum('vitaminc'),
    vitamind:   sum('vitamind'),
    vitaminb12: sum('vitaminb12'),
    potassium:  sum('potassium'),
    sodium:     sum('sodium'),
    magnesium:  sum('magnesium'),
    zinc:       sum('zinc'),
  };

  const result = { isFoodQuery: true, foods: enriched, totalNutrition };

  // Cache the full result for this query
  cacheHandler.set(cacheKey, result);

  return result;
}
