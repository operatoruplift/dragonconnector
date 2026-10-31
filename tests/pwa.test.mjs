import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { precacheSource } from '../scripts/build-precache.mjs';
import { qrSvg } from '../public/src/views/checkin.js';

const file = (path) => new URL(`../public/${path}`, import.meta.url);
const read = (path) => readFileSync(file(path), 'utf8');
const pngSize = (path) => {
  const data = readFileSync(file(path));
  assert.equal(data.toString('hex', 0, 8), '89504e470d0a1a0a', `${path} is not a PNG`);
  return `${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`;
};

test('the manifest makes the app installable, with icons and screenshots that exist at their stated sizes', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './#/');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.background_color, '#0B0B0B');
  assert.equal(manifest.theme_color, '#0B0B0B');
  assert.ok(manifest.name && manifest.short_name && manifest.id);
  for (const icon of manifest.icons) {
    assert.ok(existsSync(file(icon.src)), icon.src);
    if (icon.type === 'image/png') assert.equal(pngSize(icon.src), icon.sizes, icon.src);
  }
  for (const size of ['192x192', '512x512']) assert.ok(manifest.icons.some((icon) => icon.sizes === size && icon.purpose === 'any'), size);
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'));
  for (const shot of manifest.screenshots) assert.equal(pngSize(shot.src), shot.sizes, shot.src);
  assert.deepEqual(manifest.screenshots.map((shot) => shot.form_factor).sort(), ['narrow', 'wide']);
  assert.equal(pngSize('icons/apple-touch-icon.png'), '180x180');
});

test('the page links the manifest, the touch icon and the module entry point', () => {
  const html = read('index.html');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<meta name="theme-color" content="#0B0B0B">/);
  assert.match(html, /viewport-fit=cover/);
  for (const [, path] of html.matchAll(/(?:href|src)="((?!https?:|#)[^"]+)"/g)) assert.ok(existsSync(file(path)), path);
  const css = read('styles/app.css');
  for (const [, path] of css.matchAll(/url\('\.\.\/([^']+)'\)/g)) assert.ok(existsSync(file(path)), path);
});

test('the service worker caches every app file, and its list is up to date', () => {
  assert.equal(read('precache.js'), precacheSource(), 'run node scripts/build-precache.mjs');
  const files = JSON.parse(read('precache.js').replace(/^[\s\S]*?self\.PRECACHE = /, '').replace(/;\s*$/, '')).files;
  for (const path of files.filter((path) => path !== './')) assert.ok(existsSync(file(path)), path);
  for (const needed of ['index.html', 'manifest.webmanifest', 'src/main.js', 'styles/app.css', 'src/vendor/qrcode.mjs', 'icons/icon-192.png', 'fonts/oxanium-latin-800-normal.woff2']) assert.ok(files.includes(needed), needed);
  assert.match(read('sw.js'), /importScripts\('precache\.js'\)/);
});

test('the vendored Supabase client is the published 2.118.0 build, loaded only after the app starts', () => {
  assert.equal(createHash('sha256').update(readFileSync(file('src/vendor/supabase.js'))).digest('hex'), 'ee3be8de192b97cb1d73d1e95d6b82bb1f6b658c0f97c4ef757fc331996ed3d3');
  assert.match(read('src/vendor/LICENSE-supabase-js.txt'), /^MIT License/);
  assert.doesNotMatch(read('index.html'), /supabase/, 'the first render never waits for it');
  assert.match(read('src/main.js'), /script\.src = 'src\/vendor\/supabase\.js'/);
  assert.ok(read('precache.js').includes('"src/vendor/supabase.js"'), 'cached for offline use');
});

test('the vendored QR library is the published file and draws a square code with a quiet zone', () => {
  assert.equal(createHash('sha256').update(readFileSync(file('src/vendor/qrcode.mjs'))).digest('hex'), 'ea91d7118a5395289170da848b7c6758b996163bfbccf312591ab65a4911b7c0');
  const svg = String(qrSvg('DC001:DC-7KQ4-M2XP'));
  const [, size] = svg.match(/viewBox="0 0 (\d+) \1"/);
  assert.equal(Number(size), 25 + 8, 'version 2 (25 modules) plus a 4-module quiet zone on each side');
  assert.equal(svg, String(qrSvg('DC001:DC-7KQ4-M2XP')), 'deterministic');
});
