const NETWORK_PROFILES = {
  'standard': null, // Nessuna simulazione
  '4g': {
    offline: false,
    latency: 40,
    downloadThroughput: 4 * 1024 * 1024 / 8, // 4 Mbps
    uploadThroughput: 3 * 1024 * 1024 / 8    // 3 Mbps
  },
  'fast-3g': {
    offline: false,
    latency: 150,
    downloadThroughput: 1.6 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8
  },
  'slow-3g': {
    offline: false,
    latency: 400,
    downloadThroughput: 400 * 1024 / 8,
    uploadThroughput: 400 * 1024 / 8
  }
};

const puppeteer = require('puppeteer');
const { pageInteractor } = require('./pageInteractor');
const fs = require('fs');

function deleteDuplicates(arr) {
  const map = {};
  for (const v of arr) {
    map[v.name] = v; // tiene l'ultima metrica per ogni nome
  }
  return Object.values(map);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Esegue una sessione di benchmark UI su una pagina e salva i risultati.
 * @param {string} url
 * @param {string} outFile
 * @param {string} networkProfile
 * @param {number} interactionCount
 * @param {number} delayMs
 * @param {number} timeoutMs
 */
async function runBenchmark(url, outFile, networkProfile, interactionCount = 50, delayMs = 0, timeoutMs = 30000) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox',
        '--disable-cache',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-default-apps',
        '--no-first-run',
        '--no-zygote',],
    });

    const page = await browser.newPage();

    const profile = NETWORK_PROFILES[networkProfile];
    if (profile) {
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', profile);
    }

    await page.goto(url, { waitUntil: 'networkidle0' });

    // Esegui le interazioni simulate
    const actualInteractions = await pageInteractor(page, interactionCount, delayMs, timeoutMs);

    // Simula il passaggio in background (visibilità hidden)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        get: () => 'hidden',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    let vitals = await page.evaluate(() => window.__vitalsResults || []);
    vitals = deleteDuplicates(vitals);

    const chromeMetrics = await page.metrics();

    const result = {
      url,
      networkProfile,
      timestamp: new Date().toISOString(),
      vitals,
      chromeMetrics,
      interactionCount: actualInteractions,
      delayMs,
      timeoutMs,
    };

    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
    console.log(`Risultati salvati in ${outFile}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (browser) await browser.close();
  }
}

// Script CLI
if (require.main === module) {
  const url = process.argv[2] || 'http://localhost:3000';
  const outFile = process.argv[3] || 'web-performance.json';
  const networkProfile = process.argv[4] || 'standard';
  const interactionCount = Number(process.argv[5]) || 50;
  const delayMs = Number(process.argv[6]) || 0;
  const timeoutMs = Number(process.argv[7]) || 30000;

  runBenchmark(url, outFile, networkProfile, interactionCount, delayMs, timeoutMs);
}

module.exports = { runBenchmark };
