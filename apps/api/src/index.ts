import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { clubsRouter } from './routes/clubs.js';
import { eventsRouter } from './routes/events.js';
import { albumsRouter } from './routes/albums.js';
import { mediaRouter } from './routes/media.js';
import { usersRouter } from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';

import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT ?? 4000;

// ─── Global middleware ────────────────────────────────────────────────────────

app.use(helmet());

// Robust CORS configuration
const webUrl = process.env.WEB_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
const allowedOrigins = [webUrl, 'http://localhost:3000'];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow configured origins and Vercel deployments (both prod and preview)
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('https://cig-project-web')) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));

app.use(morgan('dev'));
app.use(express.json());

// Rate limit all API endpoints — 100 req/min per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Too many requests, please slow down.' },
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/clubs', clubsRouter);
app.use('/events', eventsRouter);
app.use('/albums', albumsRouter);
app.use('/media', mediaRouter);
app.use('/users', usersRouter);

// Mock S3 endpoints for offline development using mock credentials
if (process.env.AWS_ACCESS_KEY_ID === 'mock-access-key-id') {
  app.put('/mock-s3-upload', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
    const key = req.query.key as string;
    if (!key) {
      res.status(400).send('Missing key parameter');
      return;
    }
    const filePath = path.join('/Users/destructor/Desktop/Kush/Projects/cig-project/storage/originals', key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, req.body);
    res.send({ ok: true });
  });

  app.get('/mock-s3-view/:bucket/*', (req, res) => {
    const { bucket } = req.params;
    const fileKey = (req.params as any)[0];
    const filePath = path.join('/Users/destructor/Desktop/Kush/Projects/cig-project/storage', bucket, fileKey);
    if (!fs.existsSync(filePath)) {
      res.status(404).send('Mock S3 file not found');
      return;
    }
    res.sendFile(filePath);
  });
}

// Health check — used by Docker Compose healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ─── Error handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[api] Listening on http://0.0.0.0:${PORT}`);
});

export default app;
