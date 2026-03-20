import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from the root before anything else imports process.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('[ENV] Environment variables initialized from:', path.join(__dirname, '../../.env'));
