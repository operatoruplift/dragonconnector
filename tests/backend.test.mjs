import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackend, fingerprint, friendly, isNetworkError, profilePayload, registrationPayload, submissionPayload } from '../public/src/lib/backend.js';
import { createStore, initialState, migrate } from '../public/src/lib/store.js';
import { fakeSupabase } from './fake-supabase.mjs';

const memory = (saved = null) => {
  const data = new Map(saved ? [['dragonconnector:v1', JSON.stringify(saved)]] : []);
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key) };
};
const config = { url: 'https://example.supabase.co', anonKey: 'public-anon-key', region: 'the United States (Ohio)' };
const complete = { name: 'An Nguyen', email: '', role: 'design', skills: ['Figma', 'UX research', 'Prototyping'], tracks: ['mobile'], lookingFor: 'team', languages: ['Vietnamese'], formats: ['A'], bio: 'I design mobile apps.', github: '', discoverable: false };
const registration = { status: 'pre-registered', step: 0, updatedAt: 1, data: { name: 'An Nguyen', email: 'an@example.com', phone: '+84 905  123 456', format: 'A', experience: 'some', dietary: '', access: '', conduct: true, media: 'no', data: true } };
const settle = () => new Promise((resolve) => { setTimeout(resolve, 5); });
const open = [];

function setup(fake, { saved = null, viewing = () => null } = {}) {
  const store = createStore({ storage: memory(saved) });
  store.update((state) => { state.passCode ??= 'DC-7KQ4-M2XP'; }, { quiet: true });
  const notices = [];
  const backend = createBackend({ config, loadClient: async () => () => fake.client, store, viewing, notify: (text) => notices.push(text) });
  open.push(backend);
  return { store, backend, notices };
}

test.afterEach(() => { while (open.length) open.pop().stop(); });

test('payloads respect the database limits and skip records that are not ready', () => {
  assert.equal(profilePayload({ ...complete, role: '' }, 'u'), null, 'role is required');
  assert.equal(profilePayload({ ...complete, name: 'A' }, 'u'), null, 'names need two characters');
  const profile = profilePayload({ ...complete, skills: ['Figma', 'x'.repeat(41)], github: 'github.com/an' }, 'u');
  assert.deepEqual(profile.skills, ['Figma']);
  assert.equal(profile.github, null, 'only full web links are stored');
  assert.equal(profile.looking_for, 'team');

  assert.equal(registrationPayload({ registration: { ...registration, status: 'draft' }, passCode: 'DC-7KQ4-M2XP' }, 'u'), null);
  const entry = registrationPayload({ registration, passCode: 'DC-7KQ4-M2XP' }, 'u');
  assert.equal(entry.phone, '+84 905 123 456');
  assert.equal(entry.media_consent, false);
  assert.equal(entry.dietary, null);

  const team = { remote: true, id: 'team-1' };
  const draft = { status: 'draft', data: { name: 'Lantern', repo: 'githu', stack: ['Kotlin'] } };
  assert.equal(submissionPayload({ submission: { ...draft, data: { name: 'L' } }, team: null }, 'u'), null);
  const saved = submissionPayload({ submission: draft, team }, 'u');
  assert.equal(saved.repo_url, null, 'a half-typed link is not sent');
  assert.equal(saved.team_id, 'team-1');
  assert.equal(saved.status, 'draft');
  const final = { status: 'submitted', submittedAt: Date.parse('2026-12-13T10:00:00Z'), data: { ...draft.data, repo: 'https://github.com/an/lantern' } };
  assert.equal(submissionPayload({ submission: { ...final, preview: true }, team: null }, 'u').status, 'draft', 'preview submissions stay drafts');
  const real = submissionPayload({ submission: final, team: null }, 'u');
  assert.equal(real.status, 'submitted');
  assert.equal(fingerprint(real, ['submitted_at']), fingerprint({ submitted_at: '2026-12-13T10:00:00+00:00' }, ['submitted_at']), 'timestamps compare by time, not by format');
});

