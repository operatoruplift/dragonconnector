// Dragon Connector HQ: the private dashboard for organizers, judges and check-in crew. One page,
// routed by #hash like the builder app, drawn from what the hq_ functions return.
import { html } from '../src/lib/html.js';
import { icon } from '../src/lib/icons.js';
import { toast } from '../src/lib/ui.js';
import { INTEGRATIONS } from '../src/data/event.js';
import { createApi } from './api.js';
import { ROLE_LABEL, SWITCHES, ago, stats } from './model.js';
import overview from './views/overview.js';
import people from './views/people.js';
import teams from './views/teams.js';
import projects from './views/projects.js';
import judging from './views/judging.js';
import score from './views/score.js';
import door from './views/door.js';
import inbox from './views/inbox.js';
import announcements from './views/announcements.js';
import sponsors from './views/sponsors.js';
import crew from './views/crew.js';
import event from './views/event.js';

// HQ's address is dragonconnector.com/app/hq/, where sessions and pass links live. A visit to the app's
// first address moves there (previews keep their own address for testing).
if (location.hostname === 'dragonconnectorapp.vercel.app') location.replace(`https://dragonconnector.com/app/hq/${location.hash}`);

const VIEWS = { overview, people, teams, projects, judging, score, door, inbox, announcements, sponsors, crew, event };
const HOME = { organizer: 'overview', judge: 'judging', crew: 'door' };
const NAV = [
  { label: 'Event', items: [['overview', 'chart', 'Overview'], ['event', 'settings', 'Event switches']] },
  { label: 'People', items: [['people', 'user', 'People'], ['teams', 'team', 'Teams'], ['door', 'scan', 'Check-in desk']] },
  { label: 'Projects', items: [['projects', 'upload', 'Projects'], ['judging', 'trophy', 'Judging']] },
  { label: 'Messages', items: [['inbox', 'inbox', 'Inbox'], ['announcements', 'megaphone', 'Announcements']] },
  { label: 'Partners and crew', items: [['sponsors', 'handshake', 'Sponsors'], ['crew', 'key', 'Crew']] },
];

function safeStorage() {
  try { return window.localStorage; } catch { return null; }
}

function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) { resolve(window.supabase.createClient); return; }
    const script = document.createElement('script');
    script.src = '../src/vendor/supabase.js';
    script.onload = () => (window.supabase?.createClient ? resolve(window.supabase.createClient) : reject(new Error('Supabase did not load')));
    script.onerror = () => { script.remove(); reject(new TypeError('Failed to fetch ../src/vendor/supabase.js')); };
    document.head.append(script);
  });
}

const api = createApi({ config: INTEGRATIONS.supabase, loadClient: loadSupabase, storage: safeStorage() });

const state = {
  staff: null,
  event: null, // organizers: the whole event (hq_event)
  projects: null, // judges: the submitted projects and their own scores (hq_projects)
  loadedAt: 0,
  problem: '',
  accountsOn: null,
  starting: api.hasSession(),
  signInError: '',
  ui: {
    peopleFilter: 'all', peopleQuery: '', peopleTrack: '', projectFilter: 'submitted', revealed: null,
    door: { query: '', busy: false, card: null }, sheets: {}, replies: {},
  },
};

