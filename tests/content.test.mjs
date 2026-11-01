import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { EXAMPLE_SPONSORS, FAQS, FORMATS, GATES, INTEGRATIONS, JUDGING, PACKAGES, PRIZES, SPONSORS, TRACKS } from '../public/src/data/event.js';
import { DOCS, GUIDES, MAP_ZONES, REQUIREMENTS } from '../public/src/data/content.js';
import { ROLES, SAMPLE_PROFILES } from '../public/src/data/people.js';
import { QUESTS } from '../public/src/lib/game.js';
import { toMinutes } from '../public/src/lib/time.js';

const root = new URL('../public/', import.meta.url);
const sources = (dir = 'src') => readdirSync(new URL(`${dir}/`, root), { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? sources(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]));
const appText = [...sources().filter((file) => file.endsWith('.js') && !file.includes('vendor/')), 'index.html', 'manifest.webmanifest'].map((file) => readFileSync(new URL(file, root), 'utf8')).join('\n');
const ROUTE_NAMES = ['', 'home', 'waitlist', 'register', 'profile', 'checkin', 'team', 'inbox', 'submit', 'quests', 'schedule', 'guides', 'docs', 'requirements', 'map', 'prizes', 'sponsors', 'settings', 'more'];

test('the schedules match the proposal: ordered sessions and 405 / 795 build minutes', () => {
  for (const format of Object.values(FORMATS)) {
    assert.deepEqual(format.days.map((day) => day.date), format.dates);
    let build = 0;
    for (const day of format.days) {
      let last = 0;
      for (const session of day.sessions) {
        assert.ok(toMinutes(session.start) >= last, `${session.id} starts before the previous session ends`);
        assert.ok(toMinutes(session.end) > toMinutes(session.start), session.id);
        if (session.type === 'build') build += toMinutes(session.end) - toMinutes(session.start);
        last = toMinutes(session.end);
      }
    }
    assert.equal(build, format.buildMinutes, format.id);
  }
  assert.equal(FORMATS.A.buildMinutes, 405);
  assert.equal(FORMATS.B.buildMinutes, 795);
  const ids = Object.values(FORMATS).flatMap((format) => format.days.flatMap((day) => day.sessions.map((session) => session.id)));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(FORMATS.A.dateLabel, 'Sunday 13 December 2026');
  assert.equal(new Date('2026-12-13T12:00:00+07:00').getUTCDay(), 0, '13 December 2026 is a Sunday');
});

test('prizes, judging and tracks match the proposal, and nothing claims money that is not there', () => {
  assert.deepEqual(PRIZES.scenarios.map((scenario) => scenario.usd), [800, 1500, 3000]);
  assert.equal(PRIZES.cashReceivedUsd, 0);
  assert.equal(JUDGING.rubric.reduce((sum, item) => sum + item.points, 0), 100);
  assert.equal(JUDGING.slot.reduce((sum, part) => sum + part.minutes, 0), JUDGING.slotMinutes);
  assert.equal(JUDGING.finalists, 10);
  assert.deepEqual(TRACKS.map((track) => track.id), ['mobile', 'ai', 'university']);
  assert.ok(PRIZES.notes.some((note) => /not funded/.test(note)));
});

test('the app names no sponsor or prospect, never says "apply now", and keeps registration closed', () => {
  assert.deepEqual(SPONSORS, [], 'only organizations that agreed in writing belong here');
  const prospects = ['Solana Foundation', 'Superteam', 'STVN', 'Touching Grass', 'MagicBlock', 'Solami', 'Cursor', 'xAI', 'GrokBot', 'Team1', 'AI Tinkerers', 'DISSC', 'DSUC', 'DUT', 'OpenAI', 'Anthropic', 'Exa AI', 'Lovable', 'Swinburne University Vietnam is a sponsor'];
  for (const name of prospects) assert.doesNotMatch(appText, new RegExp(`\\b${name}\\b`), name);
  assert.doesNotMatch(appText, /apply now/i);
  assert.equal(GATES.registration.open, false);
  assert.equal(INTEGRATIONS.registrationUrl, null);
  // The five suggested packages each have one place on the Sponsors page.
  assert.deepEqual(PACKAGES.map((pack) => pack.id), ['presenting', 'track', 'challenge', 'in-kind', 'community']);
  for (const pack of PACKAGES) assert.ok(pack.name && pack.contribution && pack.placement && pack.funds.length, pack.id);
  // Preview mode's placeholder brands are plainly placeholders, and every package has at least one.
  for (const example of EXAMPLE_SPONSORS) assert.match(example.name, /^Your /);
  for (const pack of PACKAGES) assert.ok(EXAMPLE_SPONSORS.some((example) => example.package === pack.id), pack.id);
  assert.ok(FAQS.some((faq) => /not confirmed|It is a proposal/.test(faq.a)));
});

