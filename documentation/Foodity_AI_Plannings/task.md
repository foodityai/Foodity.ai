# Task: Vercel Serverless Conversion

- [x] Analyze project for Vercel readiness
- [x] Create implementation plan for serverless migration
- [x] Modify `server/server.js` for dual-mode support
- [x] Create `vercel.json` and root `package.json`
- [x] Fix environment variable configuration (`dotenv`)
- [x] Verify local/production compatibility
- [x] Initialize Git repository & create `.gitignore`
- [x] First local commit & remote setup

## 2. No History Mode & Intent Filtering
- [x] Create an `intentService.js` to handle pre-AI processing.
  - [x] Generate `greetings.json` (1000+ line dataset) for zero-token greeting responses.
  - [x] Implement simple intent catching (e.g., "ok", "thanks").
- [x] Integrate Intent Filter into `chatController.js` to bypass LLM when possible.
- [x] Modify history fetching to be conditional (only sent on "followup" intent).

## 3. Caching System (Zero-Token Strategy)
- [x] Design the caching logic for common queries (e.g., "1 apple").
- [x] Implement caching in `cacheService.js` and `chatController.js`.
- [x] Store pre-formatted markdown tables so the LLM doesn't need to rebuild them.
