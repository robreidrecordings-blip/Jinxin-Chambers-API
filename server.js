const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const morgan     = require('morgan');
require('dotenv').config();

// Import engines
const commerceEngine = require('./engines/commerce');
const mediaEngine    = require('./engines/media');

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ── Authentication ────────────────────────────────────────────────────────────
const apiKeyMiddleware = (req, res, next) => {
  const apiKey     = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;
  if (!expectedKey) {
    console.warn('API_KEY not set – authentication disabled');
    return next();
  }
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
};

// ── Protected Routes ──────────────────────────────────────────────────────────
app.use('/api/commerce/order',     apiKeyMiddleware);
app.use('/api/commerce/dashboard', apiKeyMiddleware);

// ── Mount Engines ─────────────────────────────────────────────────────────────
app.use('/api/commerce', commerceEngine);
app.use('/api/media',    mediaEngine);

// ── Public Endpoints ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Jingin Chambers API',  // fixed: was 'Jinxin'
    version: '1.0.0',
    endpoints: {
      health:    '/api/health',
      media:     '/api/media/catalog',
      products:  '/api/commerce/products',
      dashboard: '/api/commerce/dashboard  (requires x-api-key header)'
    }
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Jingin Chambers API running on port ${PORT}`);
});