test('browsing creates no account; saving details creates one and only changes are written', async () => {
  const fake = fakeSupabase();
  const { store, backend } = setup(fake);
  await backend.start();
  assert.equal(backend.status(), 'ready');
  assert.equal(fake.count('auth', 'signInAnonymously'), 0);
  const announcements = store.get().threads.announcements;
  assert.equal(announcements.title, 'Announcements');
  assert.deepEqual(announcements.messages.map((message) => message.text), ['Dragon Connector is in planning.', 'Registration is not open.']);
  assert.deepEqual(store.get().eventSettings, { registrationOpen: false, checkInOpen: false, submissionsOpen: false });

  store.update((state) => { state.profile = { ...complete }; });
  await backend.syncNow();
  assert.equal(backend.status(), 'live');
  assert.equal(fake.count('auth', 'signInAnonymously'), 1);
  assert.equal(fake.tables.profiles.length, 1);
  assert.equal(fake.tables.profiles[0].discoverable, false, 'hidden until the builder chooses otherwise');

  const writes = fake.count('upsert');
  await backend.syncNow();
  assert.equal(fake.count('upsert'), writes, 'nothing changed, nothing written');
  store.update((state) => { state.profile.discoverable = true; state.registration = structuredClone(registration); });
  await backend.syncNow();
  assert.equal(fake.tables.profiles[0].discoverable, true);
  assert.equal(fake.tables.registrations[0].pass_code, 'DC-7KQ4-M2XP');
  assert.equal(fake.count('auth', 'signInAnonymously'), 1, 'one account per device');
});

test('with anonymous sign-ins switched off, the waitlist still reaches the organizers', async () => {
  const fake = fakeSupabase({ anonymous: 'disabled' });
  const { store, backend } = setup(fake);
  await backend.start();
  store.update((state) => {
    state.profile = { ...complete };
    state.waitlist = { name: 'An Nguyen', email: 'An@Example.com', role: 'design', track: 'mobile', joinedAt: 1, sent: false, consented: true };
  });
  await backend.syncNow();
  assert.equal(backend.status(), 'guest');
  assert.match(backend.problem(), /not switched on/);
  assert.equal(store.get().waitlist.sent, true);
  assert.equal(store.get().waitlist.linked, false);
  assert.deepEqual(fake.tables.waitlist.map((row) => row.email), ['an@example.com']);
  assert.equal(fake.tables.profiles.length, 0, 'no account, so the profile stays on the device');
  const attempts = fake.count('auth', 'signInAnonymously');
  await backend.syncNow();
  assert.equal(fake.count('auth', 'signInAnonymously'), attempts, 'it does not keep asking');
});

test('offline, nothing is lost, and it is sent when the connection returns', async () => {
  const fake = fakeSupabase({ network: false });
  const { store, backend } = setup(fake);
  store.update((state) => { state.profile = { ...complete }; });
  await backend.start();
  assert.equal(backend.status(), 'offline');
  fake.network = true;
  await backend.start();
  await backend.syncNow();
  assert.equal(backend.status(), 'live');
  assert.equal(fake.tables.profiles[0].name, 'An Nguyen');
});

test('a device that starts offline connects once the browser is back online', async () => {
  const fake = fakeSupabase();
  let online = false;
  const store = createStore({ storage: memory() });
  store.update((state) => { state.profile = { ...complete }; state.passCode = 'DC-7KQ4-M2XP'; });
  const backend = createBackend({ config, loadClient: async () => () => fake.client, store, online: () => online });
  open.push(backend);
  await backend.start();
  assert.equal(backend.status(), 'offline');
  assert.equal(fake.log.length, 0, 'it does not even try');
  online = true;
  await backend.start();
  await backend.syncNow();
  assert.equal(backend.status(), 'live');
  assert.equal(fake.tables.profiles[0].name, 'An Nguyen');
});

test('a new account is not read back: its first save goes straight out', async () => {
  const fake = fakeSupabase();
  const { store, backend } = setup(fake);
  await backend.start();
  store.update((state) => { state.waitlist = { name: 'An Nguyen', email: 'an@example.com', role: 'design', track: '', joinedAt: 1, sent: false, consented: true }; });
  await backend.syncNow();
  assert.deepEqual(fake.log.filter(([kind]) => kind !== 'select').map(([kind, name]) => `${kind}:${name}`), ['auth:getSession', 'auth:signInAnonymously', 'rpc:join_waitlist']);
  assert.equal(fake.tables.waitlist[0].user_id, fake.signedIn());
});

test('a returning device gets its records back, and newer details on the device win', async () => {
  const fake = fakeSupabase({ session: { user: { id: 'u-1' } } });
  fake.tables.profiles.push({ id: 'u-1', name: 'Linh N.', role: 'mobile', skills: ['Kotlin', 'Rust', 'Figma'], tracks: ['mobile'], looking_for: 'team', languages: ['English'], formats: ['A'], bio: '', github: null, discoverable: true, updated_at: '2026-10-30T00:00:00Z' });
  fake.tables.registrations.push({ user_id: 'u-1', name: 'Linh N.', email: 'linh@example.com', phone: null, format: 'either', experience: 'first', dietary: null, access_needs: null, agrees_to_conduct: true, media_consent: true, status: 'pre-registered', pass_code: 'DC-AAAA-BBBB', updated_at: '2026-10-30T00:00:00Z' });
  fake.tables.check_ins.push({ user_id: 'u-1', checked_in_at: '2026-12-13T02:00:00Z' });
  const { store, backend } = setup(fake);
  await backend.start();
  await backend.syncNow();
  const state = store.get();
  assert.equal(backend.status(), 'live');
  assert.equal(state.profile.name, 'Linh N.');
  assert.equal(state.profile.discoverable, true);
  assert.equal(state.registration.status, 'pre-registered');
  assert.equal(state.passCode, 'DC-AAAA-BBBB');
  assert.equal(state.checkIn.at, Date.parse('2026-12-13T02:00:00Z'));
  assert.ok(state.quests.register && state.quests.checkin, 'the quests follow');
  assert.equal(fake.count('upsert'), 0, 'what came from the server is not written back');
  store.update((draft) => { draft.profile.bio = 'Android and Rust.'; });
  await backend.syncNow();
  assert.equal(fake.tables.profiles[0].bio, 'Android and Rust.');
});

