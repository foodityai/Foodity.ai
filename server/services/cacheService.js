import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'llm_cache.json');
const llmCache = new Map();

// Ensure data directory exists
const dataDir = path.dirname(CACHE_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) {
        llmCache.set(k, v);
      }
      console.log(`[LLM Cache] Loaded ${llmCache.size} pre-computed AI responses`);
    } catch (e) {
      console.error('[LLM Cache] Failed to load llm_cache', e);
    }
  }
}

export function getCachedAIResponse(query) {
  if (!query) return null;
  const normalized = query.toLowerCase().trim();
  return llmCache.get(normalized) || null;
}

export function setCachedAIResponse(query, responseText) {
  if (!query || !responseText) return;
  const normalized = query.toLowerCase().trim();
  
  // Simple limit to prevent memory bloat (keeps ~500 items max)
  if (llmCache.size > 500) {
    const firstKey = llmCache.keys().next().value;
    llmCache.delete(firstKey);
  }
  
  llmCache.set(normalized, responseText);
  
  // Async write to disk
  fs.writeFile(CACHE_FILE, JSON.stringify(Object.fromEntries(llmCache)), (err) => {
    if (err) console.error('[LLM Cache] Failed to save llm_cache', err);
  });
}

// Initial load
loadCache();
