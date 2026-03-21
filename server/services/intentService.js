let greetingsSet = new Set();
try {
  const { readFileSync, existsSync } = await import('fs');
  const { dirname, join } = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const filePath = join(__dirname, '../data/greetings.json');

  if (existsSync(filePath)) {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    greetingsSet = new Set(data);
  }
} catch (e) {
  // Graceful fallback — intent detection still works without the expanded set
  console.warn('[Intent] Greetings dataset unavailable, using inline fallback.');
}

/**
 * Fast, 0-token intent detection to bypass LLM for basic chat events.
 * @param {string} text - The raw user message
 * @returns {{ type: 'greeting'|'simple'|'followup'|'nutrition', reply: string|null }}
 */
export function detectIntent(text = '') {
  // Normalize exactly like the generator (strip all non-alphanumeric and lowercase)
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  // 1. Zero-Token Greeting Filter
  // Resolves against the ~1,600 pre-generated permutations
  if (greetingsSet.has(clean)) {
    const replies = [
      "Hello! 👋 I'm Foodity AI. What food or nutrition question can I answer for you?",
      "Hi there! 🥗 I can help you with nutrition facts, meal prep, or fitness advice. What's on your mind?",
      "Hey! 😊 Let me know what you're eating today and I'll calculate the nutrition for you."
    ];
    return {
      type: 'greeting',
      reply: replies[Math.floor(Date.now() / 1000) % replies.length]
    };
  }

  // 2. Simple Intent Filter (Yes/No/Thanks/Ok)
  // Catch 1-word inputs that don't need AI cost
  const okSet = new Set(['ok', 'okay', 'gotit', 'cool', 'alright', 'sure', 'understood']);
  const thanksSet = new Set(['thanks', 'thankyou', 'thx', 'tysm', 'ty', 'appreciateit']);
  const yesSet = new Set(['yes', 'yep', 'yeah', 'yea', 'y']);
  const noSet = new Set(['no', 'nope', 'nah', 'n']);

  if (okSet.has(clean)) {
    return { type: 'simple', reply: "Got it! Let me know if you need anything else." };
  }
  if (thanksSet.has(clean)) {
    return { type: 'simple', reply: "You're very welcome! Stay healthy! 💪" };
  }
  if (noSet.has(clean)) {
    return { type: 'simple', reply: "Alright! Just let me know when you need help with your meals." };
  }
  if (yesSet.has(clean)) {
    return { type: 'followup', reply: null }; // Requires previous context
  }

  // Check for explicit conversational "follow-ups" that need history
  if (/^(more|continue|add|why|how|explain)/i.test(text.trim())) {
    return { type: 'followup', reply: null };
  }

  // Default: Fallback to the main nutrition pipeline
  return { type: 'nutrition', reply: null };
}
