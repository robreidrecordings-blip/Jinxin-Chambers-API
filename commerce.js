const express = require('express');
const axios   = require('axios');
const router  = express.Router();

// ── Site Configurations ───────────────────────────────────────────────────────
// WC_UK_URL should be your base WordPress URL e.g. https://yoursite.co.uk
// The /wp-json/wc/v3 path is appended automatically below
const sites = {
  uk: {
    url:    process.env.WC_UK_URL,
    key:    process.env.WC_UK_KEY,
    secret: process.env.WC_UK_SECRET,
    name:   'co.uk'
  },
  com: {
    url:    process.env.WC_COM_URL,
    key:    process.env.WC_COM_KEY,
    secret: process.env.WC_COM_SECRET,
    name:   'com'
  },
  net: {
    url:    process.env.WC_NET_URL,
    key:    process.env.WC_NET_KEY,
    secret: process.env.WC_NET_SECRET,
    name:   'net'
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Build the full WooCommerce REST API base URL
function wcBase(siteKey) {
  const site = sites[siteKey];
  if (!site || !site.url) throw new Error(`Site not configured: ${siteKey}`);
  // Strip trailing slash then append WC REST path
  return `${site.url.replace(/\/$/, '')}/wp-json/wc/v3`;
}

function wcAuth(siteKey) {
  const site = sites[siteKey];
  return Buffer.from(`${site.key}:${site.secret}`).toString('base64');
}

async function fetchProducts(siteKey, params = {}) {
  const response = await axios.get(`${wcBase(siteKey)}/products`, {
    params,
    headers: { Authorization: `Basic ${wcAuth(siteKey)}` }
  });
  return response.data;
}

async function createOrder(siteKey, orderData) {
  const response = await axios.post(`${wcBase(siteKey)}/orders`, orderData, {
    headers: {
      Authorization:  `Basic ${wcAuth(siteKey)}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

async function fetchOrders(siteKey, params = {}) {
  const response = await axios.get(`${wcBase(siteKey)}/orders`, {
    params,
    headers: { Authorization: `Basic ${wcAuth(siteKey)}` }
  });
  return response.data;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// List configured sites
router.get('/sites', (req, res) => {
  const configured = Object.entries(sites)
    .filter(([, cfg]) => cfg.url)
    .map(([key, cfg]) => ({ key, name: cfg.name }));
  res.json({ sites: configured });
});

// Unified product catalog — optional ?site=uk|com|net filter
router.get('/products', async (req, res) => {
  const { site, ...params } = req.query;
  try {
    if (site) {
      if (!sites[site]) return res.status(400).json({ error: `Invalid site: ${site}` });
      const products = await fetchProducts(site, params);
      return res.json({ site: sites[site].name, products });
    }
    // No site filter — fetch from all configured sites
    const results = {};
    for (const key of Object.keys(sites)) {
      if (!sites[key].url) continue;
      try {
        results[key] = await fetchProducts(key, params);
      } catch (err) {
        results[key] = { error: err.message };
      }
    }
    return res.json(results);
  } catch (err) {
    console.error('Products error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Products from a specific site
router.get('/products/:site', async (req, res) => {
  const { site } = req.params;
  if (!sites[site]) return res.status(404).json({ error: 'Site not found' });
  try {
    const products = await fetchProducts(site, req.query);
    res.json({ site: sites[site].name, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create an order — protected by apiKeyMiddleware in server.js
router.post('/order/:site', async (req, res) => {
  const { site } = req.params;
  if (!sites[site]) return res.status(404).json({ error: 'Site not found' });

  const orderData = req.body;
  if (!Array.isArray(orderData.line_items) || orderData.line_items.length === 0) {
    return res.status(400).json({ error: 'Missing or empty line_items in request body' });
  }

  try {
    const result = await createOrder(site, orderData);
    res.status(201).json({ message: 'Order created', order: result });
  } catch (err) {
    const detail = err.response?.data?.message || err.message;
    console.error(`Order creation error (${site}):`, detail);
    res.status(500).json({ error: detail });
  }
});

// Dashboard — aggregated orders from all sites — protected by apiKeyMiddleware
router.get('/dashboard', async (req, res) => {
  try {
    const allOrders  = [];
    let totalRevenue = 0;
    let totalOrders  = 0;

    for (const [siteKey, config] of Object.entries(sites)) {
      if (!config.url) continue;
      try {
        const orders = await fetchOrders(siteKey, {
          per_page: 50, orderby: 'date', order: 'desc'
        });
        orders.forEach(o => {
          allOrders.push({ ...o, _site: config.name });
          totalRevenue += parseFloat(o.total) || 0;
        });
        totalOrders += orders.length;
      } catch (err) {
        console.error(`Dashboard fetch error (${siteKey}):`, err.message);
      }
    }

    allOrders.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));

    res.json({
      total_orders:   totalOrders,
      total_revenue:  totalRevenue.toFixed(2),
      recent_orders:  allOrders.slice(0, 20).map(o => ({
        id:       o.id,
        site:     o._site,
        date:     o.date_created,
        total:    o.total,
        status:   o.status,
        customer: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Guest'
      })),
      per_site: Object.fromEntries(
        Object.entries(sites).map(([siteKey, config]) => {
          const siteOrders  = allOrders.filter(o => o._site === config.name);
          const siteRevenue = siteOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
          return [siteKey, { orders: siteOrders.length, revenue: siteRevenue.toFixed(2) }];
        })
      )
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
