# Implementation Plan - Vercel Serverless Conversion

Converting the Foodity AI backend to a Vercel-compatible serverless architecture while maintaining the existing Express logic and adding a fallback for traditional server hosting.

## Proposed Changes

### [Backend] [server/server.js](file:///d:/VALTOOY/THOO/ONE/PIECE/foodity-ai/server/server.js)
- **[MODIFY]**: Comment out the `app.listen()` block.
- **[MODIFY]**: Add `export default app;` at the end of the file.
- **[MODIFY]**: Wrap the traditional server logic in a conditional block (only run if not on Vercel).
- **[MODIFY]**: Fix `dotenv.config()` to remove hardcoded relative paths.

### [Root] [NEW] [vercel.json](file:///d:/VALTOOY/THOO/ONE/PIECE/foodity-ai/vercel.json)
- **[NEW]**: Create a Vercel configuration file at the project root.
- Route `/api/(.*)` to the backend serverless entry point.
- Configure the frontend build directory and framework.

### [Root] [NEW] [package.json](file:///d:/VALTOOY/THOO/ONE/PIECE/foodity-ai/package.json)
- **[NEW]**: Create a root-level `package.json` to help Vercel manage the mono-repo structure.
- Define build scripts for both `client` and `server`.

### [Services] [Global]
- **[MODIFY]**: Standardize `dotenv.config()` calls across all service files to remove hardcoded paths (`../.env`). This ensures compatibility with Vercel's environment variable injection.
- Files affected: `groqService.js`, `supabaseClient.js`, `usdaService.js`, etc.

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
1. **Local Test**: Run `npm run dev` in the `server` folder. Expect: Server should still start locally if the environment is not production.
2. **Vercel Readiness**: Verify that `api/index.js` (or the rewrite target) exports the `app` instance correctly.
3. **Env Vars**: Check that no hardcoded paths exist in `dotenv.config()`.
