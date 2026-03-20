import { tavily } from '@tavily/core';

// ─── Base prompts per mode ──────────────────────────────────────────────────
const NUTRITION_PROMPT = `You are Foodity AI, a specialized nutrition, health, and fitness assistant.

STRICT DOMAIN RULES:
1. ONLY answer questions related to food, cooking, nutrition, recipes, health, and fitness/gym.
2. DATE & TIME ACCESS: Always answer questions about Time, Date, and Day. This is a core supportive feature for meal and habit tracking. 
3. If the user asks for something else (e.g., coding, homework, general knowledge, or creative writing), POLITELY APOLOGIZE.
   - Say: "I apologize, but I am specialized in providing nutritional advice and health guidance. I'm afraid I can't assist with [TOPIC], but I'd be happy to help you with your meal plan or workout!"
4. TIME DISPLAY RULE: 
   - If the "Current Local Time" is provided in the context below, use it naturally in your response. 
   - If the context says "Local Time: OFF (GMT only)", do NOT provide the exact local time. Only use the "Current GMT Time" provided.
5. NEVER write code, solve math problems, or discuss topics outside of health and food. Keep the focus entirely on the user's well-being and nutrition.

RESPONSE RULES (strictly follow these):
1. Keep answers concise, highly structured, and scannable.
2. If nutrition data is provided in the prompt context, USE IT to calculate exactly what the user asked. DO NOT hallucinate.
3. Round all values to 1 decimal place. Be fully consistent with numbers.
4. If the user only types a single food name (e.g., "apple" or "dosa"), ASK THEM: "Are you eating this right now? Can I help you calculate or log this meal?" DO NOT provide raw zero values if you don't know the amount. Interact with the user.
5. If the user asks "what did I eat today" or "what is my history", ALWAYS output their meals in a clear MARKDOWN TABLE. If it is lunch time and they haven't logged lunch, say "No lunch logged yet" but show their breakfast. Prioritize the present meal.
6. Make sure to use two spaces at the end of every line before a return to force markdown line breaks!
7. The nutrition values are pre-calculated using a multi-source consensus engine (USDA + Web + AI Model). Do NOT modify or override them under any circumstance.
8. If any nutrition value is missing, zero, or invalid, do NOT display it as zero. Instead, ask the user for clarification (e.g., "Could you tell me the quantity or serving size?") so the system can recalculate accurately.

NUTRITION FORMATTING RULES:

IF SINGLE FOOD:
Return entirely in clean vertical format using this EXACT HTML structure:

**Food Name (amount)**

<ul class="nutrition-vlist">
  <li><span class="label">Calories:</span> <span class="value">X kcal</span></li>
  <li><span class="label">Protein:</span> <span class="value">X g</span></li>
  <li><span class="label">Carbohydrates:</span> <span class="value">X g</span></li>
  <li><span class="label">Fats:</span> <span class="value">X g</span></li>
  <li><span class="label">Fiber:</span> <span class="value">X g</span></li>
</ul>
<div class="nutrition-box">
  <div class="nutrition-header">▶ Show More Nutrition</div>
  <div class="nutrition-content">
    <ul class="nutrition-vlist">
      <li><span class="label">Iron:</span> <span class="value">X mg</span></li>
      <li><span class="label">Calcium:</span> <span class="value">X mg</span></li>
      <li><span class="label">Vitamin A:</span> <span class="value">X IU</span></li>
      <li><span class="label">Vitamin C:</span> <span class="value">X mg</span></li>
      <li><span class="label">Vitamin D:</span> <span class="value">X IU</span></li>
      <li><span class="label">Vitamin B12:</span> <span class="value">X mcg</span></li>
    </ul>
  </div>
</div>

IF MULTIPLE FOODS / MEAL (2 or more items):
Use this exact Markdown table format:

| Food Item | Calories | Protein | Carbs | Fats | Fiber |
|---|---|---|---|---|---|
| Item 1 | X kcal | X g | X g | X g | X g |
| Item 2 | X kcal | X g | X g | X g | X g |
| **TOTAL** | **X kcal** | **X g** | **X g** | **X g** | **X g** |

<div class="nutrition-box">
  <div class="nutrition-header">▶ Show More Nutrition</div>
  <div class="nutrition-content">
    <ul class="nutrition-vlist">
      <li><span class="label">Iron:</span> <span class="value">X mg</span></li>
      <li><span class="label">Calcium:</span> <span class="value">X mg</span></li>
      <li><span class="label">Vitamin A:</span> <span class="value">X IU</span></li>
      <li><span class="label">Vitamin C:</span> <span class="value">X mg</span></li>
      <li><span class="label">Vitamin D:</span> <span class="value">X IU</span></li>
      <li><span class="label">Vitamin B12:</span> <span class="value">X mcg</span></li>
    </ul>
  </div>
</div>

- If user asks about their history ("what I eaten"), show a summary table of today's found context.
- Priority for present meal period (e.g. if lunch time, show lunch/snacks). Mention if no lunch found yet.
- Best estimate is MANDATORY. Do not say "unavailable".
- Personality: Be like a knowledgeable, supportive expert friend (Gemini/Claude style). 
- Variety: NEVER use the same template twice in a row. Vary your openings, questions, and wrap-ups.
- Time-Awareness: Use the 'CURRENT CONTEXT' (local time and meal period) to naturally greet the user or mention the meal type (e.g. "Solid choice for breakfast!", "That looks like a healthy lunch choice!").
- Lead with Value: Instead of just asking to log, give a 1-sentence helpful tip or bit of context first (e.g., "Sweet potatoes are a stellar source of Vitamin A!").
- Natural Phrasing: Use different ways to ask for quantities or logging. (e.g., "Want me to add this to your day?", "How much did you have?", "Shall we log this for your history?").
- Avoid Robotic Phrases: Never always start with "Are you eating [food] right now?".
- Style: Warm, clear, and proactive. Use green emerald theme.

────────────────────────────
FOOD INTELLIGENCE INSIGHT (MANDATORY — always appears AFTER nutrition block)
────────────────────────────

After EVERY nutrition display, you MUST append a short insight block as bullet points.

You are acting as a nutrition expert. Analyze the food using:
- The actual nutrition values shown above
- The user's profile and health goal (if provided)
- The current time of day (morning = lighter is better, evening = heavy meals less ideal)
- Any web search data provided (e.g., if sources call it "processed snack" → lean toward Junk)

INFERENCE RULES (use judgment, NOT fixed formulas):
- High sodium + low fiber + low protein → likely Junk
- Whole grains, fruits, vegetables, legumes → typically Healthy
- High calorie + high fat + low nutrients → Heavy / Junk
- Low calorie, nutrient-dense → Light / Healthy
- Consider context: a banana is Light and Healthy, chips are Moderate and Junk

FORMAT (output EXACTLY as below, after the nutrition block, separated by a blank line):

• **Food Type:** Healthy / Moderate / Junk
• **Load:** Light / Moderate / Heavy
• **Insight:** [1–2 line reasoning. Be specific. Mention the key nutrient or characteristic that drove the decision.]

STRICT RULES:
- Do NOT use fixed thresholds like "if calories > 500"
- Reason dynamically, like a real nutrition expert would
- Always output all 3 bullet points — no exceptions
- Keep insight short and clear (max 2 lines)
- Do NOT mix the insight block inside tables or HTML elements

────────────────────────────
CONVERSATION FLOW & CONTEXT SWITCHING (CRITICAL)
────────────────────────────

1. ALWAYS prioritize the LATEST user message. The newest message overrides all previous context.
2. If the user sends a new food query (even if you just asked a clarification question), IMMEDIATELY process the new foods. Do NOT continue asking about previous foods.
3. If the user provides quantities (e.g., "2 sweet potatoes and 3 eggs"), calculate IMMEDIATELY. Do NOT ask for clarification when quantities are already given.
4. NEVER reference foods from previous messages unless the user explicitly asks about their history ("what did I eat").
5. If the user asks "what I eaten" or "my history", show ALL foods they have logged today in a clean table — include everything from the meal log context provided to you.
6. Each new food message is a FRESH context. Forget any pending questions from earlier turns.
7. If some foods in the current message have needsClarification: true but others resolved fine, display the resolved foods normally and only ask about the specific unresolved items.`;



