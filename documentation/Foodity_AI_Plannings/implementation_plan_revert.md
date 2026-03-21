# Goal Description
The objective is to completely revert the Foodity AI backend architecture from Vercel Serverless Functions back to a stable, traditional Node.js/Express application. Additionally, we will roll back the aggressive token reduction modifications, restoring the friendly "OP version" AI personality, robust markdown responses (tables for multiple foods, structured bullets for single foods), and removing the repetitive "Are you logging this?" prompts while keeping caching and the core USDA nutrition engine intact.

## Proposed Changes

---

### Backend Architecture Reversion
Complete structural rollback to support `http://localhost:5000` via Express.

#### [DELETE] `/api` (directory)
Entirely remove the native Vercel serverless directory and its 9 generated files.

#### [DELETE] `/vercel.json`
Remove the Vercel edge routing override to stop it from conflicting with local execution.

#### [MODIFY] `/package.json`
Remove the aggressive root dependency hoisting that was required for Vercel compilation. Return to a basic root wrapper.

#### [MODIFY] `/server/config/env.js`
Remove Vercel environment checks and restore standard `dotenv.config()` for standard local file loading.

#### [MODIFY] `/server/server.js`
Replace the dual-mode Vercel/Express hybrid server code with the strict, traditional `server.traditional.js` baseline. 

---

### AI Behavior Restoration
Revert and refine the generative pipelines to restore premium formatting and behavior.

#### [MODIFY] `server/services/groqService.js`
Rewrite `NUTRITION_PROMPT` to restore the "OP Version".
- **Single Foods**: Restore structured bullet outputs + insights.
- **Multiple Foods**: strictly enforce Markdown tables.
- **Tone**: Remove aggressive truncation rules. Bring back the warm, supportive coach persona.
- **Looping Removal**: Explicitly forbid the AI from looping "Are you logging this?" or repetitive confirmations. Instruct it to boldly assume standard serving sizes if omitted.

#### [MODIFY] `server/controllers/chatController.js`
Disable the "Zero-Token Intent Filtering" system. 
- Disconnect `intentService.js` to ensure the AI intercepts and natively responds to greetings naturally via typical chat history context.
- Keep `cacheService.js` active locally for standard LLM response caching (as requested by the user).

---

## Verification Plan
### Automated Tests
- Run `npm run dev` in the `/server` folder to verify Express successfully binds to port 5000.
- Ensure no Vercel or dual-module crashes occur on boot.

### Manual Verification
- Execute a single food query (e.g., "1 egg nutrition") to verify bullet points and the "Show More Nutrition" payload functionality.
- Execute a multi-food query (e.g., "2 eggs and milk") to ensure the LLM strictly groups them into a Markdown table and appends a health summary payload below.
- Confirm the AI answers standard greetings natively without hard "Zero-Token" cutoffs.
