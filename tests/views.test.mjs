import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../public/src/lib/store.js';
import { applyProgress } from '../public/src/lib/game.js';
import { checkInOpen, submissionsOpen } from '../public/src/lib/gates.js';
import { seedThreads } from '../public/src/data/threads.js';
import { GUIDES, DOCS } from '../public/src/data/content.js';
import { SAMPLE_PROFILES } from '../public/src/data/people.js';

const views = Object.fromEntries(await Promise.all(['home', 'waitlist', 'register', 'profile', 'checkin', 'team', 'inbox', 'submit', 'quests', 'schedule', 'guides', 'docs', 'requirements', 'map', 'prizes', 'sponsors', 'settings', 'more']
  .map(async (name) => [name, (await import(`../public/src/views/${name}.js`)).default])));

const before = Date.parse('2026-10-30T10:00:00+07:00');
// The event runs on Saturday 12 and Sunday 13 December 2026, Vietnam time.
const eventDay = Date.parse('2026-12-12T10:00:00+07:00');
const sunday = Date.parse('2026-12-13T10:00:00+07:00');
const after = Date.parse('2026-12-14T10:00:00+07:00');
const ctx = (now) => ({ now: () => now, canInstall: () => false, isIos: () => false });
const HOSTILE = '<img src=x onerror=alert(1)>';

function fresh() {
  const state = initialState(before);
  for (const thread of seedThreads()) state.threads[thread.id] = thread;
  state.passCode = 'DC-7KQ4-M2XP';
  return state;
}

function busy() {
  const state = fresh();
  state.profile = { ...state.profile, name: HOSTILE, role: 'mobile', skills: [HOSTILE, 'Kotlin', 'Rust'], tracks: ['mobile'], lookingFor: 'cofounder', languages: ['English'], formats: ['A'], bio: HOSTILE, github: 'https://github.com/x' };
  state.waitlist = { name: HOSTILE, email: 'a@b.co', role: 'mobile', track: 'mobile', joinedAt: before, sent: false };
  state.registration = { status: 'pre-registered', step: 0, data: { name: HOSTILE, email: 'a@b.co', format: 'A', experience: 'some', media: 'no', conduct: true, data: true, dietary: HOSTILE }, updatedAt: before };
  state.team = { name: HOSTILE, track: 'mobile', openRoles: ['design'], invites: ['aiko'], createdAt: before };
  state.threads.team = { id: 'team', kind: 'team', title: `Team ${HOSTILE}`, unread: 0, messages: [{ id: 'x', from: 'me', at: before, text: HOSTILE }] };
  state.threads['dm-linh'] = { id: 'dm-linh', kind: 'dm', with: 'linh', title: 'Linh N.', unread: 0, messages: [{ id: 'y', from: 'me', at: before, text: HOSTILE }], draft: HOSTILE };
  state.submission = { status: 'submitted', data: { name: HOSTILE, tagline: HOSTILE, track: 'mobile', description: HOSTILE, stack: [HOSTILE], repo: 'https://github.com/x/y', video: '', live: '', checks: [] }, updatedAt: before, submittedAt: before };
  state.tasks = [{ id: '1', text: HOSTILE, done: true }];
  state.checkIn = { at: eventDay, method: 'code', preview: false };
  state.bookmarks = ['A1-0830', 'A1-1745', 'A2-1645'];
  state.guidesRead = GUIDES.map((guide) => guide.slug);
  applyProgress(state, before);
  return state;
}

const pages = [
  ['home'], ['waitlist'], ['waitlist', 'edit'], ['register'], ['register', 'edit'], ['profile'], ['checkin'], ['team'], ['team', 'linh'], ['team', 'nobody'],
  ['inbox'], ['inbox', 'guide'], ['inbox', 'announcements'], ['inbox', 'dm-linh'], ['inbox', 'team'], ['inbox', 'missing'], ['submit'], ['submit', 'edit'], ['quests'], ['schedule'],
  ['guides'], ...GUIDES.map((guide) => ['guides', guide.slug]), ['docs'], ...DOCS.map((doc) => ['docs', doc.slug]), ['requirements'], ['map'], ['prizes'], ['sponsors'], ['settings'], ['more'],
];

