/**
 * In-Memory LLM Response Cache
 * 
 * Serverless-safe: no filesystem operations.
 * Each cold start begins with an empty cache, which is fine
 * because Vercel keeps warm instances alive for a while.
 */

const llmCache = new Map();
const MAX_CACHE_SIZE = 500;

export function getCachedAIResponse(query) {
  if (!query) return null;
  const normalized = query.toLowerCase().trim();
  return llmCache.get(normalized) || null;
}

export function setCachedAIResponse(query, responseText) {
  if (!query || !responseText) return;
  const normalized = query.toLowerCase().trim();

  // Simple limit to prevent memory bloat
  if (llmCache.size > MAX_CACHE_SIZE) {
    const firstKey = llmCache.keys().next().value;
    llmCache.delete(firstKey);
  }

  llmCache.set(normalized, responseText);
}
