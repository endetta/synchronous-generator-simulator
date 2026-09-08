// tools/screenshot.js
// Browser screenshots for Synchronous Generator Simulator
// Desktop-only layout, no mobile/tablet responsiveness.
//
// Usage:
//   node tools/screenshot.js                     -- semua views
//   node tools/screenshot.js --view phasor       -- single view
//   node tools/screenshot.js --check             -- regression check
//   node tools/screenshot.js --save <dir>        -- save ke directory

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Views: phasor, pdelta, timeseries, controls, status
const VIEWS = ['phasor', 'pdelta', 'timeseries', 'controls', 'status', 'demo'];
let VIEW_TARGET = null;
let CHECK_MODE = false;
let OUTPUT_DIR = path.join(__dirname, '../shots');

// Parse arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--view' && args[i + 1]) {
    VIEW_TARGET = args[i + 1];
    i++;
  } else if (arg === '--check') {
    CHECK_MODE = true;
  } else if (arg === '--save' && args[i + 1]) {
    OUTPUT_DIR = args[i + 1];
    i++;
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null, // kunci desktop 1920x1080 default
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Cache hasil screenshot untuk regression check
  const cacheFile = path.join(__dirname, 'shots-cache.json');
  let cache = {};
  if (fs.existsSync(cacheFile)) {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  }

  const results = [];
  const runCommands = [];

  // Build list views
  const viewsToRun = VIEW_TARGET ? [VIEW_TARGET] : VIEWS;

  for (const view of viewsToRun) {
    console.log(`\n📸 Screenshot mode: ${view}`);

    // Set state sesuai view
    if (view === 'phasor') {
      await page.goto(`server:8000`, { waitUntil: 'networkidle2' });
      await page.evaluate(() => {
        // Pastikan phasor SVG loaded
        const svg = document.getElementById('phasor-svg');
        if (svg) svg.getBoundingClientRect();
      });
      await page.waitForTimeout(500);
    } else if (view === 'pdelta') {
      await page.goto(`server:8000`, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(500);
    } else if (view === 'timeseries') {
      await page.goto(`server:8000`, { waitUntil: 'networkidle2' });
      await page.waitforSelector('#timeseries-canvas');
      // Jalankan simulasi sedikit agar ada data
      await page.evaluate(() => {
        const btnStart = document.getElementById('btn-start');
        if (btnStart) btnStart.click();
      });
      await page.waitForTimeout(3000);
    } else if (view === 'controls') {
      await page.goto(`server:8000`, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(500);
    } else if (view === 'status') {
      await page.goto(`server:8000`, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(500);
    } else if (view === 'demo') {
      await page.goto(`server:8000`, { waitUntil: 'networkidle2' });
      // Jalankan simulasi lengkap
      await page.evaluate(async () => {
        const btnStart = document.getElementById('btn-start');
        if (btnStart) btnStart.click();
        await new Promise(r => setTimeout(r, 8000)); // 8 detik simulasi
        const btnStop = document.getElementById('btn-stop');
        if (btnStop) btnStop.click();
      });
      await page.waitForTimeout(500);
    }

    const screenshotPath = path.join(OUTPUT_DIR, `${view}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const reportPath = path.join(OUTPUT_DIR, `${view}.txt`);
    const report = await page.evaluate(() => {
      return {
        phasor: document.querySelector('#phasor-svg') ? 'loaded' : 'missing',
        pdelta: document.querySelector('#pdelta-svg') ? 'loaded' : 'missing',
        timeSeries: document.querySelector('#timeseries-canvas') ? 'loaded' : 'missing',
        controls: !!document.getElementById('controls-panel'),
        status: !!document.getElementById('status-panel'),
        delta: document.getElementById('status-delta')?.textContent || '?',
        omega: document.getElementById('status-omega')?.textContent || '?',
      };
    });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    results.push({ view, path: screenshotPath, report });

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const prevCache = cache[view] || null;
    const currentHash = `SHA256:${Buffer.from(fs.readFileSync(screenshotPath)).toString('base64').slice(0, 32)}`;
    const changed = currentHash !== prevCache;

    if (CHECK_MODE) {
      if (changed) {
        console.log(`  ⚠️  REGRESSION DETECTED: ${view} changed`);
        cache[view] = currentHash;
        fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
      } else {
        console.log(`  ✓  No change: ${view}`);
      }
    }
  }

  await browser.close();

  console.log('\n--- Survey ---');
  console.log(results.map(r => `${r.view}: ${r.path}`).join('\n'));

  if (!CHECK_MODE) {
    console.log(`\n💾 Saved ke: ${OUTPUT_DIR}`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});