import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { HOSTILE, sampleEvent, sampleProjects } from './hq-fixture.mjs';
import { CRITERIA, MAX_TOTAL, filterPeople, judgeProgress, leaderboard, passFrom, people, signupsByDay, stats, threads, toCsv } from '../public/hq/model.js';
import { createApi, SESSION_KEY } from '../public/hq/api.js';
import { niceMax } from '../public/hq/charts.js';
import { sheetErrors, sheetTotal } from '../public/hq/views/score.js';
import { JUDGING } from '../public/src/data/event.js';
import { passUrl } from '../public/src/views/checkin.js';

const names = ['overview', 'people', 'teams', 'projects', 'judging', 'score', 'door', 'inbox', 'announcements', 'sponsors', 'crew', 'event'];
const views = Object.fromEntries(await Promise.all(names.map(async (name) => [name, (await import(`../public/hq/views/${name}.js`)).default])));
const now = Date.parse('2026-12-13T18:00:00+07:00');
const ui = () => ({ peopleFilter: 'all', peopleQuery: '', peopleTrack: '', projectFilter: 'submitted', revealed: null, door: { query: '', busy: false, card: null }, sheets: {}, replies: {} });
const ctx = { now: () => now, query: {} };
const organizer = (event = sampleEvent()) => ({ staff: { id: 's-org', name: 'Matt Sim', role: 'organizer' }, event, projects: null, loadedAt: now - 60000, problem: '', accountsOn: false, ui: ui() });
const judge = (projects = sampleProjects()) => ({ staff: { id: 's-keith', name: 'Keith Vaughan', role: 'judge' }, event: null, projects, loadedAt: now, problem: '', accountsOn: null, ui: ui() });
const crewMember = () => ({ staff: { id: 's-door', name: 'Door volunteer', role: 'crew' }, event: null, projects: null, loadedAt: 0, problem: '', accountsOn: null, ui: ui() });

test('people merge registrations, profiles, check-ins, teams and the waitlist into one row each', () => {
  const rows = people(sampleEvent());
  assert.equal(rows.length, 4, 'three builders, plus a waitlist entry sent without an account');
  const an = rows.find((row) => row.id === 'u-an');
  assert.equal(an.status, 'registered');
  assert.equal(an.waitlistId, 2, 'their waitlist entry joins them');
  assert.equal(an.team.name, 'Lantern');
  assert.equal(rows.find((row) => row.id === 'u-chi').status, 'unconfirmed', 'saved before the waitlist and pre-registration merged');
  assert.equal(rows.find((row) => row.id === 'u-chi').team, null, 'an invitation is not membership');
  assert.ok(rows.find((row) => row.id === 'u-binh').checkedInAt);
  assert.equal(rows.find((row) => row.key === 'w3').status, 'waitlist');
  assert.deepEqual(filterPeople(rows, { filter: 'in' }).map((row) => row.id), ['u-binh']);
  assert.deepEqual(filterPeople(rows, { filter: 'needs' }).map((row) => row.id).sort(), ['u-an', 'u-binh']);
  assert.deepEqual(filterPeople(rows, { query: 'dc-cccc' }).map((row) => row.id), ['u-chi'], 'search finds pass codes');
  assert.deepEqual(filterPeople(rows, { query: 'pytorch' }).map((row) => row.id), ['u-chi'], 'and skills');
  assert.deepEqual(filterPeople(rows, { track: 'ai' }).map((row) => row.key).sort(), ['u-binh', 'u-chi', 'w3']);
});

test('the overview counts agree with the lists', () => {
  const numbers = stats(sampleEvent());
  assert.deepEqual({ ...numbers }, { waitlist: 2, registered: 2, unconfirmed: 1, profiles: 3, checkedIn: 1, teams: 1, withoutTeam: 0, submitted: 2, drafts: 1, waiting: 1, newInquiries: 1, inquiries: 1, media: 1 });
  const days = signupsByDay(sampleEvent(), Date.parse('2026-11-05T12:00:00+07:00'), 7);
  assert.equal(days.length, 7);
  assert.equal(days.at(-1).date, '2026-11-05');
  assert.equal(days.at(-1).count, 1);
  assert.equal(days.reduce((sum, day) => sum + day.count, 0), 5, 'two waitlist entries and three registrations');
  assert.deepEqual([0, 1, 3, 7, 10, 12, 60].map(niceMax), [1, 1, 5, 10, 10, 20, 100]);
});

test('the organizer inbox puts conversations waiting for a reply first', () => {
  const list = threads(sampleEvent());
  assert.deepEqual(list.map((thread) => [thread.name, thread.waiting]), [['Binh Tran', true], ['An Nguyen', false]]);
});

