import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

const app = express();
const port = process.env.PORT ?? 3000;

// ── Middleware toàn cục ────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));

// ── Health check — dùng để verify server đang sống (không cần DB) ─────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// routes articles/tags/search — Bước 3.3-3.5

// ── Fallback handlers — đặt CUỐI, sau tất cả router ─────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[mini-wiki] API đang chạy tại http://localhost:${port}`);
  console.log(`[mini-wiki] CORS cho phép origin: ${process.env.CORS_ORIGIN ?? '(chưa đặt)'}`);
});
