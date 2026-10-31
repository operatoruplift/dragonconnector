// App bootstrap: state, routing, the shell around each view, celebrations, install, offline and
// the connection to live services.
import { createStore, newPassCode } from './lib/store.js';
import { createBackend } from './lib/backend.js';
import { html } from './lib/html.js';
import { icon } from './lib/icons.js';
import { levelFor, xpOf } from './lib/game.js';
import { celebrate, startTour, toast } from './lib/ui.js';
import { seedThreads } from './data/threads.js';
import { EVENT, INTEGRATIONS } from './data/event.js';
import home from './views/home.js';
import waitlist from './views/waitlist.js';
import register from './views/register.js';
import profile from './views/profile.js';
import checkin from './views/checkin.js';
import team from './views/team.js';
import inbox from './views/inbox.js';
import submit from './views/submit.js';
import quests from './views/quests.js';
import schedule from './views/schedule.js';
import guides from './views/guides.js';
import docs from './views/docs.js';
import requirements from './views/requirements.js';
import map from './views/map.js';
import prizes from './views/prizes.js';
import sponsors from './views/sponsors.js';
import settings from './views/settings.js';
import more from './views/more.js';

const ROUTES = { home, waitlist, register, profile, checkin, team, inbox, submit, quests, schedule, guides, docs, requirements, map, prizes, sponsors, settings, more };

const NAV = [
  { label: 'Journey', items: [
    { route: 'home', icon: 'home', title: 'Home' },
    { route: 'waitlist', icon: 'list', title: 'Waitlist', quest: 'waitlist' },
    { route: 'register', icon: 'pen', title: 'Pre-register', quest: 'register' },
    { route: 'checkin', icon: 'scan', title: 'Check-in', quest: 'checkin' },
    { route: 'team', icon: 'team', title: 'Teammates', quest: 'team' },
    { route: 'inbox', icon: 'inbox', title: 'Messages', unread: true },
    { route: 'submit', icon: 'upload', title: 'Submit', quest: 'submit' },
  ] },
  { label: 'Explore', items: [
    { route: 'schedule', icon: 'calendar', title: 'Schedule' },
    { route: 'quests', icon: 'quest', title: 'Quests & tasks' },
    { route: 'guides', icon: 'book', title: 'Guides' },
    { route: 'docs', icon: 'doc', title: 'Docs' },
    { route: 'requirements', icon: 'checklist', title: 'Requirements' },
    { route: 'map', icon: 'map', title: 'Venue map' },
    { route: 'prizes', icon: 'trophy', title: 'Prize pool' },
    { route: 'sponsors', icon: 'handshake', title: 'Sponsors' },
  ] },
  { label: 'You', items: [
    { route: 'profile', icon: 'user', title: 'Profile', quest: 'profile' },
    { route: 'settings', icon: 'settings', title: 'Settings' },
  ] },
];

const TABS = [
  { route: 'home', icon: 'home', title: 'Home' },
  { route: 'quests', icon: 'quest', title: 'Quests' },
  { route: 'team', icon: 'team', title: 'Team' },
  { route: 'inbox', icon: 'inbox', title: 'Inbox', unread: true },
  { route: 'more', icon: 'more', title: 'More' },
];

const TOUR = [
  { target: '[data-tour="level"]', title: 'Your level', text: 'Every quest you complete earns XP. Level up from Hatchling to Dragon.' },
  { target: '#topbar .xp-chip', title: 'XP at a glance', text: 'Your level and XP follow you everywhere. Tap here to see every quest.' },
  { target: '[data-tour="journey"]', title: 'Your journey', text: 'Waitlist, pre-registration, check-in, teammates, messages and submission, in order. The gold step is next.' },
  { target: ['#sidebar a[href="#/team"]', '#tabbar a[href="#/team"]'], title: 'Find your crew', text: 'Teammates ranks builders whose skills complement yours and shows why.' },
  { target: ['#sidebar a[href="#/inbox"]', '#tabbar a[href="#/inbox"]'], title: 'Messages', text: 'Talk to your team, read announcements and ask the Dragon Guide about the event.' },
  { target: ['#sidebar .nav-group:nth-child(2)', '#tabbar a[href="#/more"]'], title: 'Everything else', text: 'The schedule, guides, docs, requirements, venue map, prize pool and sponsors.' },
  { target: '[data-tour="explore"]', title: 'Explore for XP', text: 'Every section has its own quest. Visiting it counts.' },
];

