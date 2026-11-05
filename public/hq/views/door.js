// The check-in desk. A builder's pass QR code opens this page with their pass filled in (any phone
// camera reads it), or the crew types the code printed under it.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { passFrom, stats, when } from '../model.js';
import { head } from './common.js';

function card(state) {
  const { card: found, busy } = state.ui.door;
  if (busy) return html`<p class="muted" role="status">Looking up the pass…</p>`;
  if (!found) return '';
  if (found.status === 'unreadable') return html`<p class="notice" role="alert"><strong>That is not a pass code.</strong> Codes look like DC-7KQ4-M2XP, under the QR code on the builder's Check-in screen.</p>`;
  if (found.status === 'not-found') return html`<p class="notice" role="alert"><strong>No registration has the pass ${found.pass}.</strong> Ask them to open Register in the app and finish it, then scan again. A pass is only on file once they have registered.</p>`;
  const organizer = state.staff.role === 'organizer';
  return html`<article class="card accent door-card" aria-live="polite">
    <div class="card-head"><h2>${found.name}</h2>${found.registration === 'registered' ? html`<span class="pill gold">Registered</span>` : html`<span class="pill">Not confirmed</span>`}</div>
    <dl class="summary-list">
      <div><dt>Pass</dt><dd class="mono">${found.pass}</dd></div>
      ${found.team ? html`<div><dt>Team</dt><dd>${found.team}</dd></div>` : ''}
      <div><dt>Photos and video</dt><dd>${found.media_consent ? 'Agrees to appear' : html`<strong>Keep out of event media</strong>`}</dd></div>
      ${found.access_needs ? html`<div><dt>Access needs</dt><dd><strong>${found.access_needs}</strong></dd></div>` : ''}
      ${organizer && found.dietary ? html`<div><dt>Dietary needs</dt><dd>${found.dietary}</dd></div>` : ''}
      ${organizer && found.email ? html`<div><dt>Email</dt><dd>${found.email}</dd></div>` : ''}
    </dl>
    ${found.registration === 'registered' ? '' : html`<p class="small-print">They saved their details but have not confirmed their registration. Check them in if they are expected, and ask them to confirm in the app.</p>`}
    <div class="form-actions">${found.checked_in_at
      ? html`<span class="pill done">${icon('check')} Checked in ${when(found.checked_in_at)}</span>${found.already ? html`<span class="small-print">They were already checked in.</span>` : ''}${organizer ? html`<button type="button" class="btn ghost small" data-action="undo-check-in" data-pass="${found.pass}">Undo check-in</button>` : ''}`
      : html`<button type="button" class="btn primary" data-action="check-in" data-pass="${found.pass}">${icon('check')} Check in</button>`}</div>
  </article>`;
}

export default {
  title: () => 'Check-in desk',
  roles: ['organizer', 'crew'],
  render(state, params) {
    const numbers = state.event ? stats(state.event) : null;
    return html`<section class="view">
      ${head('Check-in desk', 'Check-in desk', 'Point your phone camera at a builder\'s pass: the QR code opens this page with their pass filled in. Or type the code printed under it.')}
      ${numbers ? html`<p class="small-print">${numbers.checkedIn} checked in of ${numbers.registered + numbers.unconfirmed} registered.</p>` : ''}
      <form class="card" data-form="look-up" novalidate>
        <div class="field"><label for="f-pass">Pass code</label>
          <input class="input mono pass-input" id="f-pass" name="pass" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DC-7KQ4-M2XP" value="${state.ui.door.query || params[0] || ''}"></div>
        <div class="form-actions"><button class="btn primary" type="submit">${icon('scan')} Look up</button></div>
      </form>
      ${card(state)}
      <p class="small-print">Scanning with a phone works when HQ is signed in in the phone's own browser, the one the camera opens links in.</p>
    </section>`;
  },
  // A pass in the address (from a scan) is looked up as soon as the page opens.
  mount(root, state, params, ctx) {
    const pass = passFrom(params[0]);
    if (pass && state.ui.door.card?.pass !== pass && !state.ui.door.busy) lookUp(ctx, pass);
    else if (!pass) root.querySelector('#f-pass')?.focus();
  },
  forms: {
    'look-up'(form, event, ctx) {
      const text = String(new FormData(form).get('pass') ?? '');
      const pass = passFrom(text);
      if (!pass) {
        ctx.update((state) => { state.ui.door = { query: text, busy: false, card: { status: 'unreadable' } }; });
        return;
      }
      if (location.hash !== `#/door/${pass}`) ctx.navigate(`door/${pass}`);
      else lookUp(ctx, pass);
    },
  },
  actions: {
    async 'check-in'(button, event, ctx) {
      button.disabled = true;
      const found = await ctx.run(() => ctx.api.checkIn(button.dataset.pass), null, { reload: false });
      if (found) {
        ctx.update((state) => { state.ui.door.card = found; });
        ctx.toast(found.already ? `${found.name} was already checked in.` : `${found.name} is checked in.`, { title: 'Check-in' });
        ctx.reload({ quiet: true });
      } else button.disabled = false;
    },
    async 'undo-check-in'(button, event, ctx) {
      if (!confirm('Undo this check-in?')) return;
      const found = await ctx.run(() => ctx.api.undoCheckIn(button.dataset.pass), 'Check-in undone.', { reload: false });
      if (found) ctx.update((state) => { state.ui.door.card = found; });
      ctx.reload({ quiet: true });
    },
  },
};

async function lookUp(ctx, pass) {
  ctx.update((state) => { state.ui.door = { query: pass, busy: true, card: null }; });
  const found = await ctx.run(() => ctx.api.pass(pass), null, { reload: false });
  ctx.update((state) => { state.ui.door = { query: pass, busy: false, card: found ?? null }; });
}