test('details saved before accounts existed wait until the builder connects them', async () => {
  const saved = { ...initialState(1), profile: { ...complete } };
  delete saved.dataHome;
  assert.equal(migrate(saved, 2).dataHome, 'device');
  assert.equal(migrate({ ...initialState(1), dataHome: undefined }, 2).dataHome, 'account', 'nothing personal, nothing to ask');
  const fake = fakeSupabase();
  const { store, backend } = setup(fake, { saved });
  await backend.start();
  await backend.syncNow();
  assert.equal(fake.count('auth', 'signInAnonymously'), 0);
  assert.equal(fake.count('upsert'), 0);
  await backend.connectDetails();
  assert.equal(store.get().dataHome, 'account');
  assert.equal(fake.tables.profiles[0].name, 'An Nguyen');
});

function chatFixture() {
  const fake = fakeSupabase({ session: { user: { id: 'u-1' } } });
  fake.tables.profiles.push(
    { id: 'u-1', name: 'An Nguyen', role: 'design', skills: [], tracks: [], looking_for: 'team', languages: [], formats: [], bio: '', github: null, discoverable: true, updated_at: '2026-10-30T00:00:00Z' },
    { id: 'u-2', name: 'Bao Tran', role: 'solana', skills: ['Rust'], tracks: ['mobile'], looking_for: 'members', languages: [], formats: [], bio: '', github: null, discoverable: true, updated_at: '2026-10-30T00:00:00Z' },
  );
  fake.tables.conversations.push({ id: 'c1', kind: 'direct', pair_key: 'direct:u-1:u-2' });
  fake.tables.conversation_members.push({ conversation_id: 'c1', user_id: 'u-1' }, { conversation_id: 'c1', user_id: 'u-2' });
  fake.tables.messages.push({ id: 'm-1', conversation_id: 'c1', sender_id: 'u-2', from_organizers: false, body: 'Want to team up?', created_at: '2026-10-31T01:00:00Z' });
  return fake;
}

test('messages appear at once, arrive once, and count as unread only when unseen', async () => {
  const fake = chatFixture();
  let viewing = null;
  const { store, backend } = setup(fake, { viewing: () => viewing });
  await backend.start();
  const thread = () => store.get().threads['c-c1'];
  assert.equal(thread().title, 'Bao Tran');
  assert.equal(thread().unread, 1);

  const sending = backend.sendMessage('c-c1', 'Yes! I design.');
  assert.equal(thread().messages.at(-1).pending, true, 'shown before the server answers');
  await sending;
  const sent = thread().messages.at(-1);
  assert.equal(sent.pending, undefined);
  assert.equal(sent.from, 'me');
  fake.emit('messages', fake.tables.messages.at(-1));
  assert.equal(thread().messages.filter((message) => message.text === 'Yes! I design.').length, 1, 'the live echo is not a duplicate');

  fake.emit('messages', { id: 'm-3', conversation_id: 'c1', sender_id: 'u-2', from_organizers: false, body: 'Great.', created_at: '2026-10-31T01:05:00Z' });
  assert.equal(thread().unread, 2);
  viewing = 'c-c1';
  fake.emit('messages', { id: 'm-4', conversation_id: 'c1', sender_id: 'u-2', from_organizers: false, body: 'See you there.', created_at: '2026-10-31T01:06:00Z' });
  assert.equal(thread().unread, 0);
  assert.equal(thread().readAt, Math.max(...thread().messages.map((message) => message.at)), 'read up to the latest message');
});

