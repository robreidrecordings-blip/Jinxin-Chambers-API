const express = require('express');
const router = express.Router();
// ── Store configurations ───────────────────────────────────────────────────────
const stores = {
  com: {
    url:            process.env.WC_COM_URL            || 'https://thecopperglowshop.com',
    consumerKey:    process.env.WC_COM_CONSUMER_KEY,ck_abd69adccb7195fb52462acca03479d3e9fbcb17
   consumerSecret: process.env.WC_CO_UK_CONSUMER_SECRETcs_0757cba26afe2fb757091c045caedaae8f25df11
  },
  co_uk: {
    url:            process.env.WC_CO_UK_URL            || 'https://thecopperglowshop.co.uk',
    consumerKey:    process.env.WC_CO_UK_CONSUMER_KEY,ck_4407d6335b0fb5a268c22a01104a93c491d4f1e6
   consumerSecret: process.env.WC_CO_UK_CONSUMER_SECRETcs_fe9a5a726282fec835a146c0da8fc1256e14abc4
  },
  net: {
    url:            process.env.WC_NET_URL            || 'https://thecopperglowshop.net',
    consumerKey:    process.env.WC_NET_CONSUMER_KEY,ck_2f1a96f4c531e1c4a4ca224258203bfbe0b4191d
   consumerSecret: process.env.WC_NET_CONSUMER_SECRETcs_1c2deeaf9a861137f438564051077dd27539ae61
  }
};

// ── WooCommerce fetch helper ───────────────────────────────────────────────────
// Uses Basic Auth header instead of credentials in URL (safer — not logged)
async function fetchFromWoo(store, endpoint, params = {}) {
  const config = stores[store];
  if (!config) throw new Error(`Store "${store}" not configured`);
  if (!config.consumerKey || !config.consumerSecret) {
    throw new Error(`Store "${store}" missing WooCommerce credentials in environment variables`);
  }

  // Build query string from params object
  const qs = new URLSearchParams(params).toString();
  const url = `${config.url.replace(/\/$/, '')}/wp-json/wc/v3/${endpoint}${qs ? '?' + qs : ''}`;

  // Basic Auth — credentials in header not URL
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

  const res = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type':  'application/json'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`WooCommerce ${res.status} for ${store} — ${url}`);
    console.error(`Response: ${text}`);
    throw new Error(`WooCommerce error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

// ── Routes ────────────────────────────────────────────────────────────────────

// List all configured sites
router.get('/sites', (req, res) => {
  const sites = Object.entries(stores).map(([id, config]) => ({
    id,
    name:        config.url.replace(/^https?:\/\//, ''),
    configured:  !!(config.consumerKey && config.consumerSecret)
  }));
  res.json(sites);
});

// All products from a store
router.get('/products/:store', async (req, res) => {
  const { store } = req.params;
  const { per_page = 50, page = 1, category, search } = req.query;
  try {
    const params = { per_page, page };
    if (category) params.category = category;
    if (search)   params.search   = search;
    const products = await fetchFromWoo(store, 'products', params);
    res.json(products);
  } catch (err) {
    console.error(`Products fetch failed (${store}):`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Single product by ID
router.get('/products/:store/:id', async (req, res) => {
  const { store, id } = req.params;
  try {
    const product = await fetchFromWoo(store, `products/${id}`);
    res.json(product);
  } catch (err) {
    console.error(`Product fetch failed (${store}/${id}):`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard — aggregated orders from all stores
router.get('/dashboard', async (req, res) => {
  try {
    const allOrders  = [];
    let totalRevenue = 0;

    for (const [storeId, config] of Object.entries(stores)) {
      if (!config.consumerKey || !config.consumerSecret) continue;
      try {
        const orders = await fetchFromWoo(storeId, 'orders', {
          per_page: 50, orderby: 'date', order: 'desc'
        });
        orders.forEach(o => {
          allOrders.push({ ...o, _store: storeId });
          totalRevenue += parseFloat(o.total) || 0;
        });
      } catch (err) {
        console.error(`Dashboard fetch failed (${storeId}):`, err.message);
      }
    }

    allOrders.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));

    res.json({
      total_orders:  allOrders.length,
      total_revenue: totalRevenue.toFixed(2),
      recent_orders: allOrders.slice(0, 20).map(o => ({
        id:       o.id,
        store:    o._store,
        date:     o.date_created,
        total:    o.total,
        status:   o.status,
        customer: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Guest'
      })),
      per_store: Object.fromEntries(
        Object.keys(stores).map(id => {
          const storeOrders  = allOrders.filter(o => o._store === id);
          const storeRevenue = storeOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
          return [id, { orders: storeOrders.length, revenue: storeRevenue.toFixed(2) }];
        })
      )
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order — protected by API key middleware in server.js
router.post('/order/:store', async (req, res) => {
  const { store } = req.params;
  const orderData = req.body;

  if (!Array.isArray(orderData.line_items) || orderData.line_items.length === 0) {
    return res.status(400).json({ error: 'Missing or empty line_items' });
  }

  try {
    const config = stores[store];
    if (!config) return res.status(404).json({ error: `Store "${store}" not found` });

    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    const url  = `${config.url.replace(/\/$/, '')}/wp-json/wc/v3/orders`;

    const res2 = await fetch(url, {
      method:  'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(orderData)
    });

    if (!res2.ok) {
      const text = await res2.text();
      throw new Error(`WooCommerce ${res2.status}: ${text.slice(0, 200)}`);
    }

    const order = await res2.json();
    res.status(201).json({ message: 'Order created', order });
  } catch (err) {
    console.error(`Order creation failed (${store}):`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
