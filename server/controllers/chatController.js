import { getAIResponse, performWebSearch, generateChatSummary } from '../services/groqService.js';
import { processNutritionQuery, cacheHandler } from '../services/nutritionIntelligence.js';
import { supabase } from '../config/supabaseClient.js';
import { getCachedAIResponse, setCachedAIResponse } from '../services/cacheService.js';
import { buildContext } from '../services/contextService.js';
import { format, parseISO } from 'date-fns';

const DAILY_MSG_LIMIT = 20;
const DAILY_SEARCH_LIMIT = 2;

// --- Helper: get or create usage record ---
async function getUsage(userId) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Create new record
    const { data: newRecord } = await supabase
      .from('usage_limits')
      .insert([{ user_id: userId, messages_today: 0, searches_today: 0, last_reset: today }])
      .select()
      .single();
    return newRecord;
  }

  // Reset if new day
  if (data.last_reset !== today) {
    const { data: reset } = await supabase
      .from('usage_limits')
      .update({ messages_today: 0, searches_today: 0, last_reset: today })
      .eq('user_id', userId)
      .select()
      .single();
    return reset;
  }

  return data;
}

// --- Helper: increment usage field ---
async function incrementUsage(userId, field) {
  const { data: current } = await supabase
    .from('usage_limits')
    .select(field)
    .eq('user_id', userId)
    .single();

  await supabase
    .from('usage_limits')
    .update({ [field]: (current?.[field] || 0) + 1 })
    .eq('user_id', userId);
}

async function ensureChatExists(userId, firstMessage, userContext) {
  // Generate short summary and build the title
  let shortSummary = await generateChatSummary(firstMessage);

  // Format Date (e.g., "Mar 18")
  let dateShort = 'Recent';
  try {
    const d = new Date(userContext.date);
    dateShort = format(d, 'MMM d');
  } catch (e) { }

  const finalTitle = `${dateShort} – ${shortSummary || 'New Chat'}`;

  const { data, error } = await supabase
    .from('chats')
    .insert([{ user_id: userId, title: finalTitle }])
    .select()
    .single();

  if (error) throw new Error('Failed to create chat: ' + error.message);
  return { id: data.id, title: finalTitle };
}

