// App state, persisted on this device. Every update runs the quest engine so XP, levels and
// badges follow from what people have done. Storage can fail (private browsing, full disks), so
// the app keeps working in memory when it does.
import { applyProgress } from './game.js';

/** A check-in pass code like DC-7KQ4-M2XP, without look-alike characters. */
export function newPassCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const code = [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
  return `DC-${code.slice(0, 4)}-${code.slice(4)}`;
}

export const STORAGE_KEY = 'dragonconnector:v1';
export const SCHEMA_VERSION = 1;

export function initialState(now) {
  return {
    version: SCHEMA_VERSION,
    createdAt: now,
    welcomed: false,
    tourDone: false,
    preview: false,
    installed: false,
    format: 'A',
    passCode: null,
    // 'account': the builder's records sync to their Dragon Connector account. 'device': saved
    // before accounts were connected, so they stay here until the builder connects them.
    dataHome: 'account',
    eventSettings: null,
    profile: { name: '', email: '', role: '', skills: [], tracks: [], lookingFor: '', languages: [], formats: [], bio: '', github: '', discoverable: false },
    waitlist: null,
    registration: { status: 'none', step: 0, data: {}, updatedAt: null },
    checkIn: null,
    team: null,
    invitations: [],
    builders: [],
    threads: {},
    submission: { status: 'empty', data: {}, updatedAt: null, submittedAt: null },
    bookmarks: [],
    guidesRead: [],
    requirementsChecked: [],
    tasks: [],
    visited: {},
    quests: {},
  };
}

// Details typed before accounts were connected were promised to stay on the device.
const hasPersonalData = (saved) => Boolean(saved.profile?.name?.trim() || saved.waitlist || saved.team
  || (saved.registration?.status ?? 'none') !== 'none' || (saved.submission?.status ?? 'empty') !== 'empty'
  || Object.values(saved.threads ?? {}).some((thread) => ['dm', 'team'].includes(thread?.kind) && thread.messages?.some((message) => message.from === 'me')));

/** Fill in anything a saved state lacks, so older saves keep working as the app grows. */
export function migrate(saved, now) {
  const base = initialState(now);
  if (!saved || typeof saved !== 'object' || saved.version !== SCHEMA_VERSION) return base;
  const merged = { ...base, ...saved };
  for (const key of ['profile', 'registration', 'submission']) merged[key] = { ...base[key], ...(saved[key] ?? {}) };
  for (const key of ['bookmarks', 'guidesRead', 'requirementsChecked', 'tasks', 'invitations', 'builders']) if (!Array.isArray(merged[key])) merged[key] = [];
  for (const key of ['threads', 'visited', 'quests']) if (!merged[key] || typeof merged[key] !== 'object') merged[key] = {};
  if (!['account', 'device'].includes(saved.dataHome)) merged.dataHome = hasPersonalData(saved) ? 'device' : 'account';
  return merged;
}

export function createStore({ storage = null, now = () => Date.now(), onEvent = () => {} } = {}) {
  const listeners = new Set();
  let state = load();

  function load() {
    try {
      const saved = storage?.getItem(STORAGE_KEY);
      if (saved) return migrate(JSON.parse(saved), now());
    } catch { /* unreadable or blocked storage: start fresh */ }
    return initialState(now());
  }

  function persist() {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* keep going in memory */ }
  }

  return {
    get: () => state,
    /** Apply a change. Quiet updates save without re-rendering (for form drafts as people type). */
    update(change, { quiet = false } = {}) {
      const draft = structuredClone(state);
      change(draft);
      const events = applyProgress(draft, now());
      state = draft;
      persist();
      if (!quiet || events.length) listeners.forEach((listener) => listener(state));
      events.forEach((event) => onEvent(event));
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      state = initialState(now());
      try { storage?.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
      listeners.forEach((listener) => listener(state));
    },
  };
}
