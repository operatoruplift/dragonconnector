// Live services through Supabase: an anonymous account per device, a copy of the builder's own
// records for the organizers, live messages, real teams and check-in.
//
// The device stays the source of truth for what the builder types (profile, pre-registration,
// submission and waitlist entry); the server keeps a copy, and it is the source of truth for
// check-in, conversations and teams. Browsing creates no account: one is made the first time there
// is something to save or someone to talk to. Offline, or with anonymous sign-ins switched off, the
// app keeps working on the device and catches up when it can. Row-level security in
// supabase/migrations decides what each account can reach; nothing here is trusted for that.
import { isWebUrl, SUBMISSION_CHECKS } from './validate.js';
import { newPassCode } from './store.js';
import { ROLES } from '../data/people.js';

export const threadIdFor = (conversationId) => `c-${conversationId}`;

const MESSAGE_COLUMNS = 'id, conversation_id, sender_id, from_organizers, body, created_at';
const PROFILE_COLUMNS = 'id, name, role, skills, tracks, looking_for, languages, formats, bio, github, discoverable';
const REGISTRATION_COLUMNS = 'user_id, name, email, phone, format, experience, dietary, access_needs, agrees_to_conduct, media_consent, status, pass_code, updated_at';
const SUBMISSION_COLUMNS = 'owner_id, team_id, name, tagline, track, description, stack, integration, repo_url, video_url, live_url, status, submitted_at, updated_at';
const TEAM_COLUMNS = 'id, name, track, open_roles, owner_id, conversation_id, created_at';

const PROFILE_FIELDS = ['id', 'name', 'role', 'skills', 'tracks', 'looking_for', 'languages', 'formats', 'bio', 'github', 'discoverable'];
const REGISTRATION_FIELDS = ['user_id', 'name', 'email', 'phone', 'format', 'experience', 'dietary', 'access_needs', 'agrees_to_conduct', 'media_consent', 'status', 'pass_code'];
const SUBMISSION_FIELDS = ['owner_id', 'team_id', 'name', 'tagline', 'track', 'description', 'stack', 'integration', 'repo_url', 'video_url', 'live_url', 'status', 'submitted_at'];
const LABELS = { profile: 'Your profile', registration: 'Your pre-registration', submission: 'Your submission' };

const trimmed = (value) => String(value ?? '').trim();
const webUrl = (value, max) => (isWebUrl(trimmed(value)) && trimmed(value).length <= max ? trimmed(value) : null);
const shortItems = (list, max, count) => (list ?? []).map(trimmed).filter((item) => item && item.length <= max).slice(0, count);
const roleLabel = (id) => ROLES.find((role) => role.id === id)?.label ?? '';

// Payloads: the builder's records as the database stores them, or null while they are incomplete.
// They respect the table constraints, so a half-typed draft never fails to save.

export function profilePayload(profile, userId) {
  const name = trimmed(profile.name);
  if (name.length < 2 || name.length > 60 || !profile.role || !profile.lookingFor) return null;
  return {
    id: userId,
    name,
    role: profile.role,
    skills: shortItems(profile.skills, 40, 12),
    tracks: profile.tracks ?? [],
    looking_for: profile.lookingFor,
    languages: shortItems(profile.languages, 30, 8),
    formats: profile.formats ?? [],
    bio: trimmed(profile.bio).slice(0, 280),
    github: webUrl(profile.github, 200),
    discoverable: Boolean(profile.discoverable),
  };
}

export function registrationPayload(state, userId) {
  const { status, data } = state.registration;
  if (!['pre-registered', 'registered'].includes(status) || !data.conduct || !data.format || !data.experience || !data.media || !state.passCode) return null;
  return {
    user_id: userId,
    name: trimmed(data.name),
    email: trimmed(data.email),
    phone: trimmed(data.phone).replace(/\s+/g, ' ') || null,
    format: data.format,
    experience: data.experience,
    dietary: trimmed(data.dietary) || null,
    access_needs: trimmed(data.access) || null,
    agrees_to_conduct: true,
    media_consent: data.media === 'yes',
    status,
    pass_code: state.passCode,
  };
}

