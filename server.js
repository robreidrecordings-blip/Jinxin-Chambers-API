const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Trust proxy (optional, silences rate‑limit warning)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors()); // allow all origins for testing
app.use(express.json());
app.use(morgan('combined'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ---------- API Key Middleware ----------
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
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

// ---------- Engines ----------
const commerceEngine = require('./engines/commerce');
const mediaEngine = require('./engines/media');

// Protect the order and dashboard routes BEFORE the commerce engine sees them
app.use('/api/commerce/order', apiKeyMiddleware);
app.use('/api/commerce/dashboard', apiKeyMiddleware);

// Mount commerce routes (public product endpoints remain unprotected)
app.use('/api/commerce', commerceEngine);

// Mount media routes (public)
app.use('/api/media', mediaEngine);

// ---------- Health & Root ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Jinxin Chambers API', version: '1.0.0' });
});

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
