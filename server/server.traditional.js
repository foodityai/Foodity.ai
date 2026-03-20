import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';

// Setup environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', authRoutes);
app.use('/api', chatRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Foodity AI API (Traditional)' });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Traditional Server running on port ${PORT}`);
});

export default app;
