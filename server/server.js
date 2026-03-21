
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', authRoutes);
app.use('/api', chatRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Foodity AI API' });
});

// Dual-mode support: Listen locally, export for Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
