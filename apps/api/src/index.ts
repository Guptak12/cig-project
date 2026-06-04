import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { albumsRouter } from './routes/albums.js';
import { mediaRouter } from './routes/media.js';
import { usersRouter } from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

// ─── Global middleware ────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true }));
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
app.use('/events', eventsRouter);
app.use('/albums', albumsRouter);
app.use('/media', mediaRouter);
app.use('/users', usersRouter);

// Health check — used by Docker Compose healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ─── Error handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[api] Listening on http://localhost:${PORT}`);
});

export default app;