test('live services use the public key of one Supabase project, and the security policy allows only that project', () => {
  const { url, anonKey, region } = INTEGRATIONS.supabase;
  const { protocol, hostname, pathname } = new URL(url);
  assert.equal(protocol, 'https:');
  assert.equal(pathname, '/');
  assert.match(hostname, /^[a-z]{20}\.supabase\.co$/);
  assert.ok(region);
  // The key ships to every browser, so it must be the public anon role. Never a service_role or secret key.
  for (const [token] of appText.matchAll(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g)) {
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    assert.equal(claims.role, 'anon', 'only the anon key may appear in the app');
    assert.equal(claims.ref, hostname.split('.')[0]);
  }
  assert.ok(appText.includes(anonKey));
  assert.doesNotMatch(appText, /sb_secret_/);
  const headers = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).headers[0].headers;
  const csp = headers.find((header) => header.key === 'Content-Security-Policy').value.split(';').map((part) => part.trim().split(/\s+/));
  const directive = (name) => csp.find(([key]) => key === name)?.slice(1);
  assert.deepEqual(directive('connect-src'), ["'self'", `https://${hostname}`, `wss://${hostname}`]);
  assert.deepEqual(directive('script-src'), ["'self'"]);
});

test('sample profiles are labelled, complete and use known roles and tracks', () => {
  assert.equal(new Set(SAMPLE_PROFILES.map((profile) => profile.id)).size, SAMPLE_PROFILES.length);
  for (const profile of SAMPLE_PROFILES) {
    assert.equal(profile.sample, true, profile.id);
    assert.ok(ROLES.some((role) => role.id === profile.role), profile.id);
    assert.ok(profile.tracks.every((id) => TRACKS.some((track) => track.id === id)), profile.id);
    assert.ok(profile.skills.length >= 3 && profile.bio.length > 20, profile.id);
  }
});

test('guides, docs, requirements and map zones are well formed', () => {
  for (const list of [GUIDES, DOCS]) assert.equal(new Set(list.map((item) => item.slug)).size, list.length);
  const requirementIds = REQUIREMENTS.flatMap((group) => group.items.map((item) => item.id));
  assert.equal(new Set(requirementIds).size, requirementIds.length);
  for (const zone of MAP_ZONES) assert.ok(zone.x >= 0 && zone.y >= 0 && zone.x + zone.w <= 800 && zone.y + zone.h <= 400, zone.id);
  for (const [i, a] of MAP_ZONES.entries()) for (const b of MAP_ZONES.slice(i + 1)) {
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `${a.id} overlaps ${b.id}`);
  }
  const external = [...appText.matchAll(/https?:\/\/[^\s'"`)<]+/g)].map(([url]) => url);
  for (const url of external) assert.ok(url.startsWith('https://'), url);
});

test('every in-app link and quest route leads somewhere real', () => {
  const targets = [
    ...[...appText.matchAll(/href="#\/([^"$]*)"/g)].map(([, path]) => path),
    ...[...appText.matchAll(/route: '([^']+)'/g)].map(([, path]) => path),
    ...QUESTS.map((quest) => quest.route),
  ];
  assert.ok(targets.length > 40);
  for (const target of targets) {
    const [name, slug] = target.split('/');
    assert.ok(ROUTE_NAMES.includes(name), `unknown route: ${target}`);
    if (slug && name === 'guides') assert.ok(GUIDES.some((guide) => guide.slug === slug), target);
    if (slug && name === 'docs') assert.ok(DOCS.some((doc) => doc.slug === slug), target);
    if (slug && name === 'inbox') assert.ok(['guide', 'announcements', 'team'].includes(slug), target);
  }
});