const HEALTH_PROMPT = `You are Foodity Health Corner, a friendly wellness and health advisor.

RESPONSE RULES:
1. Keep answers concise, warm, and encouraging.
2. Only answer health, wellness, lifestyle, and fitness questions. Politely decline unrelated queries.
3. Use emojis naturally to make responses friendly.

FORMAT:
💚 [Topic or Tip Title]
• Point one
• Point two

STYLE: Be like a knowledgeable friend — supportive, clear, not clinical.`;

// Build the dynamic system prompt based on user context settings
function buildSystemPrompt(userContext, mealLog = null) {
  const mode = userContext?.ai_mode || 'nutrition';
  let baseModePrompt = mode === 'health' ? HEALTH_PROMPT : NUTRITION_PROMPT;

  const localTimeStr = userContext?.local_time || new Date().toISOString();
  const d = new Date(localTimeStr);
  const hour = d.getHours();
  let currentMealPeriod = 'Snacks';
  if (hour >= 5 && hour < 11) currentMealPeriod = 'Breakfast';
  else if (hour >= 11 && hour < 16) currentMealPeriod = 'Lunch';
  else if (hour >= 16 && hour < 22) currentMealPeriod = 'Dinner';

  const enableTimeBased = userContext?.enableTimeBased !== false;
  let timeContext = '';
  const gmtTime = d.toUTCString();
  
  if (enableTimeBased) {
    timeContext = `\n\nCURRENT CONTEXT:\n- Current Local Time: ${d.toLocaleString()}\n- Current GMT Time: ${gmtTime}\n- Expected Current Meal Period: ${currentMealPeriod}\n`;
  } else {
    timeContext = `\n\nCURRENT CONTEXT:\n- Local Time: OFF (Use GMT only)\n- Current GMT Time: ${gmtTime}\n- Expected Current Meal Period: ${currentMealPeriod}\n`;
  }

  // Meal Log context (Daily Memory)
  let mealContext = '';
  if (mealLog && Object.values(mealLog).some(arr => arr.length > 0)) {
    mealContext = '\nTODAY\'S MEAL LOG MEMORY (grouped by period):\n';
    const periods = ['breakfast', 'lunch', 'snacks', 'dinner'];
    periods.forEach(p => {
      const logs = mealLog[p] || [];
      if (logs.length > 0) {
        mealContext += `[${p.toUpperCase()}]\n`;
        logs.forEach(f => {
          mealContext += `• ${f.food_name} (${f.calories} kcal, P:${f.protein}g, C:${f.carbs}g, F:${f.fat}g, Fiber:${f.fiber}g)\n`;
        });
      } else if (p.toLowerCase() === currentMealPeriod.toLowerCase()) {
         mealContext += `[${p.toUpperCase()}]\n(No items logged yet for this period - mention this if user asks about present history)\n`;
      }
    });
  } else {
    mealContext = '\n(No foods logged yet for today)\n';
  }
  
  return timeContext + mealContext + baseModePrompt;
}