// --- POST /api/chat ---
export const handleChat = async (req, res) => {
try {
  const { message, chat_id, tool, profile = {} } = req.body;
  const search = tool === 'browser_search';
  const userId = req.headers['x-user-id'] || 'anonymous';

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // --- Build User Context Payload (Context Processing API layer) ---
  const userContext = buildContext(profile);

  // --- Usage limit check ---
  const usage = await getUsage(userId);
  if (usage && usage.messages_today >= DAILY_MSG_LIMIT) {
    return res.status(429).json({ error: 'Daily message limit reached. Try again tomorrow.', limitReached: true });
  }
  if (search && usage && usage.searches_today >= DAILY_SEARCH_LIMIT) {
    return res.status(429).json({ error: 'Daily web search limit (2) reached.', searchLimitReached: true });
  }

  // --- Resolve or create chat_id ---
  let activeChatId = chat_id;
  let chatTitle = '';

  if (!activeChatId) {
    const newChat = await ensureChatExists(userId, message, userContext);
    activeChatId = newChat.id;
    chatTitle = newChat.title;
  }

  // --- Fetch Today's Meal Log context ---
  let mealLog = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  if (activeChatId) {
    const today = new Date().toISOString().split('T')[0];
    const { data: logs } = await supabase
      .from('food_logs')
      .select('*')
      .eq('chat_id', activeChatId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`);
    
    if (logs) {
      logs.forEach(log => {
        const type = log.meal_type || 'snacks';
        if (mealLog[type]) mealLog[type].push(log);
      });
    }
  }

  // --- Save user message ---
  await supabase.from('messages').insert([{
    chat_id: activeChatId,
    role: 'user',
    content: message,
  }]);
  await incrementUsage(userId, 'messages_today');

  // --- Fetch last messages (History Context) ---
  let history = [];
  const { data: pastMessages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('chat_id', activeChatId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (pastMessages) {
    history = pastMessages.reverse();
    // Remove the current user message we just inserted so we don't duplicate it in groqService
    history.pop(); 
  }

  // --- Web search (optional) ---
  let searchResults = null;
  let sources = [];
  if (search) {
    searchResults = await performWebSearch(message);
    sources = searchResults.map(r => r.url);
    await incrementUsage(userId, 'searches_today');
  }


  // ── STEP 2: Nutrition Intelligence Pipeline (USDA + Search + Model + Cache) ──
  let nutritionContext = null;
  if (!search) {
    // NIS web search controlled independently from the user's "browser_search" tool
    const useNISSearch = userContext.enableSuggestions !== false;
    const nisResult = await processNutritionQuery(message, useNISSearch);

    if (nisResult.isFoodQuery && nisResult.foods && nisResult.foods.length > 0) {
      // Separate resolved foods from unresolved ones
      const resolvedFoods = nisResult.foods.filter(f => !f.nutrition?.needsClarification && f.nutrition?.calories !== null);
      const unresolvedFoods = nisResult.foods.filter(f => f.nutrition?.needsClarification);

      // Map ALL NIS results into the format the AI prompt expects
      const enrichedFoods = nisResult.foods.map(f => ({
        name:      f.name,
        amount:    f.amount,
        type:      'meal',
        source:    f.nutrition?.source || 'NIS',
        agreement: f.nutrition?.agreement || 'unknown',
        nutrition: {
          calories: f.nutrition?.calories ?? null,
          protein:  f.nutrition?.protein  ?? null,
          carbs:    f.nutrition?.carbs    ?? null,
          fat:      f.nutrition?.fat      ?? null,
          fiber:    f.nutrition?.fiber    ?? null,
        },
        needsClarification: f.nutrition?.needsClarification || false,
      }));

      nutritionContext = enrichedFoods;

      // Always log RESOLVED foods — don't let unresolved items block logging
      for (const food of resolvedFoods) {
        const n = food.nutrition;
        if (!n || n.calories === null) continue;
        await supabase.from('food_logs').insert([{
          chat_id:   activeChatId,
          user_id:   userId,
          food_name: food.name,
          calories:  n.calories || 0,
          protein:   n.protein  || 0,
          carbs:     n.carbs    || 0,
          fat:       n.fat      || 0,
          fiber:     n.fiber    || 0,
          meal_type: userContext.meal_type || 'snacks',
        }]);
        // Add to live mealLog for this request
        const mType = userContext.meal_type || 'snacks';
        if (mealLog[mType]) {
          mealLog[mType].push({
            food_name: food.name,
            calories:  n.calories || 0,
            protein:   n.protein  || 0,
            carbs:     n.carbs    || 0,
            fat:       n.fat      || 0,
            fiber:     n.fiber    || 0,
          });
        }
      }

      // If SOME foods need clarification but others resolved → still proceed normally
      // The AI prompt will handle asking about the specific unresolved items
    }
  }

  // --- Generate AI response (with System Caching) ---
  const isCacheable = !search && 
                      history.length === 0 && 
                      !message.toLowerCase().includes('today') && 
                      !message.toLowerCase().includes('history');
  
  let aiReply = '';
  if (isCacheable && getCachedAIResponse(message)) {
    aiReply = getCachedAIResponse(message);
    console.log(`[LLM Cache HIT] Returning cached format for: "${message}"`);
  } else {
    aiReply = await getAIResponse(message, nutritionContext, searchResults, userContext, history, mealLog);
    if (isCacheable) {
      setCachedAIResponse(message, aiReply);
    }
  }

  // --- Save AI response ---
  await supabase.from('messages').insert([{
    chat_id: activeChatId,
    role: 'assistant',
    content: aiReply,
  }]);

  return res.json({
    reply: aiReply,
    chat_id: activeChatId,
    title: chatTitle || undefined,
    sources,
    queryType: 'nutrition',
    nutritionData: nutritionContext || null,
  });
} catch (error) {
  console.error('Chat Controller Error:', error.message);
  res.status(500).json({ error: error.message });
}
};


// --- GET /api/food-logs ---
export const getFoodLogs = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: logs, error } = await supabase
      .from('food_logs')
      .select('id, chat_id, food_name, calories, protein, carbs, fat, fiber, meal_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw error;
    res.json(logs || []);
  } catch (error) {
    console.error('getFoodLogs error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// --- GET /api/messages?chat_id=xxx ---
export const getMessages = async (req, res) => {
  try {
    const { chat_id } = req.query;
    if (!chat_id) return res.status(400).json({ error: 'chat_id is required' });

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ messages: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- GET /api/chats ---
export const getChats = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';

    let { data, error } = await supabase
      .from('chats')
      .select('id, title, created_at, is_pinned, is_archived')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error && (error.code === 'PGRST204' || error.message.includes('column'))) {
      // Fallback if columns don't exist
      const fallback = await supabase
        .from('chats')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    res.json({ chats: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- DELETE /api/chats/:id ---
export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Chat ID is required' });

    // Assuming ON DELETE CASCADE in Supabase tables. 
    // To be safe, we'll delete messages and food_logs for this chat first if they exist.
    await supabase.from('messages').delete().eq('chat_id', id);
    await supabase.from('food_logs').delete().eq('chat_id', id);

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- PUT /api/chats/:id ---
export const updateChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, is_pinned, is_archived } = req.body;
    if (!id) return res.status(400).json({ error: 'Chat ID is required' });

    const updates = {};
    if (title !== undefined) updates.title = title;
    // We try to update these. If they fail due to missing columns in DB, we'll just log it.
    if (is_pinned !== undefined) updates.is_pinned = is_pinned;
    if (is_archived !== undefined) updates.is_archived = is_archived;

    const { data, error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        // Missing column? Just update title if we had it, ignoring the extra columns
        if (title !== undefined) {
          const { data: titleData, error: titleError } = await supabase
            .from('chats')
            .update({ title })
            .eq('id', id)
            .select()
            .single();
          if (titleError) throw titleError;
          return res.json({ chat: titleData, warning: 'Pinned/Archived not saved; columns missing in DB' });
        }
      }
      throw error;
    }

    res.json({ chat: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
