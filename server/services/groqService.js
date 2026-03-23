
import { tavily } from '@tavily/core';

const NUTRITION_PROMPT = `You are Foodity AI. Output ONLY nutrition data in the EXACT format below. NO intro sentences. NO "Hello" or greetings. NO text before the food name. NO paragraphs between sections. Start your reply DIRECTLY with the food name.

━━━━━━━━━━━━━━━━━━━━━━
FORMAT FOR SINGLE FOOD:
━━━━━━━━━━━━━━━━━━━━━━
**Food Name (serving size)**
• Calories: X kcal
• Protein: X g
• Carbohydrates: X g
• Fats: X g
• Fiber: X g
<details>
<summary>Show More Nutrition</summary>

• Iron: X mg
• Calcium: X mg
• Vitamin A: X IU
• Vitamin C: X mg
• Vitamin D: X IU
• Vitamin B12: X mcg
• Potassium: X mg
• Sodium: X mg
• Magnesium: X mg
• Zinc: X mg
</details>

• **Food Type:** [Healthy/Junk/Moderate] • **Load:** [Light/Moderate/Heavy] • **Insight:** [1 sentence personalized advice]

━━━━━━━━━━━━━━━━━━━━━━
FORMAT FOR MULTIPLE FOODS:
━━━━━━━━━━━━━━━━━━━━━━
**Food1 (serving) and Food2 (serving)**

| Food Item | Calories | Protein | Carbs | Fats | Fiber |
|---|---|---|---|---|---|
| Food1 | X kcal | X g | X g | X g | X g |
| Food2 | X kcal | X g | X g | X g | X g |
| **TOTAL** | **X kcal** | **X g** | **X g** | **X g** | **X g** |

<details>
<summary>Show More Nutrition</summary>

• Iron: X mg
• Calcium: X mg
• Vitamin A: X IU
• Vitamin C: X mg
• Vitamin D: X IU
• Vitamin B12: X mcg
• Potassium: X mg
• Sodium: X mg
• Magnesium: X mg
• Zinc: X mg
</details>

• **Food Type:** [Healthy/Junk/Moderate] • **Load:** [Light/Moderate/Heavy] • **Insight:** [1-2 sentence personalized advice]

━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES (NEVER VIOLATE):
━━━━━━━━━━━━━━━━━━━━━━
1. NEVER write any text before the food name (no "Hello", no "Sure!", no "Here's the breakdown")
2. NEVER add extra paragraphs between sections or after the Insight line
3. NEVER ask "Are you logging this?" or any follow-up question
4. ALWAYS assume standard serving size if not provided - mention it in the food name
5. ALWAYS include all 10 micronutrients inside the <details> block
6. If time-based suggestions are enabled, append them ONLY inside the <details> block, not outside`;

const GREETING_PROMPT = `You are Foodity AI, a friendly and helpful nutrition and health assistant.
The user is greeting you or starting a conversation.
1. Respond warmly and concisely (e.g., "Hi Valtooy! How can I help you today?").
2. Mention that you can help with nutrition analysis, meal logging, or health advice.
3. Keep it to 1-2 sentences. No tables, no strict nutrition format unless food is mentioned.`;

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
function buildSystemPrompt(userContext, mealLog = null, queryType = 'nutrition') {
  const mode = userContext?.ai_mode || 'nutrition';
  
  let baseModePrompt = NUTRITION_PROMPT;
  if (queryType === 'greeting' || queryType === 'general') {
    baseModePrompt = GREETING_PROMPT;
  } else if (mode === 'health' || queryType === 'health') {
    baseModePrompt = HEALTH_PROMPT;
  }

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
  
  const enableSuggestions = userContext?.enableSuggestions !== false;
  const suggestionContext = enableSuggestions
    ? '\n\nIMPORTANT: Any time-based meal suggestion MUST be placed as the LAST bullet inside the <details>...</details> block ONLY. NEVER place suggestion text outside or after the </details> tag. NEVER add any text after the Insight line.'
    : '\n\nIMPORTANT: Do NOT include any time-based suggestions. Follow the output format STRICTLY with nothing after the Insight line.';

  return timeContext + mealContext + baseModePrompt + suggestionContext;
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

export async function getAIResponse(message, nutritionContext = null, searchResults = null, userContext = null, history = [], mealLog = null, queryType = 'nutrition') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE' || apiKey === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  // Choose prompt based on AI mode
  const messages = [{ role: 'system', content: buildSystemPrompt(userContext, mealLog, queryType) }];

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
