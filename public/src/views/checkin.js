import { html, raw } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { checkInOpen, formatOf } from '../lib/gates.js';
import { countdown, eventWindow } from '../lib/time.js';
import qrcode from '../vendor/qrcode.mjs';
import { GATES, INTEGRATIONS, PREVIEW_CHECK_IN_CODE } from '../data/event.js';
import { head, previewNotice, questTag } from './common.js';

/** An SVG QR code with a quiet zone, dark modules on ivory for reliable scanning. */
export function qrSvg(text) {
  const code = qrcode(0, 'M');
  code.addData(text);
  code.make();
  const count = code.getModuleCount();
  const quiet = 4;
  const size = count + quiet * 2;
  let path = '';
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) if (code.isDark(row, column)) path += `M${column + quiet} ${row + quiet}h1v1h-1z`;
  }
  return raw(`<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" aria-hidden="true"><rect width="${size}" height="${size}" fill="#F8F8F6"/><path d="${path}" fill="#0B0B0B"/></svg>`);
}

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const normaliseCode = (value) => String(value).trim().toUpperCase().replace(/\s+/g, '');

export default {
  title: () => 'Check-in',
  render(state, params, ctx) {
    const open = checkInOpen(state, ctx.now());
    const format = formatOf(state);
    const until = countdown(ctx.now(), eventWindow(format).start);
    const checked = state.checkIn;
    return html`<section class="view">
      ${head('Step 04 · Event day', 'Check in', 'Show your pass at the check-in desk, or enter the venue code to check yourself in.')}
      ${previewNotice(state)}
      ${checked ? html`<div class="card accent"><div class="row"><span class="done-mark">${icon('check')}</span><div class="stack" style="gap:4px"><h2>You are checked in</h2><p class="muted">${new Date(checked.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}${checked.preview ? ' · preview' : ''}</p></div><span class="spacer"></span>${questTag(state, 'checkin')}</div><div class="row"><a class="btn primary" href="#/team">Find your team ${icon('arrow')}</a><a class="btn" href="#/map">Venue map</a></div></div>` : ''}
      <div class="grid cols-2">
        <div class="pass">
          <p class="eyebrow">Check-in pass</p>
          <div class="qr">${qrSvg(`DC001:${state.passCode}`)}</div>
          <p class="pass-code" aria-label="Pass code ${state.passCode.split('').join(' ')}">${state.passCode}</p>
          <p><strong>${state.profile.name || 'Add your name in Profile'}</strong></p>
          <p class="small-print">${open ? 'Show this at the check-in desk.' : `This pass is a preview. ${GATES.checkIn.note}${until.past ? '' : ` That is ${until.days} days away, if the proposed dates hold.`}`}</p>
        </div>
        <form data-form="code" class="card" novalidate>
          <div class="card-head"><h2>Self check-in</h2>${questTag(state, 'checkin')}</div>
          <p class="muted">At the venue, enter the code shown at the check-in desk.</p>
          <div class="field"><label for="f-code">Venue code</label><input class="input mono" id="f-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" ${open && !checked ? '' : 'disabled'} placeholder="${state.preview ? PREVIEW_CHECK_IN_CODE : ''}"><p class="error" data-error-for="code" hidden></p>
            ${state.preview ? html`<p class="hint">Preview mode: use ${PREVIEW_CHECK_IN_CODE}.</p>` : ''}</div>
          <button class="btn primary" type="submit" ${open && !checked ? '' : 'disabled'}>${icon('scan')} Check in</button>
          ${!open ? html`<p class="small-print">${GATES.checkIn.note} Turn on preview mode in <a href="#/settings">Settings</a> to try it now.</p>` : ''}
        </form>
      </div>
    </section>`;
  },
  forms: {
    async code(form, event, ctx) {
      const state = ctx.store.get();
      const entered = normaliseCode(new FormData(form).get('code') ?? '');
      const slot = form.querySelector('[data-error-for="code"]');
      const fail = (message) => { slot.textContent = message; slot.hidden = false; form.querySelector('#f-code').setAttribute('aria-invalid', 'true'); form.querySelector('#f-code').focus(); };
      if (!entered) return fail('Enter the venue code.');
      let valid = false;
      if (state.preview) valid = entered === PREVIEW_CHECK_IN_CODE;
      else if (INTEGRATIONS.checkInCodeSha256) valid = (await sha256(entered)) === INTEGRATIONS.checkInCodeSha256;
      else return fail('Self check-in is not set up yet. Ask the check-in desk to scan your pass.');
      if (!valid) return fail('That code does not match. Check it at the desk and try again.');
      ctx.store.update((draft) => { draft.checkIn = { at: ctx.now(), method: 'code', preview: draft.preview }; });
    },
  },
};
