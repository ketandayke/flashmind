import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';

import connectDB from './config/db.js';
import authRoutes   from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import deckRoutes   from './routes/decks.js';
import cardRoutes   from './routes/cards.js';
import reviewRoutes from './routes/review.js';
import statsRoutes  from './routes/stats.js';
import errorHandler from './middleware/errorHandler.js';

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Initialize Express ───────────────────────────────────────────────────────
const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/decks',  deckRoutes);
app.use('/api/cards',  cardRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/stats',  statsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Multer Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum size is 10MB.'
        : `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }
  next(err);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Auth:   http://localhost:${PORT}/api/auth`);
  console.log(`   Upload: http://localhost:${PORT}/api/upload`);
  console.log(`   Decks:  http://localhost:${PORT}/api/decks`);
  console.log(`   Cards:  http://localhost:${PORT}/api/cards`);
  console.log(`   Review: http://localhost:${PORT}/api/review`);
  console.log(`   Stats:  http://localhost:${PORT}/api/stats`);
});

export default app;