const BIG_QUESTS = new Set(['register', 'team', 'checkin', 'submit']);

function onEvent(event) {
  if (event.type === 'quest') {
    toast(event.quest.title, { title: `Quest complete · +${event.quest.xp} XP` });
    if (BIG_QUESTS.has(event.quest.id)) celebrate();
  }
  if (event.type === 'level') {
    toast(`You reached level ${event.level.number}: ${event.level.name}.`, { title: 'Level up', duration: 5200 });
    celebrate();
  }
  if (event.type === 'badge') toast(event.badge.detail, { title: `Badge earned · ${event.badge.title}` });
}

const store = createStore({ storage: safeStorage(), onEvent });

function safeStorage() {
  try { return window.localStorage; } catch { return null; }
}

// First run: the starting conversations and a check-in pass code.
store.update((state) => {
  for (const thread of seedThreads()) if (!state.threads[thread.id]) state.threads[thread.id] = thread;
  if (!state.passCode) state.passCode = newPassCode();
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) state.installed = true;
}, { quiet: true });

// Install support: Chromium offers a prompt; iOS needs Share → Add to Home Screen.
let installPrompt = null;
addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; scheduleRender(); });
addEventListener('appinstalled', () => { installPrompt = null; store.update((state) => { state.installed = true; }); });

// Supabase loads after the first render, so the app never waits for it.
function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) { resolve(window.supabase.createClient); return; }
    const script = document.createElement('script');
    script.src = 'src/vendor/supabase.js';
    script.onload = () => (window.supabase?.createClient ? resolve(window.supabase.createClient) : reject(new Error('Supabase did not load')));
    script.onerror = () => { script.remove(); reject(new TypeError('Failed to fetch src/vendor/supabase.js')); };
    document.head.append(script);
  });
}

const backend = createBackend({
  config: INTEGRATIONS.supabase,
  loadClient: loadSupabase,
  store,
  viewing: () => (route().name === 'inbox' ? route().params[0] ?? null : null),
  notify: (text, title) => toast(text, { title, duration: 6500 }),
  onChange: () => scheduleRender(),
  online: () => navigator.onLine !== false,
});

const ctx = {
  store,
  backend,
  now: () => Date.now(),
  toast,
  celebrate,
  navigate: (path) => { location.hash = `#/${path}`; },
  rerender: () => render({ force: true }),
  canInstall: () => Boolean(installPrompt),
  isIos: () => /iphone|ipad|ipod/i.test(navigator.userAgent),
  async install() {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    installPrompt = null;
    if (outcome === 'accepted') store.update((state) => { state.installed = true; });
    scheduleRender();
    return outcome === 'accepted';
  },
  startTour() {
    if (route().name !== 'home') {
      ctx.navigate('');
      setTimeout(() => ctx.startTour(), 120);
      return;
    }
    startTour(TOUR, {
      onFinish: () => store.update((state) => { state.tourDone = true; }),
      onSkip: () => toast('You can replay the tour from Home or Settings.', { title: 'Tour skipped' }),
    });
  },
};

const GLOBAL_ACTIONS = {
  'start-tour': () => ctx.startTour(),
  'connect-details': async (button) => {
    button.disabled = true;
    await backend.connectDetails();
    const status = backend.status();
    if (status === 'live') toast('Your details are saved to your Dragon Connector account.', { title: 'Connected' });
    else if (status === 'offline') toast('You are offline. Your details are sent when you are back online.', { title: 'Connecting later' });
    else toast(`${backend.problem() || 'Accounts are not available right now.'} Your details stay on this device for now.`, { title: 'Not connected yet' });
    button.disabled = false;
  },
  install: async () => {
    if (!(await ctx.install()) && !store.get().installed) toast('Use your browser menu to add Dragon Connector to your home screen.', { title: 'Install' });
  },
};