test('every screen renders for a new and a busy builder, before, during and after the event', () => {
  for (const make of [fresh, busy]) {
    for (const now of [before, eventDay, sunday, after]) {
      for (const [name, ...params] of pages) {
        const state = make();
        const out = String(views[name].render(state, params, ctx(now)));
        assert.match(out, /<h1[ >]/, `${name}/${params.join('/')} has a heading`);
        assert.ok(views[name].title(state, params), `${name} has a title`);
      }
    }
  }
});

test('nothing a builder types is rendered as markup', () => {
  const state = busy();
  for (const [name, ...params] of pages) {
    const out = String(views[name].render(state, params, ctx(eventDay)));
    assert.doesNotMatch(out, /<img src=x/, `${name}/${params.join('/')}`);
  }
  const team = String(views.team.render(state, [], ctx(before)));
  assert.match(team, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('while registration is closed, no screen says it is open or asks people to apply', () => {
  for (const make of [fresh, busy]) {
    for (const [name, ...params] of pages) {
      const out = String(views[name].render(make(), params, ctx(before)));
      assert.doesNotMatch(out, /registration is open|apply now/i, `${name}/${params.join('/')}`);
    }
  }
});

test('gated steps stay closed before the event unless preview mode is on', () => {
  const state = fresh();
  assert.equal(checkInOpen(state, before), false);
  assert.equal(submissionsOpen(state, before), false);
  assert.equal(checkInOpen(state, eventDay), true, 'check-in opens on Saturday');
  assert.equal(checkInOpen(state, sunday), true, 'and stays open on Sunday');
  assert.equal(submissionsOpen(state, eventDay), false, 'final submission opens on Sunday, not Saturday');
  assert.equal(submissionsOpen(state, sunday), true);
  assert.equal(checkInOpen(state, after), false);
  assert.equal(submissionsOpen(state, after), false);
  const checkin = String(views.checkin.render(state, [], ctx(before)));
  assert.match(checkin, /<button class="btn primary" type="submit" disabled>/);
  state.preview = true;
  assert.equal(checkInOpen(state, before), true);
  assert.match(String(views.checkin.render(state, [], ctx(before))), /Preview mode: use DRAGON-001/);
  const register = String(views.register.render(fresh(), [], ctx(before)));
  assert.match(register, /Registration is not open yet/);
  assert.match(register, /href="#\/waitlist"/);
  assert.doesNotMatch(register, /data-form="step"|Complete registration/, 'no form until registration opens');
});

test('getting in is one step: the waitlist until registration opens, then registration', () => {
  const journey = (state) => String(views.home.render(state, [], ctx(before))).match(/<ol class="journey">[\s\S]*?<\/ol>/)[0];
  const more = (state) => String(views.more.render(state, [], ctx(before)));
  const closed = fresh();
  assert.match(journey(closed), /Join the waitlist/);
  assert.doesNotMatch(journey(closed), /href="#\/register"|Pre-register/);
  assert.match(more(closed), /href="#\/waitlist"/);
  assert.doesNotMatch(more(closed), /href="#\/register"/);

  const open = fresh();
  open.eventSettings = { registrationOpen: true, checkInOpen: false, submissionsOpen: false };
  assert.match(journey(open), /href="#\/register"/);
  assert.doesNotMatch(journey(open), /Join the waitlist/);
  assert.match(more(open), /href="#\/register"/);
  assert.match(String(views.waitlist.render(open, [], ctx(before))), /Register instead/, 'new builders skip the waitlist once registration is open');
  assert.match(String(views.register.render(open, [], ctx(before))), /data-form="step"/);

  // The form starts from the waitlist entry.
  const waiting = fresh();
  waiting.eventSettings = open.eventSettings;
  waiting.waitlist = { name: 'An Nguyen', email: 'an@example.com', role: 'design', track: 'mobile', joinedAt: before, sent: true };
  const form = String(views.register.render(waiting, [], ctx(before)));
  assert.match(form, /value="An Nguyen"/);
  assert.match(form, /value="an@example\.com"/);
  for (const page of ['home', 'waitlist', 'register', 'more', 'checkin']) assert.doesNotMatch(String(views[page].render(waiting, [], ctx(before))), /pre-?regist/i, page);
});

test('a registration made in preview mode stays on the device until registration opens and it is confirmed', async () => {
  const { registrationPayload } = await import('../public/src/lib/backend.js');
  const state = fresh();
  state.preview = true;
  const form = String(views.register.render(state, [], ctx(before)));
  assert.match(form, /Registration has not opened yet, so this form stays on this device/);
  state.registration = { status: 'registered', preview: true, step: 0, data: { name: 'An', email: 'an@example.com', format: 'A', experience: 'some', media: 'no', conduct: true, data: true }, updatedAt: before };
  assert.equal(registrationPayload(state, 'u-1'), null, 'not sent');
  assert.match(String(views.register.render(state, [], ctx(before))), /Preview registration/);
  state.eventSettings = { registrationOpen: true, checkInOpen: false, submissionsOpen: false };
  assert.match(String(views.register.render(state, [], ctx(before))), /data-action="confirm"/);
  state.registration.preview = false;
  assert.equal(registrationPayload(state, 'u-1').status, 'registered');
  assert.match(String(views.register.render(state, [], ctx(before))), /you are registered/);
});

test('Home counts down to 08:30 on Saturday 12 December, Vietnam time, and the schedule opens on the current day', async () => {
  const { FORMATS } = await import('../public/src/data/event.js');
  const { countdown, eventWindow } = await import('../public/src/lib/time.js');
  const { start, end } = eventWindow(FORMATS.A);
  assert.equal(new Date(start).toISOString(), '2026-12-12T01:30:00.000Z', '08:30 ICT on Saturday');
  assert.equal(new Date(end).toISOString(), '2026-12-13T11:45:00.000Z', '18:45 ICT on Sunday');
  assert.equal(countdown(before, start).days, 42);
  const home = (now) => String(views.home.render(fresh(), [], ctx(now)));
  assert.match(home(before), /<h2>Saturday 12 and Sunday 13 December 2026<\/h2>/);
  assert.match(home(before), /42 days to go\. Two days in Da Nang, 08:30–19:00 on Saturday and 08:30–18:45 on Sunday\./);
  assert.match(home(before), /Opens Saturday 12 December/);
  assert.match(home(before), /Opens Sunday 13 December/);
  for (const now of [eventDay, sunday]) assert.match(home(now), /The event is under way\./);
  assert.match(home(after), /The event has ended\./);
  const schedule = (now) => String(views.schedule.render(fresh(), [], ctx(now)));
  assert.match(schedule(before), /<h2>Day 1 · Saturday 12 December<\/h2>/);
  assert.match(schedule(eventDay), /Day 1 · today/);
  assert.match(schedule(sunday), /<h2>Day 2 · Sunday 13 December<\/h2>/);
  assert.match(schedule(sunday), /Day 2 · today/);
  assert.match(String(views.submit.render(fresh(), [], ctx(before))), /Final submission opens on Sunday 13 December and closes at 16:30\. Code freezes at 16:00\./);
});

test('sample profiles are always labelled as samples where they appear', () => {
  const state = fresh();
  const team = String(views.team.render(state, [], ctx(before)));
  assert.equal((team.match(/Sample profile</g) ?? []).length, SAMPLE_PROFILES.length);
  assert.match(String(views.team.render(state, ['linh'], ctx(before))), /fictional sample profile/);
});

// Connected to live services: a stand-in for the backend in each connection state.
const live = (now, status = 'live') => ({
  ...ctx(now),
  backend: { configured: true, status: () => status, problem: () => (status === 'guest' ? 'Accounts are not switched on yet.' : ''), userId: () => (status === 'live' ? 'u-1' : null) },
});

function connected() {
  const state = busy();
  state.eventSettings = { registrationOpen: false, checkInOpen: false, submissionsOpen: false };
  state.builders = [{ id: 'b-1', name: HOSTILE, role: 'solana', skills: [HOSTILE, 'Rust', 'Anchor'], tracks: ['mobile'], lookingFor: 'members', languages: ['English'], formats: ['A'], bio: HOSTILE, github: 'https://github.com/x' }];
  state.team = { remote: true, id: 'team-1', name: HOSTILE, track: 'mobile', openRoles: ['design'], owner: true, conversationId: 'conv-1', threadId: 'c-conv-1', createdAt: before,
    members: [{ id: 'u-1', me: true, status: 'joined', name: HOSTILE, role: 'mobile' }, { id: 'b-1', me: false, status: 'invited', name: HOSTILE, role: 'solana' }] };
  state.invitations = [{ teamId: 'team-2', name: HOSTILE, track: 'ai', openRoles: ['design'] }];
  state.threads['c-conv-1'] = { id: 'c-conv-1', remote: true, conversationId: 'conv-1', kind: 'team', title: `Team ${HOSTILE}`, subtitle: 'Your team chat', unread: 1, readAt: 0, people: { 'b-1': { name: HOSTILE, role: 'solana' } },
    messages: [{ id: 'm1', from: 'b-1', at: before, text: HOSTILE }, { id: 'm2', from: 'me', at: before, text: HOSTILE, pending: true }, { id: 'm3', from: 'me', at: before, text: HOSTILE, failed: HOSTILE }] };
  state.threads['c-conv-2'] = { id: 'c-conv-2', remote: true, conversationId: 'conv-2', kind: 'organizers', title: 'Ask the organizers', subtitle: 'Your private line to the organizer team', unread: 0, readAt: 0, people: {},
    messages: [{ id: 'm4', from: 'organizers', at: before, text: HOSTILE }, { id: 'm5', from: 'former', at: before, text: HOSTILE }] };
  state.threads['c-conv-3'] = { id: 'c-conv-3', remote: true, conversationId: 'conv-3', kind: 'direct', title: HOSTILE, subtitle: 'Solana developer', unread: 0, readAt: 0, people: { 'b-1': { name: HOSTILE, role: 'solana' } }, messages: [] };
  return state;
}

const livePages = [...pages, ['team', 'b-1'], ['inbox', 'c-conv-1'], ['inbox', 'c-conv-2'], ['inbox', 'c-conv-3']];

test('connected screens render in every connection state, and nothing other builders write becomes markup', () => {
  for (const status of ['connecting', 'ready', 'live', 'guest', 'offline']) {
    for (const now of [before, eventDay, sunday]) {
      for (const [name, ...params] of livePages) {
        const out = String(views[name].render(connected(), params, live(now, status)));
        const where = `${status}: ${name}/${params.join('/')}`;
        assert.match(out, /<h1[ >]/, where);
        assert.doesNotMatch(out, /<img src=x/, where);
        assert.doesNotMatch(out, /registration is open|apply now/i, where);
      }
    }
  }
  const chat = String(views.inbox.render(connected(), ['c-conv-1'], live(before)));
  assert.match(chat, /Sending…/);
  assert.match(chat, /data-action="retry" data-id="m3"/);
  const organizers = String(views.inbox.render(connected(), ['c-conv-2'], live(before)));
  assert.match(organizers, /Organizers · /);
  assert.match(organizers, /Former member · /);
});

test('real builders are listed apart from the labelled samples, with their invitations and team chat', () => {
  const out = String(views.team.render(connected(), [], live(before)));
  assert.match(out, /Builders on Dragon Connector/);
  assert.equal((out.match(/Sample profile</g) ?? []).length, SAMPLE_PROFILES.length, 'real builders are not labelled as samples');
  assert.match(out, /data-action="respond" data-team="team-2" data-accept="yes"/);
  assert.match(out, /href="#\/inbox\/c-conv-1"/);
  assert.doesNotMatch(out, /data-action="invite" data-id="b-1"/, 'already invited');
  assert.doesNotMatch(String(views.team.render(connected(), ['b-1'], live(before))), /fictional sample profile/);
  const guest = String(views.team.render(connected(), [], live(before, 'guest')));
  assert.doesNotMatch(guest, /Builders on Dragon Connector/);
  assert.match(guest, /Accounts are not switched on yet/);
  assert.match(String(views.inbox.render(connected(), [], live(before))), /delivered live/);
});

test('details saved before accounts existed are offered for connection, not sent', () => {
  const state = connected();
  state.dataHome = 'device';
  for (const name of ['home', 'team', 'inbox', 'settings']) assert.match(String(views[name].render(state, [], live(before))), /data-action="connect-details"/, name);
  assert.doesNotMatch(String(views.team.render(state, [], live(before))), /Builders on Dragon Connector/);
  assert.doesNotMatch(String(views.home.render(connected(), [], live(before))), /connect-details/);
});

test("the organizers' switches decide which steps are open once the app has heard from them", () => {
  const state = fresh();
  state.eventSettings = { registrationOpen: false, checkInOpen: false, submissionsOpen: false };
  assert.equal(checkInOpen(state, eventDay), false, 'event day alone does not open check-in');
  assert.equal(submissionsOpen(state, eventDay), false);
  state.eventSettings = { registrationOpen: true, checkInOpen: true, submissionsOpen: true };
  assert.equal(checkInOpen(state, before), true);
  assert.equal(submissionsOpen(state, before), true);
  assert.match(String(views.register.render(state, [], live(before))), /Registration is open/);
  assert.equal(views.register.title(state, []), 'Register');
});

test('the Sponsors page shows example placements only in Preview mode, labelled as examples', () => {
  const state = fresh();
  const closed = String(views.sponsors.render(state, [], ctx(before)));
  assert.match(closed, /To be announced/);
  assert.doesNotMatch(closed, /Your brand|Example placements/);
  state.preview = true;
  const preview = String(views.sponsors.render(state, [], ctx(before)));
  assert.match(preview, /<strong>Example placements\.<\/strong>/);
  assert.match(preview, /None of them is a sponsor/);
  assert.doesNotMatch(preview, /To be announced/);
  for (const words of [/Presented by/, /Track sponsors/, /Prize sponsors/, /In-kind partners/, /Your logo/, /Consumer mobile track/, /Best design/]) assert.match(preview, words);
  // Placeholders link nowhere, and the packages say where each one appears.
  assert.doesNotMatch(preview.slice(0, preview.indexOf('id="offers-title"')), /<a /);
  for (const words of [/Dragon/, /\$3,000 · 1 slot/, /On this page:/]) assert.match(preview, words);
});

test('teams stop at 4 people: members and pending invitations fill the seats', async () => {
  const { teamSeats } = await import('../public/src/views/team.js');
  const { EVENT } = await import('../public/src/data/event.js');
  assert.equal(EVENT.teamMax, 4);
  const state = fresh();
  const others = SAMPLE_PROFILES.slice(0, 3).map((profile) => profile.id);
  state.team = { name: 'Crew', track: 'mobile', openRoles: [], invites: others.slice(0, 2), createdAt: before };
  assert.equal(teamSeats(state.team), 3);
  let out = String(views.team.render(state, [], ctx(before)));
  assert.match(out, /data-action="invite"/, 'a seat is still free');
  assert.doesNotMatch(out, /Team full/);
  state.team.invites = others;
  assert.equal(teamSeats(state.team), 4);
  out = String(views.team.render(state, [], ctx(before)));
  assert.doesNotMatch(out, /data-action="invite"/, 'no invitations once the team is full');
  assert.match(out, /Team full \(4\)/);
  assert.equal(teamSeats({ remote: true, members: [{}, {}, {}, {}] }), 4);
  assert.equal(teamSeats(null), 0);
});

test('the More screen and the About doc link the @dragonconnector accounts, and nothing loops', async () => {
  const { EVENT } = await import('../public/src/data/event.js');
  const { readFileSync } = await import('node:fs');
  assert.equal(EVENT.handle, '@dragonconnector');
  assert.deepEqual(EVENT.social.map((item) => item.name), ['Instagram', 'TikTok', 'Facebook', 'X']);
  const more = String(views.more.render(fresh(), [], ctx(before)));
  for (const item of EVENT.social) {
    assert.match(item.url, /^https:\/\/(www\.)?(instagram\.com\/dragonconnector\/|tiktok\.com\/@dragonconnector|facebook\.com\/dragonconnector|x\.com\/dragonconnector)$/);
    assert.ok(more.includes(`href="${item.url}" target="_blank" rel="noopener noreferrer"`), item.name);
  }
  assert.ok(String(views.docs.render(fresh(), ['about'], ctx(before))).includes(EVENT.social[0].url));
  assert.doesNotMatch(readFileSync(new URL('../public/styles/app.css', import.meta.url), 'utf8'), /infinite/, 'no looping animation');
});

test('the app lives at dragonconnector.com/app/, and only its old address moves there', async () => {
  const { readFileSync } = await import('node:fs');
  const read = (path) => readFileSync(new URL(`../public/${path}`, import.meta.url), 'utf8');
  const { EVENT } = await import('../public/src/data/event.js');
  assert.equal(EVENT.siteUrl, 'https://dragonconnector.com');
  assert.equal(EVENT.appUrl, `${EVENT.siteUrl}/app/`);
  const index = read('index.html');
  assert.ok(index.includes(`<link rel="canonical" href="${EVENT.appUrl}">`));
  assert.ok(index.includes(`<meta property="og:image" content="${EVENT.appUrl}og.png">`));
  assert.ok(index.indexOf('src/moved.js') < index.indexOf('src/main.js'), 'the move runs before the app starts');
  const moved = read('src/moved.js');
  const visit = (hostname, hash) => { let target = null; new Function('location', moved)({ hostname, hash, replace: (url) => { target = url; } }); return target; };
  assert.equal(visit('dragonconnectorapp.vercel.app', '#/team'), 'https://dragonconnector.com/app/#/team');
  assert.equal(visit('dragonconnector.com', '#/team'), null, 'served through the rewrite, the app stays put');
  assert.equal(visit('localhost', ''), null);
  assert.equal(JSON.parse(read('manifest.webmanifest')).id, './', 'the installed app is identified by its own path');
});

test('Dragon Connector, the organizers and the Dragon Guide carry the brand marks in the inbox; people keep their initials', () => {
  const state = fresh();
  const list = String(views.inbox.render(state, [], ctx(before)));
  assert.match(list, /<span class="avatar brand announcements" aria-hidden="true"><img src="brand\/dragon-connector-avatar\.svg"/);
  assert.match(list, /<span class="avatar brand guide" aria-hidden="true"><img src="brand\/dragon-connector-star\.svg"/);
  const thread = String(views.inbox.render(state, ['announcements'], ctx(before)));
  assert.match(thread, /class="avatar brand announcements"/);
  const person = String(views.inbox.render(busy(), ['dm-linh'], ctx(before)));
  assert.match(person, /<span class="avatar" aria-hidden="true">LN<\/span>/);
});