export function submissionPayload(state, userId) {
  const { status, data = {}, submittedAt, preview } = state.submission;
  const name = trimmed(data.name);
  if (status === 'empty' || name.length < 2) return null;
  // A submission made in preview mode stays a draft for the organizers.
  const final = status === 'submitted' && !preview;
  return {
    owner_id: userId,
    team_id: state.team?.remote ? state.team.id : null,
    name: name.slice(0, 60),
    tagline: trimmed(data.tagline).slice(0, 120) || null,
    track: data.track || null,
    description: trimmed(data.description).slice(0, 2000) || null,
    stack: shortItems(data.stack, 40, 12),
    integration: trimmed(data.solana).slice(0, 800) || null,
    repo_url: webUrl(data.repo, 300),
    video_url: webUrl(data.video, 300),
    live_url: webUrl(data.live, 300),
    status: final ? 'submitted' : 'draft',
    submitted_at: final ? new Date(submittedAt).toISOString() : null,
  };
}

const hasAccountData = (state) => Boolean(profilePayload(state.profile, '') || registrationPayload(state, '')
  || submissionPayload(state, '') || (state.team && !state.team.remote));

/** A stable fingerprint of a payload or a row, so only changes are written. */
export function fingerprint(record, fields) {
  return JSON.stringify(fields.map((field) => {
    const value = record?.[field] ?? null;
    return field.endsWith('_at') && typeof value === 'string' ? Date.parse(value) : value;
  }));
}

// Rows from the database, in the shapes the app keeps.

export const builderFromRow = (row) => ({
  id: row.id,
  name: row.name,
  role: row.role,
  skills: row.skills ?? [],
  tracks: row.tracks ?? [],
  lookingFor: row.looking_for,
  languages: row.languages ?? [],
  formats: row.formats ?? [],
  bio: row.bio ?? '',
  github: row.github ?? '',
});

function profileFromRow(row) {
  const { id, ...profile } = builderFromRow(row);
  return { ...profile, discoverable: Boolean(row.discoverable) };
}

const registrationFromRow = (row) => ({
  status: row.status,
  step: 0,
  updatedAt: Date.parse(row.updated_at),
  data: {
    name: row.name, email: row.email, phone: row.phone ?? '', format: row.format, experience: row.experience,
    dietary: row.dietary ?? '', access: row.access_needs ?? '', conduct: row.agrees_to_conduct, media: row.media_consent ? 'yes' : 'no', data: true,
  },
});

const submissionFromRow = (row) => ({
  status: row.status,
  updatedAt: Date.parse(row.updated_at),
  submittedAt: row.submitted_at ? Date.parse(row.submitted_at) : null,
  preview: false,
  data: {
    name: row.name, tagline: row.tagline ?? '', track: row.track ?? '', description: row.description ?? '', stack: row.stack ?? [],
    solana: row.integration ?? '', repo: row.repo_url ?? '', video: row.video_url ?? '', live: row.live_url ?? '',
    checks: row.status === 'submitted' ? SUBMISSION_CHECKS.map((check) => check.id) : [],
  },
});

export function teamFromRows(team, roster, people, userId, myName) {
  const members = roster.map((row) => {
    const person = people.find((item) => item.id === row.user_id);
    const me = row.user_id === userId;
    return { id: row.user_id, me, status: row.status, name: me ? myName || 'You' : person?.name ?? 'Invited builder', role: person?.role ?? '' };
  });
  members.sort((a, b) => Number(b.me) - Number(a.me) || Number(a.status === 'invited') - Number(b.status === 'invited'));
  return {
    remote: true,
    id: team.id,
    name: team.name,
    track: team.track,
    openRoles: team.open_roles ?? [],
    owner: team.owner_id === userId,
    conversationId: team.conversation_id,
    threadId: threadIdFor(team.conversation_id),
    createdAt: Date.parse(team.created_at),
    members,
  };
}

// Messages and threads.

export function toMessage(row, userId) {
  return {
    id: row.id,
    from: row.from_organizers ? 'organizers' : row.sender_id && row.sender_id === userId ? 'me' : row.sender_id ?? 'former',
    at: Date.parse(row.created_at),
    text: row.body,
  };
}

const unsent = (message) => message.pending || message.failed;

/** Settled messages in time order, then the ones still being sent. */
function order(thread) {
  const settled = thread.messages.filter((message) => !unsent(message)).sort((a, b) => a.at - b.at);
  thread.messages = [...settled, ...thread.messages.filter(unsent)];
}

/** Add a server message once; it replaces our own copy that was still being sent. True when new. */
export function mergeMessage(thread, message) {
  const index = thread.messages.findIndex((item) => item.id === message.id);
  if (index >= 0) {
    if (unsent(thread.messages[index])) thread.messages[index] = message;
    order(thread);
    return false;
  }
  thread.messages.push(message);
  order(thread);
  return true;
}

