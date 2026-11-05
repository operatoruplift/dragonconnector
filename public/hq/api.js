// HQ's connection to the event database. HQ has no Supabase account: it calls the hq_ functions with
// the public key and its own HQ session token, and every function checks that token and the staff
// member's role (supabase/migrations/20261105114515_hq.sql). The token stays in this browser until
// the staff member signs out or the session ends.
export const SESSION_KEY = 'dragonconnector:hq-session';

export class HqError extends Error {
  constructor(message, { ended = false, offline = false, code = '' } = {}) {
    super(message);
    Object.assign(this, { ended, offline, code });
  }
}

/** A sentence people can act on. The database's own exceptions are already written for people. */
export function explain(error) {
  if (error instanceof HqError) return error;
  const text = `${error?.name ?? ''} ${error?.message ?? ''}`;
  if (/Failed to fetch|NetworkError|Load failed|fetch failed|AbortError|timed? ?out/i.test(text)) return new HqError('You appear to be offline. Try again when you are back online.', { offline: true });
  if (error?.code === '28000') return new HqError(error.message || 'Your HQ session has ended. Sign in again.', { ended: true, code: '28000' });
  if (['P0001', '42501'].includes(error?.code) && error.message) return new HqError(error.message, { code: error.code });
  if (error?.code === 'PGRST202') return new HqError('HQ is not set up on the event database yet.', { code: error.code });
  return new HqError('Something went wrong. Try again in a moment.', { code: error?.code ?? '' });
}

export function createApi({ config, loadClient, storage, fetcher = (...args) => fetch(...args) }) {
  let client = null;
  const read = () => { try { return storage?.getItem(SESSION_KEY) ?? null; } catch { return null; } };
  const write = (value) => { try { if (value) storage?.setItem(SESSION_KEY, value); else storage?.removeItem(SESSION_KEY); } catch { /* storage blocked */ } };

  async function call(name, args = {}) {
    let result;
    try {
      // No account and no stored Supabase session: HQ never signs in to Supabase itself.
      client ??= (await loadClient())(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'dragonconnector:hq-auth' } });
      result = await client.rpc(name, args);
    } catch (error) {
      throw explain(error);
    }
    if (result.error) {
      const problem = explain(result.error);
      if (problem.ended) write(null);
      throw problem;
    }
    return result.data;
  }
  const withSession = (name, args = {}) => call(name, { session: read(), ...args });

  return {
    hasSession: () => Boolean(read()),
    /** The staff member, or null when the code is wrong. */
    async signIn(code) {
      const data = await call('hq_sign_in', { code });
      if (data?.status !== 'signed-in') return null;
      write(data.session);
      return data.staff;
    },
    async signOut() {
      const token = read();
      write(null);
      if (token) await call('hq_sign_out', { session: token }).catch(() => {});
    },
    me: () => withSession('hq_me'),
    event: () => withSession('hq_event'),
    projects: () => withSession('hq_projects'),
    score: (project, points, notes, conflict) => withSession('hq_score', {
      project, prototype_points: points.prototype, ux_points: points.ux, technical_points: points.technical, pitch_points: points.pitch, judge_notes: notes, has_conflict: conflict,
    }),
    pass: (pass) => withSession('hq_pass', { pass }),
    checkIn: (pass) => withSession('hq_check_in', { pass }),
    undoCheckIn: (pass) => withSession('hq_undo_check_in', { pass }),
    reply: (thread, reply) => withSession('hq_reply', { thread, reply }),
    announce: (message, publishAt) => withSession('hq_announce', { message, publish_at: publishAt }),
    editAnnouncement: (announcement, message, publishAt) => withSession('hq_edit_announcement', { announcement, message, publish_at: publishAt }),
    deleteAnnouncement: (announcement) => withSession('hq_delete_announcement', { announcement }),
    setSwitch: (setting, turnedOn) => withSession('hq_set_switch', { setting, turned_on: turnedOn }),
    setCheckInCode: (code) => withSession('hq_set_check_in_code', { code }),
    updateInquiry: (inquiry, status, notes) => withSession('hq_update_inquiry', { inquiry, inquiry_status: status, inquiry_notes: notes }),
    removeWaitlist: (entry) => withSession('hq_remove_waitlist', { entry }),
    addStaff: (name, role) => withSession('hq_add_staff', { staff_name: name, staff_role: role }),
    newCode: (member) => withSession('hq_new_code', { member }),
    revokeStaff: (member) => withSession('hq_revoke_staff', { member }),
    /** Whether builders can have accounts (Supabase anonymous sign-ins); null when unknown. */
    async builderAccounts() {
      try {
        const response = await fetcher(`${config.url}/auth/v1/settings`, { headers: { apikey: config.anonKey } });
        if (!response.ok) return null;
        return Boolean((await response.json())?.external?.anonymous_users);
      } catch {
        return null;
      }
    },
  };
}
