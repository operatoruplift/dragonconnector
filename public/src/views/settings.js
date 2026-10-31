import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { EVENT, FORMATS, INTEGRATIONS } from '../data/event.js';
import { SERVICES, connectCard, head, liveMode, questTag } from './common.js';

export const APP_VERSION = '1.0.0';

function installCard(state, ctx) {
  if (state.installed) return html`<p class="row"><span class="pill done">${icon('check')} Installed</span> Dragon Connector is on your home screen.</p>`;
  if (ctx.canInstall()) return html`<button type="button" class="btn primary" data-action="install">${icon('download')} Install the app</button>`;
  if (ctx.isIos()) return html`<p class="muted">On iPhone or iPad, open this page in Safari, tap Share, then <strong>Add to Home Screen</strong>.</p>`;
  return html`<p class="muted">Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. Not every browser supports installing; Chrome, Edge and Safari do.</p>`;
}

const CONNECTION = {
  connecting: ['Connecting', 'Connecting to Dragon Connector services…'],
  ready: ['Connected', 'Your anonymous account is created on this device the first time you save details, message someone or open Teammates.'],
  live: ['Live', 'You have an anonymous account that lives in this browser. There is no password, so clearing this browser\'s data loses access to it.'],
  offline: ['Offline', 'Everything keeps working on this device and syncs when you are back online.'],
};

function connectionCard(state, ctx) {
  const mode = liveMode(state, ctx);
  if (mode === 'local') return '';
  if (mode === 'device') return connectCard();
  const [label, text] = mode === 'guest'
    ? ['Limited', `${ctx.backend.problem() || 'Accounts are not available right now.'} The waitlist still works; everything else stays on this device until accounts are available.`]
    : CONNECTION[mode];
  return html`<div class="card">
    <div class="card-head"><h2>Connection</h2><span class="pill${mode === 'live' ? ' done' : ''}">${label}</span></div>
    <p class="muted">${text}</p>
  </div>`;
}

export default {
  title: () => 'Settings',
  render(state, params, ctx) {
    return html`<section class="view">
      ${head('You', 'Settings', 'Preview mode, installing the app, your data and where everything comes from.')}
      ${connectionCard(state, ctx)}
      <div class="card">
        <div class="card-head"><h2>Install the app</h2>${questTag(state, 'install')}</div>
        <p class="muted">Installed, Dragon Connector opens full screen and works offline, so your check-in pass is ready even with weak venue Wi-Fi.</p>
        ${installCard(state, ctx)}
      </div>
      <div class="card">
        <h2>Preview mode</h2>
        <p class="muted">Registration, check-in and submission open later. Preview mode unlocks them on this device so organizers and builders can try the full journey. Preview check-ins and submissions are not sent to the organizers.</p>
        <label class="option"><input type="checkbox" data-action="preview" ${state.preview ? 'checked' : ''}><span><strong>Preview closed steps</strong><small>Shows a Preview badge at the top while it is on.</small></span></label>
      </div>
      <div class="card">
        <h2>Event format</h2>
        <p class="muted">Both formats are proposed. Choose the one you want the schedule, countdown and deadlines to follow.</p>
        <div class="segmented" role="group" aria-label="Event format">${Object.values(FORMATS).map((format) => html`<button type="button" data-action="format" data-id="${format.id}" aria-pressed="${state.format === format.id}">${format.label}</button>`)}</div>
      </div>
      <div class="card">
        <h2>The tour</h2>
        <p class="muted">A quick walk through the app's main parts.</p>
        <div class="row"><button type="button" class="btn" data-action="start-tour">${icon('guide')} Replay the tour</button></div>
      </div>
      <div class="card">
        <h2>Your data</h2>
        <p class="muted">${SERVICES ? 'Your details are kept on this device and in your Dragon Connector account. Deleting removes both.' : 'Everything you enter is stored on this device only.'} <a href="#/docs/privacy">How your data is kept</a>.</p>
        <div class="row"><button type="button" class="btn" data-action="reset">${icon('trash')} ${SERVICES ? 'Delete my data' : 'Reset the app'}</button></div>
      </div>
      <div class="card">
        <h2>About</h2>
        <p class="muted">${EVENT.name} app ${APP_VERSION} · content updated ${EVENT.contentUpdated}. ${EVENT.status}: dates, venue, funding and prizes are proposals.</p>
        <p class="small-print">${SERVICES ? `Live services: Supabase, hosted in ${INTEGRATIONS.supabase.region}, through supabase-js (MIT License). ` : ''}Fonts: Oxanium, Space Grotesk and IBM Plex Mono under the SIL Open Font License. QR codes: qrcode-generator by Kazuhiko Arase, MIT License. "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.</p>
        <div class="row"><a class="btn small" href="${EVENT.proposalUrl}" target="_blank" rel="noopener noreferrer">Read the proposal ${icon('external')}</a></div>
      </div>
    </section>`;
  },
  actions: {
    preview(input, event, ctx) {
      ctx.store.update((draft) => { draft.preview = !draft.preview; });
      ctx.toast(ctx.store.get().preview ? 'Closed steps are unlocked on this device.' : 'Closed steps are locked again.', { title: ctx.store.get().preview ? 'Preview on' : 'Preview off' });
    },
    format(button, event, ctx) { ctx.store.update((draft) => { draft.format = button.dataset.id; }); },
    async reset(button, event, ctx) {
      const services = Boolean(ctx.backend?.configured);
      if (!confirm(services
        ? 'Delete your data? This removes your profile, pre-registration, submission, check-in, the messages you sent, your team and your waitlist entry, deletes your Dragon Connector account, then clears this device. It cannot be undone.'
        : 'Reset the app? This deletes your profile, messages, tasks, submission and XP from this device.')) return;
      if (services) {
        button.disabled = true;
        const result = await ctx.backend.deleteMyData();
        if (result.error) {
          button.disabled = false;
          ctx.toast(result.error, { title: 'Nothing was deleted' });
          return;
        }
      }
      ctx.store.reset();
      location.hash = '#/';
      location.reload();
    },
  },
};