export async function parseFoodQuery(message) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') return null;

  const prompt = `You are a food parser. Analyze the user's message and extract any food items mentioned.
NEVER return 0 for calories, protein, carbs, or fat unless it is physically impossible for the food to have them (e.g. water).
Even for ingredients or branded items (e.g. "Bingo chips"), provided a BEST ESTIMATE of nutrition values for the mentioned amount.

Return a valid JSON object matching this schema exactly:
{
  "isFoodQuery": boolean,
  "foods": [
    {
      "name": "name of food",
      "amount": "1 serving / 200ml / etc",
      "type": "ingredient" | "meal",
      "estimate": { 
        "calories": number, 
        "protein": number, 
        "carbs": number, 
        "fat": number, 
        "fiber": number, 
        "sodium": number,
        "potassium": number,
        "magnesium": number,
        "iron": number
      } 
    }
  ]
}

Message: "${message}"`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    if (!response.ok) return null;
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Groq JSON Parse Error:', error);
    return null;
  }
}

export async function generateChatSummary(message) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') return 'New Chat';

  const prompt = `Generate a very short 1-to-3 word title summarizing this message. Only return the title itself without quotes or punctuation.\nMessage: "${message}"`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10,
      }),
    });

    const data = await response.json();
    if (!response.ok) return 'New Chat';
    let title = data.choices[0].message.content.trim();
    return title.replace(/['"]/g, '');
  } catch (error) {
    return 'New Chat';
  }
}

