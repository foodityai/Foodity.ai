import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../../.env');

// On Vercel, .env is not present; check if it exists before trying to load
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('[ENV] Environment variables initialized from:', envPath);
} else {
  console.log('[ENV] Running in production/cloud mode or .env missing. Using pre-injected environment variables.');
}
