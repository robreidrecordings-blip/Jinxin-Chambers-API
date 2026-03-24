const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import engines
const commerceEngine = require('./engines/commerce');
const mediaEngine = require('./engines/media');

const app = express();

// ---------- Global Middleware ----------
app.set('trust proxy', 1);                 // For accurate rate‑limiting behind proxy
app.use(helmet());                         // Security headers
app.use(cors());                           // Allow all origins (adjust for production)
app.use(express.json());                   // Parse JSON bodies
app.use(morgan('combined'));               // Request logging

// Rate limiting (global)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ---------- Authentication ----------
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

// ---------- Protected Routes ----------
// Apply authentication to sensitive commerce endpoints
app.use('/api/commerce/order', apiKeyMiddleware);
app.use('/api/commerce/dashboard', apiKeyMiddleware);

// ---------- Mount Engines ----------
// Commerce routes (public product endpoints, protected order/dashboard)
app.use('/api/commerce', commerceEngine);

// Media routes (public)
app.use('/api/media', mediaEngine);

// ---------- Public Info Endpoints ----------
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

// ---------- Start Server ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
