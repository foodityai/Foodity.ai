import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env file strictly from the /server directory where this is executing
dotenv.config({ path: path.join(__dirname, '../.env') });