test('the leaderboard ranks by the average of full scores, leaving conflicts out, and marks the finalists', () => {
  assert.deepEqual(CRITERIA.map((item) => item.label), JUDGING.rubric.map((item) => item.label), 'the criteria are the published ones');
  assert.equal(MAX_TOTAL, 100);
  const board = leaderboard(sampleEvent());
  assert.deepEqual(board.map((row) => [row.name, row.rank, row.average, row.judged, row.conflicts]), [['Tide', 1, 82, 1, 1], ['Lantern', 2, 81, 2, 0]]);
  assert.equal(board[1].criteria.prototype, 21);
  assert.ok(board.every((row) => row.finalist));
  const tie = sampleEvent();
  tie.scores = tie.scores.map((score) => (score.judge_id === 's-vinh' && score.submission_id === 'u-chi' ? { ...score, prototype: 20 } : score));
  assert.deepEqual(leaderboard(tie).map((row) => row.rank), [1, 1], 'equal averages share a rank');
  assert.deepEqual(judgeProgress(sampleEvent()).map((judge) => [judge.name, judge.scored, judge.conflicts, judge.of]), [['Keith Vaughan', 1, 1, 2], ['VC Vinh', 2, 0, 2]]);
});

test('a score sheet needs all four scores from 0 to 25, unless there is a conflict of interest', () => {
  const full = { prototype: 20, ux: 18, technical: 22, pitch: 19, notes: '', conflict: false };
  assert.deepEqual(sheetErrors(full), {});
  assert.equal(sheetTotal(full), 79);
  assert.deepEqual(Object.keys(sheetErrors({ ...full, ux: null, pitch: 26 })).sort(), ['pitch', 'ux']);
  assert.match(sheetErrors({ ...full, technical: 2.5 }).technical, /whole number/);
  assert.deepEqual(sheetErrors({ prototype: null, ux: null, technical: null, pitch: null, notes: '', conflict: true }), {});
  assert.equal(sheetTotal({ ...full, conflict: true }), null);
});

test('exports open cleanly in a spreadsheet and never run as formulas', () => {
  const csv = toCsv([{ a: '=HYPERLINK("http://x")', b: 'Nguyễn, "An"', c: ['Figma', 'UX'] }], [['A', (row) => row.a], ['B', (row) => row.b], ['C', (row) => row.c]]);
  assert.ok(csv.startsWith('﻿A,B,C\r\n'), 'a byte-order mark keeps Vietnamese names intact');
  assert.match(csv, /^﻿A,B,C\r\n"'=HYPERLINK\(""http:\/\/x""\)","Nguyễn, ""An""",Figma; UX\r\n$/);
});

test('a pass is read from the code, the QR link or an old DC001: pass', () => {
  assert.equal(passFrom(passUrl('DC-7KQ4-M2XP')), 'DC-7KQ4-M2XP');
  assert.equal(passUrl('DC-7KQ4-M2XP'), 'https://dragonconnector.com/app/hq/#/door/DC-7KQ4-M2XP');
  assert.equal(passFrom('DC001:DC-7KQ4-M2XP'), 'DC-7KQ4-M2XP');
  assert.equal(passFrom(' dc-7kq4-m2xp '), 'DC-7KQ4-M2XP');
  assert.equal(passFrom('hello'), null);
});

test('every HQ page renders for its roles, with and without data, and never renders what people type as markup', () => {
  const routes = [['overview'], ['people'], ['people', 'u-an'], ['people', 'w3'], ['people', 'missing'], ['teams'], ['projects'], ['judging'], ['door'], ['door', 'DC-AAAA-1111'], ['inbox'], ['inbox', 'c-1'], ['inbox', 'missing'], ['announcements'], ['announcements', '5'], ['sponsors'], ['crew'], ['event']];
  for (const event of [sampleEvent({ hostile: true }), sampleEvent(), null]) {
    for (const [name, ...params] of routes) {
      const state = organizer(event);
      state.ui.revealed = { name: HOSTILE, role: 'judge', code: 'HQ-ABCD-EFGH-JKLM-NPQR' };
      state.ui.door.card = { status: 'found', pass: 'DC-AAAA-1111', name: HOSTILE, registration: 'registered', checked_in_at: null, media_consent: false, access_needs: HOSTILE, team: HOSTILE, email: 'an@example.com', dietary: HOSTILE };
      assert.ok(views[name].roles.includes('organizer'), name);
      const out = String(views[name].render(state, params, ctx));
      assert.match(out, /<h1[ >]/, `${name}/${params.join('/')}`);
      assert.doesNotMatch(out, /<img src=x/, `${name}/${params.join('/')} escapes`);
    }
  }
  for (const projects of [sampleProjects({ hostile: true }), sampleProjects({ open: false }), null]) {
    for (const [name, ...params] of [['judging'], ['score', 'u-an'], ['score', 'u-chi'], ['score', 'missing']]) {
      const out = String(views[name].render(judge(projects), params, ctx));
      assert.match(out, /<h1[ >]/, `judge ${name}`);
      assert.doesNotMatch(out, /<img src=x/, `judge ${name} escapes`);
    }
  }
  assert.match(String(views.door.render(crewMember(), [], ctx)), /Check-in desk/);
  assert.deepEqual(names.filter((name) => views[name].roles.includes('crew')), ['door'], 'crew only reach the check-in desk');
  assert.deepEqual(names.filter((name) => views[name].roles.includes('judge')), ['judging', 'score'], 'judges only reach judging');
});

