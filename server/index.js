import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import orgRoutes from './routes/organizations.js';
import certRoutes from './routes/certificates.js';
import innRoutes from './routes/inn-lookup.js';
import assetRoutes from './routes/assets.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { requireAdminAuth } from './middleware/auth.js';

// --- Load .env file (no external dependency needed) ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// --- CORS: allow same-origin SPA + explicit known origins ---
const allowedOrigins = [
  'https://xn--b1ag3bst.help',   // вычет.help (public HTTPS)
];

// Allow requests where Origin matches the Host header (same-origin SPA).
// This covers all deployment modes without hardcoding every variant.
app.use(cors({
  origin(origin, callback) {
    // Allow same-origin requests (no Origin header) and curl/server-side calls
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Reject cross-origin requests from other sites
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// --- Rate limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

// --- Static file serving for uploaded org assets ---
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// --- Routes ---
// Auth routes (login, admin login) — apply auth rate limiter
app.use('/api/auth', authLimiter, authRoutes);

// Public read routes: org lookup (for form prefill), INN lookup
// These are used by the public form and need to be accessible without auth.
// Rate limiting protects against abuse.
app.use('/api/organizations', orgRoutes);
app.use('/api/certificates', certRoutes);
app.use('/api/inn-lookup', apiLimiter, innRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/admin', adminRoutes);

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Conflict', code: '23505' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// --- Ensure uploads directory exists, then start ---
fs.mkdirSync(uploadsDir, { recursive: true });

app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
  console.log(`KND API server running on http://localhost:${PORT}`);
});
