const express = require('express');
const router = express.Router();

// Store configurations – all three stores, using environment variables
const stores = {
  com: {
    url: process.env.WC_COM_URL || 'https://thecopperglowshop.com',
    consumerKey: process.env.WC_COM_CONSUMER_KEY,
    consumerSecret: process.env.WC_COM_CONSUMER_SECRET
  },
  co_uk: {
    url: process.env.WC_CO_UK_URL || 'https://thecopperglowshop.co.uk',
    consumerKey: process.env.WC_CO_UK_CONSUMER_KEY,
    consumerSecret: process.env.WC_CO_UK_CONSUMER_SECRET
  },
  net: {
    url: process.env.WC_NET_URL || 'https://thecopperglowshop.net',
    consumerKey: process.env.WC_NET_CONSUMER_KEY,
    consumerSecret: process.env.WC_NET_CONSUMER_SECRET
  }
};

async function fetchFromWoo(store, endpoint, query = '') {
  const config = stores[store];
  if (!config) throw new Error(`Store ${store} not configured`);
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  const url = `${config.url}/wp-json/wc/v3/${endpoint}${query}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error(`WooCommerce error: ${res.status}`);
  return res.json();
}

// Public product endpoints
router.get('/products/:store', async (req, res) => {
  const { store } = req.params;
  const { per_page = 50 } = req.query;
  try {
    const products = await fetchFromWoo(store, 'products', `?per_page=${per_page}`);
    res.json(products);
  } catch (err) {
    console.error(`Failed to fetch products for ${store}:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:store/:id', async (req, res) => {
  const { store, id } = req.params;
  try {
    const product = await fetchFromWoo(store, `products/${id}`);
    res.json(product);
  } catch (err) {
    console.error(`Failed to fetch product ${id} for ${store}:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/sites', (req, res) => {
  const sites = Object.entries(stores).map(([id, config]) => ({
    id,
    name: config.url.replace(/^https?:\/\//, '')
  }));
  res.json(sites);
});

// Protected endpoints (placeholders – keep your existing logic)
router.get('/dashboard', async (req, res) => {
  res.json({ total_orders: 0, total_revenue: '0.00', recent_orders: [], per_site: {} });
});

router.post('/order/:store', async (req, res) => {
  res.json({ success: true });
});

module.exports = router;