test('pages show what each role may see', () => {
  const sheet = String(views.score.render(judge(), ['u-chi'], ctx));
  assert.match(sheet, /name="conflict" checked/, 'a recorded conflict is shown');
  assert.match(String(views.score.render(judge(sampleProjects({ open: false })), ['u-an'], ctx)), /Judging is closed/);
  assert.match(String(views.judging.render(organizer(), [], ctx)), /Finalist/);
  const crewDoor = crewMember();
  crewDoor.ui.door.card = { status: 'found', pass: 'DC-AAAA-1111', name: 'An Nguyen', registration: 'registered', checked_in_at: null, media_consent: false, access_needs: null, team: 'Lantern', email: null, dietary: null };
  const desk = String(views.door.render(crewDoor, [], ctx));
  assert.match(desk, /Keep out of event media/);
  assert.match(desk, /data-action="check-in"/);
  assert.doesNotMatch(desk, /Undo check-in/, 'only organizers undo');
  assert.match(String(views.overview.render(organizer(), [], ctx)), /Builder accounts are switched off/);
  const people_ = String(views.people.render(organizer(), [], ctx));
  assert.match(people_, /Not confirmed/);
  assert.match(String(views.crew.render(organizer(), [], ctx)), /HQ-ABCD|Create their code/);
});

test('the HQ client calls each database function with its own arguments, and forgets an ended session', async () => {
  const sql = readdirSync(new URL('../supabase/migrations/', import.meta.url)).sort().map((file) => readFileSync(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8')).join('\n');
  const source = readFileSync(new URL('../public/hq/api.js', import.meta.url), 'utf8');
  const parameters = (name) => {
    const header = sql.match(new RegExp(`function public\\.${name}\\(([^)]*)\\)`));
    assert.ok(header, `${name} exists`);
    return header[1].split(',').map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
  };
  const calls = [...source.matchAll(/(call|withSession)\('(\w+)'(?:, \{([^}]*)\})?\)/g)];
  assert.ok(calls.length >= 20);
  for (const [, kind, name, args] of calls) {
    const keys = (args ?? '').split(',').map((part) => part.trim().split(':')[0].trim()).filter(Boolean);
    if (kind === 'withSession') keys.push('session');
    assert.deepEqual([...new Set(keys)].sort(), parameters(name).sort(), name);
  }

  const store = new Map();
  const storage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: (key) => store.delete(key) };
  const log = [];
  const replies = {
    hq_sign_in: ({ code }) => ({ data: code === 'HQ-GOOD' ? { status: 'signed-in', session: 'token-1', staff: { id: 's', name: 'Matt Sim', role: 'organizer' } } : { status: 'wrong-code' } }),
    hq_me: () => ({ error: { code: '28000', message: 'Your HQ session has ended. Sign in again with your access code.' } }),
  };
  const client = { rpc: async (name, args) => { log.push([name, args]); return replies[name]?.(args) ?? { data: null }; } };
  const api = createApi({ config: { url: 'https://example.supabase.co', anonKey: 'anon' }, loadClient: async () => () => client, storage, fetcher: async () => ({ ok: true, json: async () => ({ external: { anonymous_users: false } }) }) });
  assert.equal(await api.signIn('HQ-WRONG'), null);
  assert.equal(store.has(SESSION_KEY), false);
  assert.equal((await api.signIn('HQ-GOOD')).role, 'organizer');
  assert.equal(store.get(SESSION_KEY), 'token-1', 'the session is kept for next time');
  await api.score('p-1', { prototype: 20, ux: 18, technical: 22, pitch: 19 }, 'Good', false);
  assert.deepEqual(log.at(-1), ['hq_score', { session: 'token-1', project: 'p-1', prototype_points: 20, ux_points: 18, technical_points: 22, pitch_points: 19, judge_notes: 'Good', has_conflict: false }]);
  await assert.rejects(api.me(), (error) => error.ended && /Sign in again/.test(error.message));
  assert.equal(store.has(SESSION_KEY), false, 'an ended session is forgotten');
  assert.equal(await api.builderAccounts(), false);
});

test('HQ stays out of the offline app: never precached, always fetched fresh', () => {
  const precache = readFileSync(new URL('../public/precache.js', import.meta.url), 'utf8');
  assert.doesNotMatch(precache, /"hq\//);
  const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(worker, /if \(url\.pathname\.startsWith\(HQ\)\) return;/);
  assert.match(worker, /if \(await fromHq\(event\)\) return fetch\(request\);/);
  const page = readFileSync(new URL('../public/hq/index.html', import.meta.url), 'utf8');
  assert.match(page, /<meta name="robots" content="noindex,nofollow">/);
  assert.doesNotMatch(page, /<script>(?!<\/script>)/, 'no inline scripts: the security policy allows none');
});
