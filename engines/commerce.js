const express = require('express');
const axios = require('axios');
const router = express.Router();

// Site configurations (loaded from environment variables)
const sites = {
  uk: {
    url: process.env.WC_UK_URL,
    key: process.env.WC_UK_KEY,
    secret: process.env.WC_UK_SECRET,
    name: 'co.uk'
  },
  com: {
    url: process.env.WC_COM_URL,
    key: process.env.WC_COM_KEY,
    secret: process.env.WC_COM_SECRET,
    name: 'com'
  },
  net: {
    url: process.env.WC_NET_URL,
    key: process.env.WC_NET_KEY,
    secret: process.env.WC_NET_SECRET,
    name: 'net'
  }
};

// ---------- Helpers ----------
async function fetchProducts(siteKey, params = {}) {
  const site = sites[siteKey];
  if (!site) throw new Error(`Unknown site: ${siteKey}`);
  const auth = Buffer.from(`${site.key}:${site.secret}`).toString('base64');
  const response = await axios.get(`${site.url}/products`, {
    params,
    headers: { Authorization: `Basic ${auth}` }
  });
  return response.data;
}

async function createOrder(siteKey, orderData) {
  const site = sites[siteKey];
  if (!site) throw new Error(`Unknown site: ${siteKey}`);
  const auth = Buffer.from(`${site.key}:${site.secret}`).toString('base64');
  const response = await axios.post(`${site.url}/orders`, orderData, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

async function fetchOrders(siteKey, params = {}) {
  const site = sites[siteKey];
  if (!site) throw new Error(`Unknown site: ${siteKey}`);
  const auth = Buffer.from(`${site.key}:${site.secret}`).toString('base64');
  const response = await axios.get(`${site.url}/orders`, {
    params,
    headers: { Authorization: `Basic ${auth}` }
  });
  return response.data;
}

// ---------- Routes ----------
router.get('/sites', (req, res) => {
  res.json({ sites: Object.keys(sites) });
});

// Unified product catalog (with optional site filter)
router.get('/products', async (req, res) => {
  const { site, ...params } = req.query;
  try {
    if (site && sites[site]) {
      const products = await fetchProducts(site, params);
      return res.json({ site: sites[site].name, products });
    } else if (site && !sites[site]) {
      return res.status(400).json({ error: `Invalid site: ${site}` });
    } else {
      const results = {};
      for (const [key, config] of Object.entries(sites)) {
        try {
          results[key] = await fetchProducts(key, params);
        } catch (err) {
          results[key] = { error: err.message };
        }
      }
      return res.json(results);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Products from a specific site
router.get('/products/:site', async (req, res) => {
  const { site } = req.params;
  const { ...params } = req.query;
  if (!sites[site]) {
    return res.status(404).json({ error: 'Site not found' });
  }
  try {
    const products = await fetchProducts(site, params);
    res.json({ site: sites[site].name, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create an order on a specific site
router.post('/order/:site', async (req, res) => {
  const { site } = req.params;
  if (!sites[site]) {
    return res.status(404).json({ error: 'Site not found' });
  }

  const orderData = req.body;
  if (!orderData.line_items || !Array.isArray(orderData.line_items) || orderData.line_items.length === 0) {
    return res.status(400).json({ error: 'Missing line_items in order data' });
  }

  try {
    const result = await createOrder(site, orderData);
    res.status(201).json({ message: 'Order created', order: result });
  } catch (err) {
    console.error(`Order creation error (${site}):`, err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || err.message });
  }
});

// Dashboard: aggregated sales data from all sites
router.get('/dashboard', async (req, res) => {
  try {
    const allOrders = [];
    let totalRevenue = 0;
    let totalOrders = 0;

    // Fetch recent orders from each site (limit to 50 per store)
    for (const [siteKey, config] of Object.entries(sites)) {
      try {
        const orders = await fetchOrders(siteKey, { per_page: 50, orderby: 'date', order: 'desc' });
        allOrders.push(...orders.map(o => ({ ...o, site: config.name })));
        totalOrders += orders.length;
        totalRevenue += orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
      } catch (err) {
        console.error(`Error fetching orders from ${siteKey}:`, err.message);
        // continue with other sites
      }
    }

    // Sort combined orders by date descending (newest first)
    allOrders.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));

    // Return dashboard data
    res.json({
      total_orders: totalOrders,
      total_revenue: totalRevenue.toFixed(2),
      recent_orders: allOrders.slice(0, 20).map(o => ({
        id: o.id,
        site: o.site,
        date: o.date_created,
        total: o.total,
        status: o.status,
        customer: `${o.billing?.first_name} ${o.billing?.last_name}`.trim() || 'Guest'
      })),
      per_site: Object.fromEntries(
        Object.keys(sites).map(siteKey => {
          const siteOrders = allOrders.filter(o => o.site === sites[siteKey].name);
          const siteRevenue = siteOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
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