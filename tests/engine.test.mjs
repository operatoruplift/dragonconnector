import test from 'node:test';
import assert from 'node:assert/strict';
import { BADGES, LEVELS, MAX_XP, QUESTS, applyProgress, earnedBadges, levelFor, nextQuest, profileComplete, xpOf } from '../public/src/lib/game.js';
import { STORAGE_KEY, createStore, initialState, migrate } from '../public/src/lib/store.js';
import { matchScore, rankMatches } from '../public/src/lib/match.js';
import { answer } from '../public/src/lib/guide.js';
import { SAMPLE_PROFILES } from '../public/src/data/people.js';

const memory = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key), data };
};
const complete = { name: 'An Nguyen', role: 'design', skills: ['Figma', 'UX research', 'Prototyping'], tracks: ['mobile'], lookingFor: 'team', languages: ['Vietnamese'], formats: ['A'] };

test('quests add up to the XP the levels are built around, and every badge is earnable', () => {
  assert.equal(MAX_XP, 1400);
  assert.equal(new Set(QUESTS.map((quest) => quest.id)).size, QUESTS.length);
  assert.deepEqual(LEVELS.map((level) => level.min), [...LEVELS.map((level) => level.min)].sort((a, b) => a - b));
  assert.ok(LEVELS.at(-1).min <= MAX_XP - 50, 'the top level is reachable without installing the app');
  for (const badge of BADGES) for (const id of badge.quests) assert.ok(QUESTS.some((quest) => quest.id === id), `${badge.id} needs unknown quest ${id}`);
  assert.deepEqual(levelFor(0), { index: 0, number: 1, name: 'Hatchling', min: 0, next: LEVELS[1], progress: 0 });
  assert.equal(levelFor(MAX_XP).name, 'Dragon');
  assert.equal(levelFor(MAX_XP).progress, 1);
});

test('progress is recorded once, derives XP, and reports quests, level-ups and badges', () => {
  const state = initialState(1);
  state.waitlist = { name: 'An' };
  state.profile = { ...state.profile, ...complete };
  const events = applyProgress(state, 100);
  assert.deepEqual(events.map((event) => event.type === 'quest' ? event.quest.id : event.type), ['waitlist', 'profile', 'level', 'badge']);
  assert.equal(xpOf(state), 150);
  assert.equal(levelFor(xpOf(state)).name, 'Spark');
  assert.deepEqual(earnedBadges(state).map((badge) => badge.id), ['listed']);
  assert.deepEqual(applyProgress(state, 200), [], 'nothing new on a second pass');
  state.waitlist = null;
  applyProgress(state, 300);
  assert.equal(state.quests.waitlist, 100, 'a completed quest stays complete');
  assert.equal(nextQuest(state).id, 'register');
});

test('a profile needs a name, role, three skills, a track and a goal', () => {
  assert.equal(profileComplete(complete), true);
  assert.equal(profileComplete({ ...complete, skills: ['Figma', 'UX research'] }), false);
  assert.equal(profileComplete({ ...complete, name: '   ' }), false);
  assert.equal(profileComplete({ ...complete, lookingFor: '' }), false);
});

test('the store saves on this device, survives bad storage and reports events', () => {
  const storage = memory();
  const seen = [];
  let renders = 0;
  const store = createStore({ storage, now: () => 42, onEvent: (event) => seen.push(event.type) });
  store.subscribe(() => { renders += 1; });
  store.update((state) => { state.bookmarks.push('A1-0800'); }, { quiet: true });
  assert.equal(renders, 0, 'quiet updates do not re-render');
  store.update((state) => { state.waitlist = { name: 'An' }; });
  assert.equal(renders, 1);
  assert.deepEqual(seen, ['quest', 'badge']);
  const saved = JSON.parse(storage.data.get(STORAGE_KEY));
  assert.deepEqual(saved.bookmarks, ['A1-0800']);
  assert.equal(createStore({ storage }).get().quests.waitlist, 42, 'a new session reads the saved state');

  storage.setItem(STORAGE_KEY, '{not json');
  assert.equal(createStore({ storage }).get().waitlist, null, 'unreadable saves start fresh');
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() {} };
  const fallback = createStore({ storage: broken });
  fallback.update((state) => { state.tourDone = true; });
  assert.equal(fallback.get().quests.tour !== undefined, true, 'works in memory when storage is blocked');
  store.reset();
  assert.equal(storage.data.has(STORAGE_KEY), false);
});

test('older saves gain new fields without losing progress; other versions start over', () => {
  const old = { version: 1, profile: { name: 'An' }, quests: { waitlist: 5 }, tasks: 'oops' };
  const merged = migrate(old, 9);
  assert.equal(merged.profile.name, 'An');
  assert.deepEqual(merged.profile.skills, []);
  assert.deepEqual(merged.tasks, []);
  assert.equal(merged.quests.waitlist, 5);
  assert.deepEqual(merged.submission, initialState(9).submission);
  assert.deepEqual(migrate({ version: 99, quests: { waitlist: 1 } }, 9), initialState(9));
});

test('matching rewards complementary roles and explains itself', () => {
  const me = { ...complete };
  const designer = SAMPLE_PROFILES.find((profile) => profile.id === 'aiko');
  const mobile = SAMPLE_PROFILES.find((profile) => profile.id === 'linh');
  assert.ok(matchScore(me, mobile).score > matchScore(me, designer).score, 'a different role ranks above the same role');
  assert.ok(matchScore(me, mobile).reasons[0].startsWith('Complements your role'));
  const team = { openRoles: ['solana'] };
  const solana = SAMPLE_PROFILES.find((profile) => profile.id === 'minh');
  assert.ok(matchScore(me, solana, team).score >= matchScore(me, solana).score + 20);
  assert.ok(matchScore(me, solana, team).reasons.includes('Fills an open role on your team'));
  for (const profile of SAMPLE_PROFILES) {
    const { score, reasons } = matchScore(me, profile);
    assert.ok(score >= 0 && score <= 99 && reasons.length <= 3);
  }
  const empty = matchScore(initialState(0).profile, mobile);
  assert.ok(empty.score < matchScore(me, mobile).score, 'an empty profile still gets a ranking');
  assert.deepEqual(rankMatches(me, SAMPLE_PROFILES).map((match) => match.profile.id), rankMatches(me, [...SAMPLE_PROFILES].reverse()).map((match) => match.profile.id));
});

test('the Dragon Guide answers from event data and keeps the caveats', () => {
  const ask = (question) => answer(question);
  assert.equal(ask('When is code freeze?').topic, 'submit');
  assert.equal(ask('my email is available').topic, 'fallback', 'no substring matches');
  assert.equal(ask('Who are the judges?').topic, 'judging', 'plurals match');
  assert.match(ask('What are the prizes?').text, /not funded/);
  assert.match(ask('When is it?').text, /proposed, not confirmed/);
  assert.match(ask('Can I register?').text, /not open/);
  assert.match(ask('Any sponsors?').text, /No sponsor is confirmed/);
  const cases = {
    'hello': 'hello', 'which date?': 'dates', 'where is the venue': 'venue', 'find a teammate': 'team', 'how do I check in': 'checkin',
    'the agenda': 'schedule', 'which track': 'tracks', 'what should I bring': 'bring', 'is lunch provided': 'food',
    'is there a hotel': 'overnight', 'is there a fee': 'cost', 'how do levels work': 'xp',
  };
  for (const [question, topic] of Object.entries(cases)) assert.equal(answer(question).topic, topic, question);
  for (const link of ['register', 'submit', 'prizes'].flatMap((word) => answer(word).links ?? [])) assert.ok(link.route && link.label);
});
