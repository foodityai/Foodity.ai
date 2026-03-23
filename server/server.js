import './config/env.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';

const app = express();

// ✅ CORS (allow all for now, restrict later)
app.use(cors({
  origin: "*"
}));

// ✅ Middleware
app.use(express.json());
app.use(morgan('dev'));

// ✅ Routes
app.use('/api', authRoutes);
app.use('/api', chatRoutes);

// ✅ Health check (for Render test)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Foodity AI API',
    time: new Date()
  });
});

// ✅ Root route (optional)
app.get('/', (req, res) => {
  res.send("🚀 Foodity Backend Running");
});

// ✅ PORT (Render compatible)
const PORT = process.env.PORT || 5000;

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

export default app;