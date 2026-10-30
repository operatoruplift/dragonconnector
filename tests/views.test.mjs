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
