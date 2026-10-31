// An in-memory stand-in for the parts of supabase-js the app uses. It answers like the real client
// ({ data, error }, PostgREST and auth error shapes) and imitates the database functions in
// supabase/migrations closely enough to test the app's behaviour without a network.

const nowIso = () => new Date().toISOString();

export function fakeSupabase({ session = null, anonymous = 'enabled', network = true } = {}) {
  const tables = {
    event_settings: [{ registration_open: false, check_in_open: false, submissions_open: false }],
    announcements: [
      { id: 1, body: 'Dragon Connector is in planning.', published_at: '2026-10-30T02:00:00+00:00' },
      { id: 2, body: 'Registration is not open.', published_at: '2026-10-30T02:02:00+00:00' },
    ],
    waitlist: [], profiles: [], registrations: [], submissions: [], check_ins: [],
    conversations: [], conversation_members: [], messages: [], teams: [], team_members: [],
  };
  const fake = { tables, log: [], network, anonymous, hooks: {}, rpcs: {}, channels: new Set() };
  const listeners = new Set();
  let current = session;
  let ids = 0;
  const newId = (prefix) => `${prefix}-${(ids += 1)}`;
  const me = () => current?.user?.id ?? null;
  const PK = { profiles: 'id', registrations: 'user_id', submissions: 'owner_id', check_ins: 'user_id', messages: 'id', waitlist: 'email' };
  const offline = () => ({ data: null, error: { message: 'TypeError: Failed to fetch', details: '', hint: '', code: '' }, status: 0 });
  const raise = (message) => ({ data: null, error: { code: 'P0001', message, details: null, hint: null } });
  const defaults = (table) => ({
    messages: { sender_id: me(), from_organizers: false, created_at: nowIso() },
    profiles: { updated_at: nowIso() },
    registrations: { updated_at: nowIso() },
    submissions: { updated_at: nowIso() },
  })[table] ?? {};

  fake.count = (kind, name) => fake.log.filter(([k, n]) => k === kind && (name === undefined || n === name)).length;
  fake.signedIn = () => me();
  /** Answer as this user (or signed out), for driving the fake from another client such as a browser. */
  fake.act = (userId) => { current = userId ? { user: { id: userId } } : null; };

  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.mode = 'select';
      this.columns = '*';
    }

    select(columns = '*') { if (this.mode === 'select') this.columns = columns; return this; }
    eq(column, value) { this.filters.push((row) => row[column] === value); return this; }
    neq(column, value) { this.filters.push((row) => row[column] !== value); return this; }
    in(column, values) { this.filters.push((row) => values.includes(row[column])); return this; }
    order(column, { ascending = true } = {}) { this.sort = { column, ascending }; return this; }
    limit(count) { this.max = count; return this; }
    maybeSingle() { this.one = true; return this; }
    single() { this.one = true; return this; }
    upsert(payload) { this.mode = 'upsert'; this.payload = payload; return this; }
    insert(payload) { this.mode = 'insert'; this.payload = payload; return this; }
    then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve, reject); }

    run() {
      fake.log.push([this.mode, this.table, this.payload ?? null]);
      if (!fake.network) return offline();
      const rows = tables[this.table];
      if (this.mode !== 'select') {
        const refused = fake.hooks[`${this.mode}:${this.table}`]?.(this.payload);
        if (refused) return { data: null, error: refused };
        const key = PK[this.table];
        const index = rows.findIndex((row) => row[key] === this.payload[key]);
        if (this.mode === 'insert' && index >= 0) return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
        const row = { ...defaults(this.table), ...(index >= 0 ? rows[index] : {}), ...this.payload };
        if (index >= 0) rows[index] = row;
        else rows.push(row);
        return { data: this.one ? { ...row } : null, error: null };
      }
      let result = rows.filter((row) => this.filters.every((test) => test(row)));
      if (this.sort) {
        const { column, ascending } = this.sort;
        result = [...result].sort((a, b) => (a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0) * (ascending ? 1 : -1));
      }
      if (this.max) result = result.slice(0, this.max);
      result = result.map((row) => (this.columns.includes('conversations(')
        ? { ...row, conversations: tables.conversations.find((conversation) => conversation.id === row.conversation_id) ?? null }
        : { ...row }));
      return { data: this.one ? result[0] ?? null : result, error: null };
    }
  }

  const member = (conversation, user) => tables.conversation_members.some((row) => row.conversation_id === conversation && row.user_id === user);
  const join = (conversation, user) => { if (!member(conversation, user)) tables.conversation_members.push({ conversation_id: conversation, user_id: user }); };
  const conversation = (kind, pairKey = null) => {
    const row = { id: newId('conv'), kind, pair_key: pairKey, created_at: nowIso() };
    tables.conversations.push(row);
    return row.id;
  };
  const joinedTeam = (user) => tables.team_members.find((row) => row.user_id === user && row.status === 'joined');

  // The database functions, as supabase/migrations defines them (the parts the tests rely on).
  const functions = {
    join_waitlist({ entry_name: name, entry_email: email, entry_role: role, entry_track: track }) {
      const normal = email.trim().toLowerCase();
      if (!tables.waitlist.some((row) => row.email === normal)) tables.waitlist.push({ name: name.trim(), email: normal, role, track, user_id: me() });
      return null;
    },
    leave_waitlist() {
      tables.waitlist = tables.waitlist.filter((row) => row.user_id !== me());
      return null;
    },
    organizer_conversation() {
      const pair = `organizers:${me()}`;
      const found = tables.conversations.find((row) => row.pair_key === pair);
      if (found) return found.id;
      const id = conversation('organizers', pair);
      join(id, me());
      return id;
    },
    start_direct({ other }) {
      const pair = `direct:${[me(), other].sort().join(':')}`;
      const found = tables.conversations.find((row) => row.pair_key === pair);
      if (found) return found.id;
      if (!tables.profiles.some((row) => row.id === me())) return raise('Create your builder profile first.');
      if (!tables.profiles.some((row) => row.id === other && row.discoverable)) return raise('That builder is not available.');
      const id = conversation('direct', pair);
      join(id, me());
      join(id, other);
      return id;
    },
    create_team({ team_name: name, team_track: track, roles_needed: roles }) {
      if (!tables.profiles.some((row) => row.id === me())) return raise('Create your builder profile first.');
      if (joinedTeam(me())) return raise('You are already in a team.');
      const chat = conversation('team');
      join(chat, me());
      const id = newId('team');
      tables.teams.push({ id, name, track, open_roles: roles, owner_id: me(), conversation_id: chat, created_at: nowIso() });
      tables.team_members.push({ team_id: id, user_id: me(), status: 'joined' });
      return id;
    },
    invite_to_team({ team, invitee }) {
      if (!tables.teams.some((row) => row.id === team && row.owner_id === me())) return raise('Only the team creator can invite people.');
      if (!tables.team_members.some((row) => row.team_id === team && row.user_id === invitee)) tables.team_members.push({ team_id: team, user_id: invitee, status: 'invited' });
      return null;
    },
    respond_to_invitation({ team, accept }) {
      const invitation = tables.team_members.find((row) => row.team_id === team && row.user_id === me() && row.status === 'invited');
      if (!invitation) return raise('There is no invitation to answer.');
      if (!accept) {
        tables.team_members.splice(tables.team_members.indexOf(invitation), 1);
        return null;
      }
      if (joinedTeam(me())) return raise('Leave your current team before joining another.');
      invitation.status = 'joined';
      join(tables.teams.find((row) => row.id === team).conversation_id, me());
      return null;
    },
    leave_team({ team }) {
      const row = tables.teams.find((item) => item.id === team);
      if (!row) return raise('You are not in that team.');
      if (row.owner_id === me()) {
        tables.teams = tables.teams.filter((item) => item.id !== team);
        tables.team_members = tables.team_members.filter((item) => item.team_id !== team);
        tables.conversation_members = tables.conversation_members.filter((item) => item.conversation_id !== row.conversation_id);
      } else {
        tables.team_members = tables.team_members.filter((item) => !(item.team_id === team && item.user_id === me()));
        tables.conversation_members = tables.conversation_members.filter((item) => !(item.conversation_id === row.conversation_id && item.user_id === me()));
      }
      return null;
    },
    check_in() { return { status: 'closed' }; },
    delete_my_data() {
      const mine = me();
      for (const table of ['profiles', 'registrations', 'submissions', 'check_ins']) tables[table] = tables[table].filter((row) => row[PK[table]] !== mine);
      tables.messages = tables.messages.filter((row) => row.sender_id !== mine);
      tables.conversation_members = tables.conversation_members.filter((row) => row.user_id !== mine);
      tables.waitlist = tables.waitlist.filter((row) => row.user_id !== mine);
      return null;
    },
  };

  const client = {
    from: (table) => new Query(table),
    async rpc(name, args = {}) {
      fake.log.push(['rpc', name, args]);
      if (!fake.network) return offline();
      if (!me() && name !== 'join_waitlist') return raise('Sign in first.');
      const result = (fake.rpcs[name] ?? functions[name])(args);
      return result && typeof result === 'object' && 'error' in result ? result : { data: result, error: null };
    },
    auth: {
      async getSession() {
        fake.log.push(['auth', 'getSession']);
        return { data: { session: current }, error: null };
      },
      async signInAnonymously() {
        fake.log.push(['auth', 'signInAnonymously']);
        if (!fake.network) return { data: { user: null, session: null }, error: Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError', status: 0 }) };
        if (fake.anonymous === 'disabled') return { data: { user: null, session: null }, error: Object.assign(new Error('Anonymous sign-ins are disabled'), { name: 'AuthApiError', status: 422, code: 'anonymous_provider_disabled' }) };
        current = { user: { id: newId('user') } };
        listeners.forEach((listener) => listener('SIGNED_IN', current));
        return { data: { user: current.user, session: current }, error: null };
      },
      async signOut() {
        fake.log.push(['auth', 'signOut']);
        current = null;
        listeners.forEach((listener) => listener('SIGNED_OUT', null));
        return { error: null };
      },
      onAuthStateChange(listener) {
        listeners.add(listener);
        return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
      },
    },
    channel(name) {
      const handlers = [];
      const channel = {
        name,
        on(type, filter, callback) { handlers.push({ filter, callback }); return channel; },
        subscribe() { fake.channels.add(channel); return channel; },
        handlers,
      };
      return channel;
    },
    removeChannel(channel) {
      fake.channels.delete(channel);
      return Promise.resolve('ok');
    },
  };

  fake.client = client;
  /** Deliver a realtime insert to every subscribed channel. */
  fake.emit = (table, row) => {
    for (const channel of fake.channels) for (const handler of channel.handlers) if (handler.filter.table === table) handler.callback({ new: row });
  };
  return fake;
}