export const latestAt = (thread) => thread.messages.reduce((latest, message) => (unsent(message) ? latest : Math.max(latest, message.at)), 0);
export const countUnread = (thread) => thread.messages.filter((message) => !['me', 'system'].includes(message.from) && !unsent(message) && message.at > (thread.readAt ?? 0)).length;

function markRead(thread) {
  thread.readAt = Math.max(thread.readAt ?? 0, latestAt(thread));
  thread.unread = 0;
}

function announcementsThread(draft) {
  draft.threads.announcements ??= { id: 'announcements', kind: 'announcements', readOnly: true, unread: 0, messages: [] };
  return Object.assign(draft.threads.announcements, { title: 'Announcements', subtitle: 'From the organizers' });
}

/** Replace the announcements with the organizers' published list, counting what is new. */
export function mergeAnnouncements(thread, rows, viewing = false) {
  // The thread a device started with: everything shown so far counts as read once it was opened.
  if (thread.readAt == null) thread.readAt = thread.unread ? 0 : thread.messages.reduce((latest, message) => Math.max(latest, message.at), 0);
  thread.messages = rows.map((row) => ({ id: `s${row.id}`, from: 'organizers', at: Date.parse(row.published_at), text: row.body }));
  if (viewing) markRead(thread);
  else thread.unread = countUnread(thread);
}

function describe(kind, people, team) {
  if (kind === 'organizers') return { title: 'Ask the organizers', subtitle: 'Your private line to the organizer team' };
  if (kind === 'team') return { title: team ? `Team ${team.name}` : 'Team chat', subtitle: 'Your team chat' };
  const other = Object.values(people)[0];
  return other ? { title: other.name, subtitle: roleLabel(other.role) } : { title: 'Builder', subtitle: 'No longer on Dragon Connector' };
}

// Errors.

export function isNetworkError(error) {
  if (!error) return false;
  if (error.name === 'AuthRetryableFetchError') return true;
  return /Failed to fetch|NetworkError|Load failed|fetch failed|FetchError|AbortError|timed? ?out/i.test(`${error.name ?? ''} ${error.message ?? ''}`);
}

/** A message people can act on. The database's own exceptions are already written for people. */
export function friendly(error) {
  if (!error) return '';
  if (isNetworkError(error)) return 'You appear to be offline. Try again when you are back online.';
  const message = String(error.message ?? '');
  if (error.code === 'P0001' && message) return message;
  if (error.code === '42501' || /row-level security|permission denied/i.test(message)) return 'That is not allowed right now.';
  if (['23514', '23502', '22P02', '22001'].includes(error.code)) return 'Some of these details were not accepted. Check them and try again.';
  return 'Something went wrong. Try again in a moment.';
}

