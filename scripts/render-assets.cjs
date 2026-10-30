// Render the PWA icons and install-dialog screenshots with Playwright and Chromium:
//   node scripts/render-assets.cjs
// Icons come from the brand SVGs; the screenshots come from the app itself, with a demo state.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const PUBLIC = path.join(__dirname, '..', 'public');
const ICONS = path.join(PUBLIC, 'icons');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };

function serve() {
  const server = http.createServer((request, response) => {
    const file = path.join(PUBLIC, decodeURIComponent(new URL(request.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const svg = (name) => fs.readFileSync(path.join(PUBLIC, 'brand', name), 'utf8');

// A full-bleed square with the emblem inside the central safe zone, for platforms that mask icons.
const bleed = (size) => `<html><body style="margin:0;background:#0B0B0B;width:${size}px;height:${size}px;display:grid;place-items:center">
  <div style="width:${Math.round(size * 0.66)}px">${svg('dragon-connector-emblem.svg').replace('<svg ', '<svg width="100%" ')}</div></body></html>`;

async function demoState() {
  const { initialState } = await import(pathToFileURL(path.join(PUBLIC, 'src/lib/store.js')));
  const { applyProgress } = await import(pathToFileURL(path.join(PUBLIC, 'src/lib/game.js')));
  const { seedThreads } = await import(pathToFileURL(path.join(PUBLIC, 'src/data/threads.js')));
  const at = Date.parse('2026-10-30T10:00:00+07:00');
  const state = initialState(at);
  Object.assign(state, {
    welcomed: true,
    tourDone: true,
    passCode: 'DC-7KQ4-M2XP',
    profile: { ...state.profile, name: 'Alex Tran', email: 'alex@example.com', role: 'mobile', skills: ['Kotlin', 'React Native', 'Mobile Wallet Adapter'], tracks: ['mobile'], lookingFor: 'team', languages: ['Vietnamese', 'English'], formats: ['A'] },
    waitlist: { name: 'Alex Tran', email: 'alex@example.com', role: 'mobile', track: 'mobile', joinedAt: at, sent: false },
    registration: { status: 'pre-registered', step: 0, data: { name: 'Alex Tran', email: 'alex@example.com', format: 'A', experience: 'some', conduct: true, media: 'yes', data: true }, updatedAt: at },
    guidesRead: ['first-steps'],
    visited: { home: true, team: true },
  });
  for (const thread of seedThreads()) state.threads[thread.id] = thread;
  applyProgress(state, at);
  return state;
}

(async () => {
  fs.mkdirSync(ICONS, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const icon = async (file, size, markup, transparent) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(markup);
    await page.screenshot({ path: path.join(ICONS, file), omitBackground: transparent });
    console.log(`wrote public/icons/${file}`);
  };
  const tile = (size) => `<html><body style="margin:0">${svg('dragon-connector-icon.svg').replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`;
  await icon('icon-192.png', 192, tile(192), true);
  await icon('icon-512.png', 512, tile(512), true);
  await icon('icon-maskable-512.png', 512, bleed(512), false);
  await icon('apple-touch-icon.png', 180, bleed(180), false);

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const state = JSON.stringify(await demoState());
  const shots = [
    { file: 'screenshot-narrow.png', viewport: { width: 390, height: 844 }, scale: 2, hash: '#/' },
    { file: 'screenshot-wide.png', viewport: { width: 1440, height: 900 }, scale: 1, hash: '#/team' },
  ];
  for (const shot of shots) {
    const context = await browser.newContext({ viewport: shot.viewport, deviceScaleFactor: shot.scale, serviceWorkers: 'block' });
    await context.addInitScript((saved) => { localStorage.setItem('dragonconnector:v1', saved); }, state);
    const view = await context.newPage();
    await view.goto(base + shot.hash);
    await view.waitForSelector('#view h1');
    await view.evaluate(() => document.fonts.ready);
    await view.waitForTimeout(400);
    await view.screenshot({ path: path.join(ICONS, shot.file) });
    console.log(`wrote public/icons/${shot.file}`);
    await context.close();
  }
  server.close();
  await browser.close();
})();