test('a refused message can be retried, and one written offline waits for the connection', async () => {
  const fake = chatFixture();
  const { store, backend } = setup(fake);
  await backend.start();
  let refusals = 1;
  fake.hooks['insert:messages'] = () => (refusals-- > 0 ? { code: 'P0001', message: 'You are sending messages too quickly. Wait a moment and try again.' } : null);
  await backend.sendMessage('c-c1', 'One');
  const failed = store.get().threads['c-c1'].messages.at(-1);
  assert.match(failed.failed, /too quickly/);
  await backend.retryMessage('c-c1', failed.id);
  assert.equal(store.get().threads['c-c1'].messages.at(-1).failed, undefined);

  fake.network = false;
  await backend.sendMessage('c-c1', 'Two');
  assert.equal(backend.status(), 'offline');
  assert.equal(store.get().threads['c-c1'].messages.at(-1).pending, true);
  fake.network = true;
  await backend.start();
  await settle();
  assert.ok(fake.tables.messages.some((message) => message.body === 'Two'), 'sent after reconnecting');
  assert.equal(store.get().threads['c-c1'].messages.filter((message) => message.text === 'Two').length, 1);
});

test('a team made on the device goes live with the profile, and invitations arrive', async () => {
  const fake = fakeSupabase();
  const { store, backend } = setup(fake);
  store.update((state) => {
    state.profile = { ...complete };
    state.team = { name: 'Han River Labs', track: 'mobile', openRoles: ['solana'], invites: [], createdAt: 1 };
    state.threads.team = { id: 'team', kind: 'team', title: 'Team Han River Labs', unread: 0, messages: [{ id: 't0', from: 'system', at: 1, text: 'You created Han River Labs.' }] };
  });
  await backend.start();
  await backend.syncNow();
  const team = store.get().team;
  assert.equal(team.remote, true);
  assert.equal(team.owner, true);
  assert.deepEqual(team.members.map((member) => member.name), ['An Nguyen']);
  assert.equal(store.get().threads.team, undefined, 'the device-only chat had nothing worth keeping');
  assert.equal(store.get().threads[team.threadId].title, 'Team Han River Labs');

  fake.tables.teams.push({ id: 'team-x', name: 'Lotus', track: 'ai', open_roles: ['design'], owner_id: 'u-9', conversation_id: 'conv-x', created_at: '2026-10-31T00:00:00Z' });
  fake.tables.team_members.push({ team_id: 'team-x', user_id: fake.signedIn(), status: 'invited' });
  await backend.refresh();
  assert.deepEqual(store.get().invitations.map((invitation) => invitation.name), ['Lotus']);
  const answer = await backend.respond('team-x', true);
  assert.match(answer.error, /Leave your current team/);
});

test('check-in answers come from the server', async () => {
  const fake = fakeSupabase();
  fake.rpcs.check_in = ({ code }) => (code === 'GOLD-7' ? { status: 'checked-in', checked_in_at: '2026-12-13T01:30:00Z' } : { status: 'wrong-code' });
  const { store, backend } = setup(fake);
  await backend.start();
  assert.equal((await backend.checkIn('NOPE')).status, 'wrong-code');
  assert.equal(store.get().checkIn, null);
  assert.equal((await backend.checkIn('GOLD-7')).status, 'checked-in');
  assert.equal(store.get().checkIn.at, Date.parse('2026-12-13T01:30:00Z'));
  assert.ok(store.get().quests.checkin);
});

test('deleting data removes the server copy first, and refuses while offline', async () => {
  const fake = chatFixture();
  const { backend } = setup(fake);
  await backend.start();
  fake.network = false;
  await backend.refresh();
  assert.match((await backend.deleteMyData()).error, /online/);
  assert.equal(fake.count('auth', 'signOut'), 0);
  fake.network = true;
  await backend.start();
  assert.deepEqual(await backend.deleteMyData(), {});
  assert.equal(fake.count('rpc', 'delete_my_data'), 1);
  assert.equal(fake.count('auth', 'signOut'), 1);
  assert.equal(backend.userId(), null);
  assert.ok(!fake.tables.profiles.some((row) => row.id === 'u-1'));
});

test('errors are told apart and explained in plain words', () => {
  assert.equal(isNetworkError({ message: 'TypeError: Failed to fetch' }), true);
  assert.equal(isNetworkError({ name: 'AuthRetryableFetchError', message: '' }), true);
  assert.equal(isNetworkError({ code: '23514', message: 'violates check constraint' }), false);
  assert.equal(friendly({ code: 'P0001', message: 'You are already in a team.' }), 'You are already in a team.');
  assert.equal(friendly({ code: '42501', message: 'new row violates row-level security policy' }), 'That is not allowed right now.');
  assert.match(friendly({ code: 'XX000', message: 'internal' }), /Something went wrong/);
});

test('without a project configured, the app stays on the device', async () => {
  const store = createStore({ storage: memory() });
  const backend = createBackend({ config: null, store });
  assert.equal(backend.status(), 'local');
  await backend.start();
  await backend.syncNow();
  assert.deepEqual(await backend.deleteMyData(), {});
  assert.equal(backend.status(), 'local');
});
