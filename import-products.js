/**
 * Copper Glow Shop — Product Page Generator
 * Reads the supplier CSV and generates HTML product pages
 * via your dropship automation engine.
 *
 * Usage:
 *   node import-products.js
 *
 * Make sure your dropship engine is running first:
 *   node server.js   (in your robreidrecordings-blip folder)
 */

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const CSV_FILE   = 'portfolio_data_feed_382036-awd_20260516.csv'; // put CSV in same folder
const ENGINE_URL = 'http://localhost:3000/job';                    // your local dropship engine
const DELAY_MS   = 200;                                            // pause between jobs (ms)

// ── Simple CSV parser (handles quoted fields with commas inside) ───────────────
function parseCSV(text) {
  const lines   = text.split(/\r?\n/).filter(Boolean);
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row    = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] || '').trim(); });
    return row;
  });
}

function splitCSVLine(line) {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

// ── Post one product job to the engine ────────────────────────────────────────
async function postJob(product) {
  const body = JSON.stringify({ product });
  const res  = await fetch(ENGINE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  if (!res.ok) throw new Error(`Engine returned ${res.status}`);
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Read CSV
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌  CSV file not found: ${CSV_FILE}`);
    console.error(`    Put the CSV in the same folder as this script.`);
    process.exit(1);
  }

  const raw      = fs.readFileSync(CSV_FILE, 'utf8');
  const rows     = parseCSV(raw);
  const active   = rows.filter(r => r['Status'] === 'Active' && r['Unit Name']);

  console.log(`📦  Found ${rows.length} total products`);
  console.log(`✅  ${active.length} active products to import`);
  console.log(`🚀  Sending to engine at ${ENGINE_URL}\n`);

  let done = 0, failed = 0;

  for (const row of active) {
    // Pick first image URL from comma-separated list
    const firstImage = (row['Images'] || '').split(',')[0].trim();

    const product = {
      code:        row['Product code'],
      title:       row['Unit Name'],
      description: row['Webpage description (plain text)'] || row['Unit Name'],
      price:       `£${parseFloat(row['Unit price'] || row['Price'] || 0).toFixed(2)}`,
      rrp:         `£${parseFloat(row['Unit RRP'] || 0).toFixed(2)}`,
      category:    row['Department'],
      subcategory: row['Subdepartment'],
      image:       firstImage,
      stock:       row['Available Quantity'] || row['Stock'],
      barcode:     row['Barcode']
    };

    try {
      const result = await postJob(product);
      done++;
      process.stdout.write(`\r✅  ${done} done, ${failed} failed — last: ${product.code}    `);
    } catch (err) {
      failed++;
      console.error(`\n❌  Failed: ${product.code} — ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\n🎉  Import complete!`);
  console.log(`    ✅ ${done} pages generated`);
  console.log(`    ❌ ${failed} failed`);
  console.log(`\n    Open http://localhost:3000 to see your products!`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
