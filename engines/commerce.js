const express = require('express');
const router = express.Router();

// Store configurations – all three stores, using environment variables
const stores = {
  com: {
    url: process.env.WC_COM_URL || 'https://thecopperglowshop.com',
    consumerKey: process.env.WC_COM_CONSUMER_KEY,cs_658005c135102b6cfd8a41a994e43e56a998b486
    consumerSecret: process.env.WC_COM_CONSUMER_SECRETck_ebad46e4eee1f66f5d805534f37abe5ff2cd19f1
  },
  co_uk: {
    url: process.env.WC_CO_UK_URL || 'https://thecopperglowshop.co.uk',
    consumerKey: process.env.WC_CO_UK_CONSUMER_KEY,ck_4407d6335b0fb5a268c22a01104a93c491d4f1e6
    consumerSecret: process.env.WC_CO_UK_CONSUMER_SECRETcs_fe9a5a726282fec835a146c0da8fc1256e14abc4
  },
  net: {
    url: process.env.WC_NET_URL || 'https://thecopperglowshop.net',
    consumerKey: process.env.WC_NET_CONSUMER_KEY,ck_2f1a96f4c531e1c4a4ca224258203bfbe0b4191d
    consumerSecret: process.env.WC_NET_CONSUMER_SECRETcs_1c2deeaf9a861137f438564051077dd27539ae61
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
