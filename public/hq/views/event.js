// The event switches the app follows, and the venue code for self check-in.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { EVENT } from '../../src/data/event.js';
import { SWITCHES, when } from '../model.js';
import { accountsNotice, head, waiting } from './common.js';

export default {
  title: () => 'Event switches',
  roles: ['organizer'],
  render(state) {
    if (!state.event) return html`<section class="view">${head('Event', 'Event switches')}${waiting(state)}</section>`;
    const settings = state.event.settings ?? {};
    return html`<section class="view">
      ${head('Event', 'Event switches', `The builder app follows these within a minute. Last changed ${when(settings.updated_at) || 'never'}.`)}
      ${state.accountsOn === false ? accountsNotice() : ''}
      <ul class="switch-list">${SWITCHES.map((item) => {
        const on = Boolean(settings[item.id]);
        return html`<li class="card${on ? ' accent' : ''}">
          <div class="card-head"><div class="stack" style="gap:4px"><h2>${item.title}</h2><p class="muted">${on ? item.on : item.off}</p></div>
            <div class="row"><span class="pill${on ? ' gold' : ''}">${on ? 'Open' : 'Closed'}</span><button type="button" class="btn ${on ? '' : 'primary'} small" data-action="switch" data-setting="${item.id}" data-on="${on ? 'false' : 'true'}">${on ? 'Close' : 'Open'}</button></div></div>
        </li>`;
      })}</ul>
      <form class="card" data-form="check-in-code" novalidate>
        <div class="card-head"><h2>Venue code for self check-in</h2></div>
        <p class="muted">Builders type this code in the app at the venue to check themselves in, once self check-in is open. Show it at the desk on event days, and change it if it leaks.</p>
        <div class="field"><label for="f-venue-code">Venue code</label><input class="input mono" id="f-venue-code" name="code" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${settings.check_in_code ?? ''}" placeholder="For example DRAGON 2026"><p class="hint">4 to 40 letters, digits, spaces or dashes. Leave empty to clear it.</p></div>
        <div class="form-actions"><button class="btn primary" type="submit">${icon('check')} Save code</button></div>
      </form>
      <div class="card"><div class="card-head"><h2>Links</h2></div><div class="row">
        <a class="btn small" href="${EVENT.appUrl}" target="_blank" rel="noopener noreferrer">Builder app ${icon('external')}</a>
        <a class="btn small" href="${EVENT.siteUrl}" target="_blank" rel="noopener noreferrer">Event site ${icon('external')}</a>
      </div></div>
    </section>`;
  },
  forms: {
    async 'check-in-code'(form, event, ctx) {
      const code = String(new FormData(form).get('code') ?? '');
      await ctx.run(() => ctx.api.setCheckInCode(code), code.trim() ? 'Venue code saved.' : 'Venue code cleared.');
    },
  },
};