function route() {
  const path = location.hash.replace(/^#\/?/, '').split('?')[0];
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { name: parts[0] || 'home', params: parts.slice(1), path: parts.join('/') };
}

function navLink(state, item, current) {
  const unread = item.unread ? Object.values(state.threads).reduce((sum, thread) => sum + (thread.unread || 0), 0) : 0;
  return html`<a class="nav-link" href="#/${item.route === 'home' ? '' : item.route}" ${current === item.route ? html`aria-current="page"` : ''}>${icon(item.icon)}<span>${item.title}</span>${unread ? html`<span class="count" aria-label="${unread} unread">${unread}</span>` : item.quest && state.quests[item.quest] ? html`<span class="done">${icon('check', 'Done')}</span>` : ''}</a>`;
}

function renderShell(state, current) {
  const xp = xpOf(state);
  const level = levelFor(xp);
  document.getElementById('topbar').innerHTML = String(html`
    <a class="brand" href="#/"><img src="brand/dragon-connector-logo-horizontal.svg" alt="Dragon Connector home" width="686" height="120"></a>
    ${state.preview ? html`<span class="preview-pill" title="Preview mode: closed steps are unlocked on this device">Preview</span>` : ''}
    <a class="xp-chip" href="#/quests" aria-label="Level ${level.number}, ${level.name}, ${xp} XP. Open quests.">
      <span class="level">LV ${level.number}</span>
      <span class="meter" aria-hidden="true"><span style="width:${Math.round(level.progress * 100)}%"></span></span>
      <span class="points">${xp} XP</span>
    </a>`);
  document.getElementById('sidebar').innerHTML = String(html`${NAV.map((group) => html`<div class="nav-group"><span class="label">${group.label}</span>${group.items.map((item) => navLink(state, item, current))}</div>`)}`);
  const tabbed = TABS.some((tab) => tab.route === current) ? current : 'more';
  const unread = Object.values(state.threads).reduce((sum, thread) => sum + (thread.unread || 0), 0);
  document.getElementById('tabbar').innerHTML = String(html`${TABS.map((tab) => html`<a class="tab" href="#/${tab.route === 'home' ? '' : tab.route}" ${tabbed === tab.route ? html`aria-current="page"` : ''}>${icon(tab.icon)}<span>${tab.title}</span>${tab.unread && unread ? html`<span class="dot" aria-label="${unread} unread">${unread}</span>` : ''}</a>`)}`);
}

const notFound = {
  title: () => 'Not found',
  render: () => html`<section class="view"><header class="view-head"><p class="eyebrow">404</p><h1 tabindex="-1">This page wandered off</h1><p class="lede">It is not part of the app. Head back to your quest.</p></header><a class="btn primary" href="#/">Go home</a></section>`,
};

let shown = { path: null, view: null };
let cleanup = null;

function render({ force = false } = {}) {
  const state = store.get();
  const current = route();
  const view = ROUTES[current.name] ?? notFound;
  renderShell(state, current.name);
  const root = document.getElementById('view');
  const same = shown.path === current.path;
  if (same && view.live === false && !force) return;

  // Keep focus, caret and scroll when the same view re-renders.
  const active = document.activeElement;
  const keep = same && root.contains(active) && active.id ? { id: active.id, start: active.selectionStart, end: active.selectionEnd } : null;
  const previousScroll = window.scrollY;

  cleanup?.();
  root.innerHTML = String(view.render(state, current.params, ctx));
  shown = { path: current.path, view };

  if (same) {
    scrollTo(0, previousScroll);
    const again = keep && document.getElementById(keep.id);
    if (again) {
      again.focus({ preventScroll: true });
      if (typeof keep.start === 'number' && again.setSelectionRange) try { again.setSelectionRange(keep.start, keep.end); } catch { /* not a text field */ }
    }
  } else {
    document.title = `${view.title(state, current.params)} · ${EVENT.name}`;
    scrollTo(0, 0);
    root.querySelector('h1')?.focus({ preventScroll: true });
  }
  // Mount last, so a view can adjust scroll and focus (a conversation opens at its latest message).
  cleanup = view.mount?.(root, state, current.params, ctx) ?? null;
}

let pending = false;
function scheduleRender() {
  if (pending) return;
  pending = true;
  queueMicrotask(() => { pending = false; render(); });
}

function recordVisit() {
  const current = route();
  const key = current.params[0] && current.name === 'docs' ? `docs/${current.params[0]}` : current.name;
  if (!store.get().visited[key]) store.update((state) => { state.visited[key] = true; }, { quiet: true });
}

// Delegated events: views declare actions, forms and inputs by name.
const viewRoot = document.getElementById('view');
viewRoot.addEventListener('click', (event) => {
  const focusLink = event.target.closest('[data-focus]');
  if (focusLink) {
    event.preventDefault();
    viewRoot.querySelector(`[name="${CSS.escape(focusLink.dataset.focus)}"]`)?.focus();
    return;
  }
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const handler = shown.view?.actions?.[trigger.dataset.action] ?? GLOBAL_ACTIONS[trigger.dataset.action];
  if (handler) { event.preventDefault(); handler(trigger, event, ctx); }
});
viewRoot.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  shown.view?.forms?.[form.dataset.form]?.(form, event, ctx);
});
for (const type of ['input', 'change']) {
  viewRoot.addEventListener(type, (event) => {
    const element = event.target.closest(`[data-${type}]`);
    if (element) shown.view?.[`${type}s`]?.[element.dataset[type]]?.(element, event, ctx);
  });
}

