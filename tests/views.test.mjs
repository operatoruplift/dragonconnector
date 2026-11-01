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
const eventDay = Date.parse('2026-12-13T10:00:00+07:00');
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
  state.bookmarks = ['A1-0800', 'A1-0945', 'A1-1400'];
  state.guidesRead = GUIDES.map((guide) => guide.slug);
  applyProgress(state, before);
  return state;
}

const pages = [
  ['home'], ['waitlist'], ['waitlist', 'edit'], ['register'], ['register', 'edit'], ['profile'], ['checkin'], ['team'], ['team', 'linh'], ['team', 'nobody'],
  ['inbox'], ['inbox', 'guide'], ['inbox', 'announcements'], ['inbox', 'dm-linh'], ['inbox', 'team'], ['inbox', 'missing'], ['submit'], ['submit', 'edit'], ['quests'], ['schedule'],
  ['guides'], ...GUIDES.map((guide) => ['guides', guide.slug]), ['docs'], ...DOCS.map((doc) => ['docs', doc.slug]), ['requirements'], ['map'], ['prizes'], ['sponsors'], ['settings'], ['more'],
];

test('every screen renders for a new and a busy builder, before and on event day', () => {
  for (const make of [fresh, busy]) {
    for (const now of [before, eventDay]) {
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

test('gated steps stay closed before event day unless preview mode is on', () => {
  const state = fresh();
  assert.equal(checkInOpen(state, before), false);
  assert.equal(submissionsOpen(state, before), false);
  assert.equal(checkInOpen(state, eventDay), true);
  const checkin = String(views.checkin.render(state, [], ctx(before)));
  assert.match(checkin, /<button class="btn primary" type="submit" disabled>/);
  state.preview = true;
  assert.equal(checkInOpen(state, before), true);
  assert.match(String(views.checkin.render(state, [], ctx(before))), /Preview mode: use DRAGON-001/);
  const register = String(views.register.render(fresh(), [], ctx(before)));
  assert.match(register, /Pre-register/);
  assert.doesNotMatch(register, /Complete registration/);
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
    for (const now of [before, eventDay]) {
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
  for (const words of [/Presented by/, /Track partners/, /Challenge partners/, /In-kind partners/, /Community partners/, /Your logo/, /Open track/]) assert.match(preview, words);
  // Placeholders link nowhere, and the packages say where each one appears.
  assert.doesNotMatch(preview.slice(0, preview.indexOf('id="offers-title"')), /<a /);
  for (const words of [/Presenting partner/, /From \$3,000/, /On this page:/]) assert.match(preview, words);
});
