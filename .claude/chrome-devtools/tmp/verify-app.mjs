import { getBrowser, getPage, disconnectBrowser, outputJSON } from '../../skills/chrome-devtools/scripts/lib/browser.js';

const OUT = '/Users/lenn/Documents/learn-chinese/.claude/chrome-devtools/screenshots';
const BASE = 'http://localhost:4173';

async function shot(page, path, file, { w, h }) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true });
  const rootText = await page.evaluate(() => document.getElementById('root')?.innerText?.slice(0, 120) || '');
  const cards = await page.evaluate(() => document.querySelectorAll('.lesson-list__item, .vocab-card, .mode-card').length);
  return { path, file, rootMounted: rootText.length > 0, sampleText: rootText, interactiveEls: cards };
}

async function run() {
  const browser = await getBrowser();
  const page = await getPage(browser);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  const results = [];
  results.push(await shot(page, '/', 'home-desktop.png', { w: 1280, h: 900 }));
  results.push(await shot(page, '/', 'home-mobile.png', { w: 390, h: 844 }));
  results.push(await shot(page, '/lesson/lesson-01-greetings', 'lesson-desktop.png', { w: 1280, h: 900 }));
  results.push(await shot(page, '/review/lesson-01-greetings', 'review-mobile.png', { w: 390, h: 844 }));

  outputJSON({ success: true, results, consoleErrors: errors });
  await disconnectBrowser();
}
run().catch((e) => { outputJSON({ success: false, error: e.message }); process.exit(1); });