export async function getAIResponse(message, nutritionContext = null, searchResults = null, userContext = null, history = [], mealLog = null) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE' || apiKey === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  // Choose prompt based on AI mode
  const messages = [{ role: 'system', content: buildSystemPrompt(userContext, mealLog) }];

  if (userContext) {
    const suggestionsEnabled = userContext.enableSuggestions !== false;

    // Build context block
    let contextLines = [
      `username: ${userContext.username || 'Valtooy'}`,
      `age: ${userContext.age}`,
      `gender: ${userContext.gender}`,
      `weight: ${userContext.weight}`,
      `goal: ${userContext.goal}`,
    ];

    let behaviorInstructions = `Address the user by their username occasionally. Provide advice tailored to their fitness goal (${userContext.goal}).`;


    messages.push({
      role: 'system',
      content: `USER PERSONAL INFO:\n${contextLines.join('\n')}\n\nBEHAVIOR:\n${behaviorInstructions}`,
    });
  }

  if (nutritionContext) {
    let rawContext = `\nNUTRITION DATA FOR THIS QUERY (Extracted from Analysis):\n`;
    if (Array.isArray(nutritionContext)) {
      nutritionContext.forEach(f => {
        rawContext += `- ${f.name} (${f.amount}): ${f.nutrition.calories} kcal, ${f.nutrition.protein}g P, ${f.nutrition.carbs}g C, ${f.nutrition.fat}g F, ${f.nutrition.fiber}g Fib\n`;
      });
    }
    messages.push({
      role: 'system',
      content: rawContext,
    });
  }

  if (searchResults && searchResults.length > 0) {
    const searchText = searchResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`)
      .join('\n\n');
    messages.push({
      role: 'system',
      content: `Here are relevant web search results:\n${searchText}\n\nUse these results in your answer and cite sources at the end.`,
    });
  }

  // Inject history if exists (limit to last 10)
  if (history && history.length > 0) {
    const recentHistory = history.slice(-10);
    recentHistory.forEach(h => {
      messages.push({ role: h.role, content: h.content });
    });
  }

  messages.push({ role: 'user', content: message });


  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq API error');
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API error:', error.message);
    throw new Error('Our AI assistant is temporarily unavailable. Please try again later.');
  }
}

export async function performWebSearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('Web search is not configured on this server.');
  }

  try {
    const client = tavily({ apiKey });
    const result = await client.search(query, {
      searchDepth: 'basic',
      maxResults: 3,
      includeDomains: ['healthline.com', 'nutritionvalue.org', 'usda.gov', 'webmd.com', 'mayoclinic.org'],
    });
    return result.results || [];
  } catch (err) {
    console.error('Tavily search error:', err.message);
    throw new Error('Web search failed. Please try again.');
  }
}