function route() {
  const [path, search = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map((part) => { try { return decodeURIComponent(part); } catch { return part; } });
  const name = parts[0] || HOME[state.staff?.role] || 'overview';
  return { name, params: parts.slice(1), path: `${name}/${parts.slice(1).join('/')}?${search}`, query: Object.fromEntries(new URLSearchParams(search)) };
}

/** What went wrong, said once: an ended session signs out, anything else becomes a toast. */
function handle(error, { quiet = false } = {}) {
  if (error.ended) {
    Object.assign(state, { staff: null, event: null, projects: null, signInError: error.message });
    render({ force: true });
    return;
  }
  if (!state.event && !state.projects) state.problem = error.message;
  if (!quiet) toast(error.message, { title: 'HQ', duration: 6500 });
}

let loading = null;
async function load({ quiet = false } = {}) {
  if (!state.staff || state.staff.role === 'crew') return;
  loading ??= (async () => {
    try {
      if (state.staff.role === 'organizer') state.event = await api.event();
      else state.projects = await api.projects();
      Object.assign(state, { loadedAt: Date.now(), problem: '' });
    } catch (error) {
      handle(error, { quiet });
    }
  })().finally(() => { loading = null; });
  await loading;
  render();
}

const ctx = {
  api,
  state,
  query: {},
  now: () => Date.now(),
  toast: (message, options = {}) => toast(message, { title: 'HQ', ...options }),
  navigate: (path) => { location.hash = `#/${path}`; },
  rerender: (options) => render(options),
  reload: (options) => load(options),
  update(change) {
    change(state);
    render({ force: true });
  },
  /** Run a change, say how it went, then read the event again so every page agrees. */
  async run(action, success, { reload = true } = {}) {
    try {
      const result = await action();
      if (success) toast(success, { title: 'HQ' });
      if (reload) await load({ quiet: true });
      return result ?? true;
    } catch (error) {
      handle(error);
      return null;
    }
  },
  download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

const GLOBAL_ACTIONS = {
  reload: () => load(),
  async 'sign-out'() {
    await api.signOut();
    Object.assign(state, { staff: null, event: null, projects: null, signInError: '' });
    state.ui.revealed = null;
    location.hash = '#/';
    render({ force: true });
  },
  async switch(button) {
    const on = button.dataset.on === 'true';
    const item = SWITCHES.find((entry) => entry.id === button.dataset.setting);
    if (item.id === 'registration_open' && on && !confirm('Open registration? Builders can register in the app straight away, and their Waitlist step becomes Register.')) return;
    button.disabled = true;
    await ctx.run(() => api.setSwitch(item.id, on), `${item.title} is ${on ? 'open' : 'closed'}.`);
    render({ force: true });
  },
  async copy(button) {
    try {
      await navigator.clipboard.writeText(button.dataset.text);
      toast('Copied.', { title: 'HQ' });
    } catch {
      toast('Select the code and copy it.', { title: 'HQ' });
    }
  },
};

function signInScreen() {
  return html`<section class="signin">
    <img src="../brand/dragon-connector-logo-stacked.svg" alt="Dragon Connector" width="636" height="444">
    <div class="stack"><p class="eyebrow">Dragon Connector HQ</p><h1 tabindex="-1">Staff sign-in</h1>
      <p class="lede">For organizers, judges and check-in crew. Sign in with the personal access code an organizer sent you.</p></div>
    <form class="card" data-form="sign-in" novalidate>
      <div class="field"><label for="f-code">Access code</label>
        <input class="input mono" id="f-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="HQ-XXXX-XXXX-XXXX-XXXX" aria-describedby="f-code-error">
        <p class="error" id="f-code-error" ${state.signInError ? '' : 'hidden'}>${state.signInError}</p></div>
      <button class="btn primary block" type="submit">${icon('key')} Sign in</button>
    </form>
    <p class="small-print">Lost your code? Ask an organizer for a new one. Builders: your app is at <a href="../">dragonconnector.com/app</a>.</p>
  </section>`;
}

function renderShell(current) {
  const role = state.staff.role;
  const unread = state.event ? stats(state.event).waiting : 0;
  document.getElementById('topbar').innerHTML = String(html`
    <a class="brand" href="#/"><img src="../brand/dragon-connector-logo-horizontal.svg" alt="Dragon Connector HQ home" width="686" height="120"></a>
    <span class="preview-pill">HQ</span>
    <span class="spacer"></span>
    <span class="who-chip"><strong>${state.staff.name}</strong><span>${ROLE_LABEL[role]}</span></span>
    ${role === 'crew' ? '' : html`<button type="button" class="btn ghost small icon-only" data-action="reload" title="${state.loadedAt ? `Updated ${ago(state.loadedAt, Date.now()).toLowerCase()}. Refresh` : 'Refresh'}">${icon('refresh', 'Refresh')}</button>`}
    <button type="button" class="btn ghost small icon-only" data-action="sign-out" title="Sign out">${icon('logout', 'Sign out')}</button>`);
  const groups = role === 'organizer' ? NAV : [{ label: role === 'judge' ? 'Judging' : 'Check-in', items: role === 'judge' ? [['judging', 'trophy', 'Projects to score']] : [['door', 'scan', 'Check-in desk']] }];
  document.getElementById('sidebar').innerHTML = String(html`${groups.map((group) => html`<div class="nav-group"><span class="label">${group.label}</span>${group.items.map(([name, glyph, title]) => html`<a class="nav-link" href="#/${name}" ${current.name === name || (name === 'judging' && current.name === 'score') ? html`aria-current="page"` : ''}>${icon(glyph)}<span>${title}</span>${name === 'inbox' && unread ? html`<span class="count" aria-label="${unread} waiting">${unread}</span>` : ''}</a>`)}</div>`)}`);
  document.body.dataset.role = role;
}

let shown = { path: null };
function render({ force = false } = {}) {
  const root = document.getElementById('view');
  document.body.classList.toggle('signed-out', !state.staff);
  if (!state.staff) {
    document.getElementById('topbar').innerHTML = '';
    document.getElementById('sidebar').innerHTML = '';
    delete document.body.dataset.role;
    if (state.starting) { root.innerHTML = '<p class="muted">Signing in…</p>'; return; }
    if (shown.path === 'sign-in' && !force) return;
    root.innerHTML = String(signInScreen());
    shown = { path: 'sign-in' };
    document.title = 'Sign in · Dragon Connector HQ';
    root.querySelector('#f-code')?.focus();
    return;
  }
  const current = route();
  const view = VIEWS[current.name];
  renderShell(current);
  if (!view || !view.roles.includes(state.staff.role)) {
    root.innerHTML = String(html`<section class="view"><header class="view-head"><p class="eyebrow">HQ</p><h1 tabindex="-1">${view ? 'Not part of your role' : 'Not found'}</h1><p class="lede">${view ? `This page is for ${view.roles.map((role) => ROLE_LABEL[role].toLowerCase()).join(' and ')}.` : 'This page is not part of HQ.'}</p></header><a class="btn primary" href="#/">Go to your start page</a></section>`);
    shown = { path: current.path };
    return;
  }
  const live = typeof view.live === 'function' ? view.live(current.params, state) : view.live !== false;
  const same = shown.path === current.path;
  if (same && !live && !force) return;
  const active = document.activeElement;
  const keep = same && root.contains(active) && active.id ? { id: active.id, start: active.selectionStart, end: active.selectionEnd } : null;
  const scroll = window.scrollY;
  ctx.query = current.query;
  root.innerHTML = String(view.render(state, current.params, ctx));
  shown = { path: current.path };
  if (same) {
    scrollTo(0, scroll);
    const again = keep && document.getElementById(keep.id);
    if (again) {
      again.focus({ preventScroll: true });
      if (typeof keep.start === 'number' && again.setSelectionRange) try { again.setSelectionRange(keep.start, keep.end); } catch { /* not a text field */ }
    }
  } else {
    document.title = `${view.title(state, current.params)} · Dragon Connector HQ`;
    scrollTo(0, 0);
    root.querySelector('h1')?.focus({ preventScroll: true });
  }
  view.mount?.(root, state, current.params, ctx);
}

async function signIn(form) {
  const code = String(new FormData(form).get('code') ?? '').trim();
  const slot = form.querySelector('#f-code-error');
  const fail = (message) => { slot.textContent = message; slot.hidden = false; form.querySelector('#f-code').setAttribute('aria-invalid', 'true'); form.querySelector('#f-code').focus(); };
  if (!code) return fail('Enter your access code.');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const staff = await api.signIn(code);
    if (!staff) { button.disabled = false; return fail('That code does not match. Check it, or ask an organizer for a new one.'); }
    await started(staff);
  } catch (error) {
    button.disabled = false;
    fail(error.message);
  }
}

async function started(staff) {
  Object.assign(state, { staff, starting: false, signInError: '', problem: '' });
  shown = { path: null };
  render({ force: true });
  await load({ quiet: true });
  if (staff.role === 'organizer') {
    state.accountsOn = await api.builderAccounts();
    render({ force: true });
  }
}

// Delegated events: views declare actions, forms, inputs and changes by name.
const viewRoot = document.getElementById('view');
const currentView = () => (state.staff ? VIEWS[route().name] : null);
document.addEventListener('click', (click) => {
  const trigger = click.target.closest('[data-action]');
  if (!trigger) return;
  const handler = currentView()?.actions?.[trigger.dataset.action] ?? GLOBAL_ACTIONS[trigger.dataset.action];
  if (handler) { click.preventDefault(); handler(trigger, click, ctx); }
});
viewRoot.addEventListener('submit', (submit) => {
  const form = submit.target.closest('form[data-form]');
  if (!form) return;
  submit.preventDefault();
  if (form.dataset.form === 'sign-in') signIn(form);
  else currentView()?.forms?.[form.dataset.form]?.(form, submit, ctx);
});
for (const [type, key] of [['input', 'inputs'], ['change', 'changes']]) {
  viewRoot.addEventListener(type, (change) => {
    const element = change.target.closest(`[data-${type}]`);
    if (element) currentView()?.[key]?.[element.dataset[type]]?.(element, change, ctx);
  });
}

// One tooltip for every chart mark, on hover and on keyboard focus. Its text comes from the mark's
// own data-tip and is set with textContent.
const tip = document.getElementById('tip');
function showTip(target) {
  tip.textContent = target.dataset.tip;
  tip.hidden = false;
  const box = target.getBoundingClientRect();
  const width = tip.offsetWidth;
  tip.style.left = `${Math.min(Math.max(8, box.left + box.width / 2 - width / 2), innerWidth - width - 8)}px`;
  tip.style.top = `${Math.max(8, box.top - tip.offsetHeight - 8)}px`;
}
for (const type of ['pointerover', 'focusin']) document.addEventListener(type, (over) => { const target = over.target.closest?.('[data-tip]'); if (target) showTip(target); });
for (const type of ['pointerout', 'focusout']) document.addEventListener(type, (out) => { if (out.target.closest?.('[data-tip]')) tip.hidden = true; });
addEventListener('scroll', () => { tip.hidden = true; }, { passive: true });

addEventListener('hashchange', () => render());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - state.loadedAt > 15000) load({ quiet: true }); });
setInterval(() => { if (document.visibilityState === 'visible') load({ quiet: true }); }, 30000);

// Start: a session kept in this browser signs straight back in.
render();
if (state.starting) {
  api.me().then(started).catch((error) => {
    Object.assign(state, { starting: false, signInError: error.message });
    render({ force: true });
  });
}