store.subscribe(scheduleRender);
addEventListener('hashchange', () => { recordVisit(); render(); if (route().name === 'team') backend.refreshBuilders(); });
recordVisit();
render();

// Live services: connect now, catch up when the connection or the app comes back, and check for
// team changes while the app is open.
backend.start().then(() => { if (route().name === 'team') backend.refreshBuilders(); });
addEventListener('online', () => backend.start());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') backend.refresh(); });
setInterval(() => { if (document.visibilityState === 'visible') backend.refresh({ full: false }); }, 60000);

// First visit: a short welcome, then the tour.
if (!store.get().welcomed) {
  const welcome = document.createElement('div');
  welcome.className = 'welcome';
  welcome.innerHTML = String(html`<div class="welcome-card" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
    <img src="brand/dragon-connector-logo-stacked.svg" alt="" width="636" height="444">
    <p class="eyebrow">${EVENT.edition} · ${EVENT.tagline}</p>
    <h2 id="welcome-title">Welcome, builder</h2>
    <ul><li>Every step from the waitlist to your demo is a quest that earns XP.</li><li>Find teammates, message them and plan your build.</li><li>The event is in planning: dates, venue and prizes are proposals, and registration is not open yet.</li></ul>
    <div class="form-actions"><button type="button" class="btn primary" data-welcome="tour">Take the tour</button><button type="button" class="btn ghost" data-welcome="skip">Explore on my own</button></div>
  </div>`);
  document.body.append(welcome);
  welcome.querySelector('[data-welcome="tour"]').focus();
  welcome.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-welcome]')?.dataset.welcome;
    if (!choice) return;
    welcome.remove();
    store.update((state) => { state.welcomed = true; });
    if (choice === 'tour') ctx.startTour();
    else document.querySelector('#view h1')?.focus();
  });
  welcome.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') welcome.querySelector('[data-welcome="skip"]').click();
    if (event.key === 'Tab') {
      const buttons = [...welcome.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  });
}

// Offline support. Updates wait until the person chooses to reload.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register('sw.js').then((registration) => {
    const offer = (worker) => toast('A new version of the app is ready.', { title: 'Update', duration: 0, action: { label: 'Reload', run: () => worker.postMessage('skip-waiting') } });
    if (registration.waiting && hadController) offer(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker); });
    });
  }).catch(() => { /* the app still works online */ });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });
}