function accountProblem(error) {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`;
  if (/anonymous_provider_disabled|anonymous sign-?ins are disabled/i.test(text)) return 'Accounts are not switched on yet.';
  if (error?.status === 429 || /rate limit|too many/i.test(text)) return 'Too many new accounts from this network right now. Try again in a few minutes.';
  return 'Accounts are not available right now.';
}

async function many(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function one(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data ?? null;
}

const offlineError = () => new TypeError('Failed to fetch (offline)');

/**
 * Connect the store to Supabase. Statuses: 'local' (no project configured), 'connecting', 'ready'
 * (reachable, no account yet), 'live' (signed in), 'guest' (reachable, but no account can be made)
 * and 'offline'.
 */
export function createBackend({
  config, loadClient, store,
  viewing = () => null,
  notify = () => {},
  onChange = () => {},
  now = () => Date.now(),
  online = () => true,
  uuid = () => crypto.randomUUID(),
} = {}) {
  let client = null;
  let userId = null;
  let status = config ? 'connecting' : 'local';
  let problem = '';
  let blockedUntil = 0; // anonymous sign-in was refused: wait before asking again
  let loaded = false; // this account's records, team and conversations have been read
  let starting = null;
  let signingIn = null;
  let syncing = null;
  let syncAgain = false;
  let syncTimer = null;
  let refreshTimer = null;
  let channel = null;
  let channelKey = null;
  let channels = 0;
  let lastRefresh = 0;
  let lastBuilders = -Infinity;
  const server = {}; // fingerprints of the builder's records as the server holds them
  const rejected = {}; // payloads the server refused, so they are not resent until they change
  const inflight = new Set(); // messages being sent right now
  const told = new Set(); // notices already shown, so background retries stay quiet

  const update = (change) => store.update(change);
  const accountMode = () => store.get().dataHome === 'account';
  const blocked = () => blockedUntil > now();

  function setStatus(next, reason = '') {
    if (status === next && problem === reason) return;
    status = next;
    problem = reason;
    onChange(status);
  }

  function tell(key, text, title) {
    if (told.has(`${key}|${text}`)) return;
    told.add(`${key}|${text}`);
    notify(text, title);
  }

  function lost(error) {
    if (isNetworkError(error)) setStatus('offline');
    else console.warn('Dragon Connector services:', error);
  }

  async function getClient() {
    if (client) return client;
    const createClient = await loadClient();
    client = createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'dragonconnector:auth' },
    });
    client.auth.onAuthStateChange((event, session) => {
      // Only note a sign-out here: Supabase must not be called from inside this callback.
      if (!session?.user && userId) {
        userId = null;
        loaded = false;
        setStatus(blocked() ? 'guest' : 'ready', problem);
      }
    });
    return client;
  }

  async function start() {
    if (!config) return undefined;
    if (starting) return starting;
    starting = (async () => {
      if (status !== 'live') setStatus('connecting');
      try {
        if (!online()) throw offlineError();
        await getClient();
        await loadPublic();
        if (userId) {
          setStatus('live');
          await refreshMine(); // catch up, and resend anything written while offline
        } else {
          const { data, error } = await client.auth.getSession();
          if (error && isNetworkError(error)) throw error;
          userId = data?.session?.user?.id ?? null;
          if (userId) await connected();
          else setStatus(blocked() ? 'guest' : 'ready', blocked() ? problem : '');
        }
        subscribe();
      } catch (error) {
        setStatus('offline', isNetworkError(error) ? '' : friendly(error));
      }
      syncSoon(0);
    })().finally(() => { starting = null; }); // cleared after it is set, even when nothing was awaited
    return starting;
  }

  async function connected({ fresh = false } = {}) {
    setStatus('live');
    loaded = false;
    for (const key of Object.keys(server)) delete server[key];
    subscribe();
    if (fresh) {
      // A brand-new account holds nothing yet, so there is nothing to read back; anything kept
      // from an account this device used before no longer applies.
      Object.assign(server, { profile: null, registration: null, submission: null });
      loaded = true;
      const state = store.get();
      if (state.team?.remote || state.invitations.length || Object.values(state.threads).some((thread) => thread.remote)) {
        update((draft) => {
          for (const [id, thread] of Object.entries(draft.threads)) if (thread.remote) delete draft.threads[id];
          if (draft.team?.remote) draft.team = null;
          draft.invitations = [];
        });
      }
    } else if (accountMode()) {
      await refreshMine();
    }
    syncSoon(0);
  }

  async function ensureSession({ force = false } = {}) {
    if (userId) return true;
    if (!config) return false;
    if (starting) await starting;
    if (force && !client) await start();
    if (userId) return true;
    if (!client || ((status === 'offline' || blocked()) && !force)) return false;
    signingIn ??= (async () => {
      setStatus('connecting');
      try {
        const { data, error } = await client.auth.signInAnonymously();
        if (error) throw error;
        userId = data?.user?.id ?? data?.session?.user?.id ?? null;
        if (!userId) throw new Error('No account was returned.');
        blockedUntil = 0;
      } catch (error) {
        if (isNetworkError(error)) setStatus('offline');
        else {
          blockedUntil = now() + 5 * 60 * 1000;
          setStatus('guest', accountProblem(error));
        }
        return false;
      }
      try {
        await connected({ fresh: true });
      } catch (error) {
        lost(error);
      }
      return true;
    })().finally(() => { signingIn = null; });
    return signingIn;
  }

  // Public information: the organizers' switches and announcements.
  async function loadPublic() {
    const [settings, announcements] = await Promise.all([
      one(client.from('event_settings').select('registration_open, check_in_open, submissions_open').maybeSingle()),
      many(client.from('announcements').select('id, body, published_at').order('published_at', { ascending: true }).limit(100)),
    ]);
    update((draft) => {
      if (settings) draft.eventSettings = { registrationOpen: settings.registration_open, checkInOpen: settings.check_in_open, submissionsOpen: settings.submissions_open };
      mergeAnnouncements(announcementsThread(draft), announcements, viewing() === 'announcements');
    });
  }

  // Everything this account holds: the builder's own records, then the team and conversations.
  async function refreshMine() {
    if (!userId || !accountMode()) return;
    await pullMine();
    await refreshTeam();
    await refreshConversations();
    loaded = true;
  }

  // A device that was reset, or a returning builder, gets their records back; otherwise what the
  // device holds is newer, and the next sync writes it.
  async function pullMine() {
    const [profile, registration, submission, checkIn] = await Promise.all([
      one(client.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle()),
      one(client.from('registrations').select(REGISTRATION_COLUMNS).eq('user_id', userId).maybeSingle()),
      one(client.from('submissions').select(SUBMISSION_COLUMNS).eq('owner_id', userId).maybeSingle()),
      one(client.from('check_ins').select('checked_in_at').eq('user_id', userId).maybeSingle()),
    ]);
    update((draft) => {
      if (profile && !trimmed(draft.profile.name)) Object.assign(draft.profile, profileFromRow(profile));
      if (registration && ['none', 'draft'].includes(draft.registration.status)) {
        draft.registration = registrationFromRow(registration);
        draft.passCode = registration.pass_code;
      }
      if (submission && draft.submission.status === 'empty') draft.submission = submissionFromRow(submission);
      if (checkIn) draft.checkIn = { at: Date.parse(checkIn.checked_in_at), method: 'code', preview: false };
    });
    server.profile = profile ? fingerprint(profile, PROFILE_FIELDS) : null;
    server.registration = registration ? fingerprint(registration, REGISTRATION_FIELDS) : null;
    server.submission = submission ? fingerprint(submission, SUBMISSION_FIELDS) : null;
  }

  async function refreshTeam() {
    if (!userId || !accountMode()) return;
    const mine = await many(client.from('team_members').select('team_id, status').eq('user_id', userId));
    const ids = mine.map((row) => row.team_id);
    const teams = ids.length ? await many(client.from('teams').select(TEAM_COLUMNS).in('id', ids)) : [];
    const joined = teams.find((team) => mine.some((row) => row.team_id === team.id && row.status === 'joined'));
    let roster = [];
    let people = [];
    if (joined) {
      roster = await many(client.from('team_members').select('user_id, status').eq('team_id', joined.id));
      const others = roster.map((row) => row.user_id).filter((id) => id !== userId);
      if (others.length) people = await many(client.from('profiles').select('id, name, role').in('id', others));
    }
    update((draft) => {
      if (joined) {
        draft.team = teamFromRows(joined, roster, people, userId, trimmed(draft.profile.name));
        // A team made on this device before it went live: keep any notes typed in its chat.
        const local = draft.threads.team;
        if (local && !local.remote) {
          if (local.messages.some((message) => message.from === 'me')) Object.assign(local, { kind: 'notes', title: 'Team notes', subtitle: 'Saved on this device' });
          else delete draft.threads.team;
        }
      } else if (draft.team?.remote) {
        draft.team = null;
      }
      draft.invitations = mine.filter((row) => row.status === 'invited')
        .map((row) => teams.find((team) => team.id === row.team_id)).filter(Boolean)
        .map((team) => ({ teamId: team.id, name: team.name, track: team.track, openRoles: team.open_roles ?? [] }));
    });
  }

  async function refreshConversations() {
    if (!userId || !accountMode()) return;
    const mine = await many(client.from('conversation_members').select('conversation_id, conversations(kind)').eq('user_id', userId));
    const ids = mine.map((row) => row.conversation_id);
    let members = [];
    let messages = [];
    let teams = [];
    let people = [];
    if (ids.length) {
      [members, messages, teams] = await Promise.all([
        many(client.from('conversation_members').select('conversation_id, user_id').in('conversation_id', ids)),
        many(client.from('messages').select(MESSAGE_COLUMNS).in('conversation_id', ids).order('created_at', { ascending: false }).limit(500)),
        many(client.from('teams').select('name, conversation_id').in('conversation_id', ids)),
      ]);
      const others = [...new Set(members.map((row) => row.user_id))].filter((id) => id !== userId);
      if (others.length) people = await many(client.from('profiles').select('id, name, role').in('id', others));
    }
    const resend = [];
    update((draft) => {
      for (const [id, thread] of Object.entries(draft.threads)) if (thread.remote && !ids.includes(thread.conversationId)) delete draft.threads[id];
      for (const row of mine) {
        const id = threadIdFor(row.conversation_id);
        const kind = row.conversations?.kind ?? 'direct';
        const thread = draft.threads[id] ?? { id, remote: true, conversationId: row.conversation_id, kind, unread: 0, readAt: 0, messages: [] };
        const others = members.filter((member) => member.conversation_id === row.conversation_id && member.user_id !== userId);
        thread.people = Object.fromEntries(others.map(({ user_id: other }) => {
          const person = people.find((item) => item.id === other);
          return [other, { name: person?.name ?? 'Builder', role: person?.role ?? '' }];
        }));
        Object.assign(thread, describe(kind, thread.people, teams.find((team) => team.conversation_id === row.conversation_id)));
        const settled = messages.filter((message) => message.conversation_id === row.conversation_id).reverse().map((message) => toMessage(message, userId));
        const waiting = thread.messages.filter((message) => unsent(message) && !settled.some((item) => item.id === message.id));
        for (const message of waiting) if (message.pending && !inflight.has(message.id)) resend.push([id, message.id, message.text]);
        thread.messages = [...settled, ...waiting];
        if (viewing() === id) markRead(thread);
        else thread.unread = countUnread(thread);
        draft.threads[id] = thread;
      }
    });
    for (const [threadId, messageId, text] of resend) deliver(threadId, messageId, text);
  }

  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      refreshConversations().catch(lost);
    }, 300);
  }

  // Live updates. Realtime applies row-level security, so only readable rows arrive.
  function subscribe() {
    const key = userId ?? 'guest';
    if (!client?.channel || channelKey === key) return;
    if (channel) client.removeChannel(channel);
    channelKey = key;
    channels += 1;
    channel = client.channel(`dragonconnector-${channels}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (change) => receive(change.new))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (change) => receiveAnnouncement(change.new))
      .subscribe();
  }

  function receive(row) {
    const threadId = threadIdFor(row.conversation_id);
    const known = store.get().threads[threadId];
    if (!known) {
      refreshSoon(); // a new conversation, or a team just joined
      return;
    }
    const message = toMessage(row, userId);
    if (!['me', 'organizers', 'former'].includes(message.from) && !known.people?.[message.from]) refreshSoon(); // a new team member
    update((draft) => {
      const thread = draft.threads[threadId];
      if (!thread) return;
      const added = mergeMessage(thread, message);
      if (viewing() === threadId) markRead(thread);
      else if (added && message.from !== 'me') thread.unread = (thread.unread || 0) + 1;
    });
  }

  function receiveAnnouncement(row) {
    update((draft) => {
      const thread = announcementsThread(draft);
      if (!mergeMessage(thread, { id: `s${row.id}`, from: 'organizers', at: Date.parse(row.published_at), text: row.body })) return;
      if (viewing() === 'announcements') markRead(thread);
      else thread.unread = (thread.unread || 0) + 1;
    });
  }

  // Sync: send what changed on the device. One run at a time; a request made during a run starts
  // another when it finishes.

  async function write(key, payload, fields, send) {
    if (!payload) return;
    const print = fingerprint(payload, fields);
    if (server[key] === print || rejected[key] === print) return;
    const { error } = await send(payload);
    if (!error) {
      server[key] = print;
      delete rejected[key];
      return;
    }
    if (isNetworkError(error)) throw error;
    if (key === 'registration' && error.code === '23505') {
      update((draft) => { draft.passCode = newPassCode(); }); // that pass code is taken: issue another
      return;
    }
    rejected[key] = print;
    tell(key, `${LABELS[key]} was not saved to your account. ${friendly(error)}`, 'Not synced');
  }

  async function pushTeam() {
    const team = store.get().team;
    if (!team || team.remote) return;
    const print = JSON.stringify([team.name, team.track, team.openRoles]);
    if (rejected.team === print) return;
    if (!server.profile) {
      tell('team', 'Complete your profile to make your team live. Until then it is saved on this device.', 'Team');
      return;
    }
    const { error } = await client.rpc('create_team', { team_name: team.name, team_track: team.track, roles_needed: team.openRoles ?? [] });
    if (error) {
      if (isNetworkError(error)) throw error;
      rejected.team = print;
      tell('team', `Your team was not saved to your account. ${friendly(error)}`, 'Not synced');
      return;
    }
    await refreshTeam();
    await refreshConversations();
  }

  async function syncWaitlist() {
    const entry = store.get().waitlist;
    if (!entry || entry.sent || !(entry.consented || accountMode())) return;
    const print = JSON.stringify([entry.name, entry.email, entry.role, entry.track]);
    if (rejected.waitlist === print) return;
    await ensureSession(); // links the entry to this account, so it can be removed later; it is sent either way
    if (userId && entry.replace) {
      const { error } = await client.rpc('leave_waitlist');
      if (error && isNetworkError(error)) throw error;
    }
    const { error } = await client.rpc('join_waitlist', { entry_name: entry.name, entry_email: entry.email, entry_role: entry.role, entry_track: entry.track || null });
    if (error) {
      if (isNetworkError(error)) throw error;
      rejected.waitlist = print;
      tell('waitlist', `Your waitlist entry was not sent. ${friendly(error)}`, 'Not sent');
      return;
    }
    update((draft) => {
      if (draft.waitlist?.email !== entry.email) return;
      draft.waitlist.sent = true;
      draft.waitlist.linked = Boolean(userId);
      delete draft.waitlist.replace;
    });
  }

  async function syncOnce() {
    if (starting) await starting;
    if (!client || status === 'offline') return;
    await syncWaitlist();
    if (!accountMode() || !hasAccountData(store.get())) return;
    if (!(await ensureSession())) return;
    if (!loaded) await refreshMine();
    await write('profile', profilePayload(store.get().profile, userId), PROFILE_FIELDS, (payload) => client.from('profiles').upsert(payload));
    await write('registration', registrationPayload(store.get(), userId), REGISTRATION_FIELDS, (payload) => client.from('registrations').upsert(payload));
    await pushTeam();
    await write('submission', submissionPayload(store.get(), userId), SUBMISSION_FIELDS, (payload) => client.from('submissions').upsert(payload));
  }

  function syncNow() {
    if (!config) return Promise.resolve();
    if (syncing) {
      syncAgain = true;
      return syncing;
    }
    syncing = (async () => {
      do {
        syncAgain = false;
        try {
          await syncOnce();
        } catch (error) {
          lost(error);
        }
      } while (syncAgain);
    })().finally(() => { syncing = null; });
    return syncing;
  }

  function syncSoon(delay = 800) {
    if (!config) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      syncNow();
    }, delay);
  }

  /**
   * Catch up after the app was in the background or the connection returned (full), or check for
   * team changes, which have no live updates (light). A light check becomes a full one every five
   * minutes, in case live updates dropped without notice.
   */
  async function refresh({ full = true } = {}) {
    if (!config || status === 'connecting') return undefined;
    if (!client || ['offline', 'guest'].includes(status)) return starting ?? start();
    const catchUp = full || now() - lastRefresh > 5 * 60 * 1000;
    if (catchUp && now() - lastRefresh < 15000) return undefined;
    try {
      if (catchUp) {
        lastRefresh = now();
        await loadPublic();
      }
      if (userId && accountMode()) {
        await refreshTeam();
        if (catchUp) await refreshConversations();
      }
    } catch (error) {
      lost(error);
    }
    return undefined;
  }

  async function refreshBuilders({ force = false } = {}) {
    if (!config || !accountMode()) return;
    if (!force && now() - lastBuilders < 30000) return;
    lastBuilders = now();
    if (!(await ensureSession())) return;
    try {
      const list = await many(client.from('profiles').select(PROFILE_COLUMNS).eq('discoverable', true).neq('id', userId).order('updated_at', { ascending: false }).limit(200));
      update((draft) => { draft.builders = list.map(builderFromRow); });
    } catch (error) {
      lost(error);
    }
  }

  // Actions people take. Each answers { error } with a sentence to show, or what it produced.

  function unavailable() {
    if (status === 'offline') return 'You are offline. Try again when you are back online.';
    return problem || 'Accounts are not available right now.';
  }

  async function call(name, args) {
    if (!(await ensureSession({ force: true }))) return { error: unavailable() };
    const { data, error } = await client.rpc(name, args);
    if (error) {
      if (isNetworkError(error)) setStatus('offline');
      return { error: friendly(error) };
    }
    return { data };
  }

  async function openDirect(builderId) {
    await syncNow(); // a conversation needs this builder's profile on the server first
    const { data, error } = await call('start_direct', { other: builderId });
    if (error) return { error };
    await refreshConversations().catch(lost);
    return { threadId: threadIdFor(data) };
  }

  async function organizerChat() {
    const { data, error } = await call('organizer_conversation');
    if (error) return { error };
    await refreshConversations().catch(lost);
    return { threadId: threadIdFor(data) };
  }

  async function invite(builderId) {
    const team = store.get().team;
    if (!team?.remote) return { error: 'Your team is not live yet.' };
    const { error } = await call('invite_to_team', { team: team.id, invitee: builderId });
    if (error) return { error };
    await refreshTeam().catch(lost);
    return {};
  }

  async function respond(teamId, accept) {
    const { error } = await call('respond_to_invitation', { team: teamId, accept });
    if (error) return { error };
    await refreshTeam().catch(lost);
    await refreshConversations().catch(lost);
    return {};
  }

  async function leaveTeam() {
    const team = store.get().team;
    if (!team?.remote) return { error: 'Your team is not live.' };
    const { error } = await call('leave_team', { team: team.id });
    if (error) return { error };
    await refreshTeam().catch(lost);
    await refreshConversations().catch(lost);
    return {};
  }

  async function checkIn(code) {
    const { data, error } = await call('check_in', { code });
    if (error) return { status: 'error', message: error };
    if (data?.status === 'checked-in') update((draft) => { draft.checkIn = { at: Date.parse(data.checked_in_at), method: 'code', preview: false }; });
    return data ?? { status: 'error', message: 'The check-in service did not answer.' };
  }

  async function leaveWaitlist() {
    if (!store.get().waitlist?.linked) return { removed: false };
    const { error } = await call('leave_waitlist');
    return error ? { error } : { removed: true };
  }

  async function deliver(threadId, id, text) {
    const conversationId = store.get().threads[threadId]?.conversationId;
    if (!conversationId || inflight.has(id) || !userId || status === 'offline') return; // stays queued until reconnecting
    inflight.add(id);
    try {
      const { data, error } = await client.from('messages').insert({ id, conversation_id: conversationId, body: text }).select(MESSAGE_COLUMNS).single();
      if (error && error.code !== '23505') { // 23505: this message already arrived
        if (isNetworkError(error)) setStatus('offline');
        else update((draft) => {
          const message = draft.threads[threadId]?.messages.find((item) => item.id === id);
          if (message) Object.assign(message, { pending: false, failed: friendly(error) });
        });
        return;
      }
      update((draft) => {
        const thread = draft.threads[threadId];
        if (!thread) return;
        const message = thread.messages.find((item) => item.id === id);
        if (data) mergeMessage(thread, toMessage(data, userId));
        else if (message) {
          Object.assign(message, { pending: false, failed: false });
          order(thread);
        }
      });
    } finally {
      inflight.delete(id);
    }
  }

  function sendMessage(threadId, text) {
    const id = uuid();
    update((draft) => {
      const thread = draft.threads[threadId];
      if (!thread) return;
      thread.messages.push({ id, from: 'me', at: now(), text, pending: true });
      thread.draft = '';
    });
    return deliver(threadId, id, text);
  }

  function retryMessage(threadId, id) {
    const message = store.get().threads[threadId]?.messages.find((item) => item.id === id);
    if (!message) return undefined;
    update((draft) => {
      const target = draft.threads[threadId]?.messages.find((item) => item.id === id);
      if (target) Object.assign(target, { pending: true, failed: false });
    });
    if (status === 'offline') return start();
    return deliver(threadId, id, message.text);
  }

  /** Details saved before accounts were connected sync once the builder agrees. */
  async function connectDetails() {
    update((draft) => { draft.dataHome = 'account'; });
    if (userId && !loaded) await refreshMine().catch(lost);
    await syncNow();
  }

  /** Delete this builder's copy on the server and sign out; the caller then clears the device. */
  async function deleteMyData() {
    if (!config) return {};
    if (starting) await starting;
    const needOnline = 'You need to be online to delete the copy in your Dragon Connector account. Try again when you are back online.';
    if (!client || status === 'offline') return { error: needOnline };
    if (userId) {
      const { error } = await client.rpc('delete_my_data');
      if (error) return { error: isNetworkError(error) ? needOnline : friendly(error) };
    }
    if (channel) client.removeChannel(channel);
    channel = null;
    channelKey = null;
    await client.auth.signOut({ scope: 'local' }).catch(() => {});
    userId = null;
    loaded = false;
    setStatus('ready');
    return {};
  }

  function stop() {
    clearTimeout(syncTimer);
    clearTimeout(refreshTimer);
    if (channel) client?.removeChannel(channel);
    channel = null;
    channelKey = null;
  }

  if (config) store.subscribe(() => syncSoon());

  return {
    configured: Boolean(config),
    status: () => status,
    problem: () => problem,
    userId: () => userId,
    start,
    refresh,
    stop,
    syncNow,
    syncSoon,
    refreshBuilders,
    connectDetails,
    sendMessage,
    retryMessage,
    openDirect,
    organizerChat,
    invite,
    respond,
    leaveTeam,
    checkIn,
    leaveWaitlist,
    deleteMyData,
  };
}
