import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { validateWaitlist } from '../lib/validate.js';
import { EVENT, INTEGRATIONS, TRACKS } from '../data/event.js';
import { ROLES } from '../data/people.js';
import { errorSummary, field, head, questTag, readForm, roleLabel, showErrors, trackTitle } from './common.js';

const connected = () => Boolean(INTEGRATIONS.waitlistEndpoint);

export default {
  title: () => 'Waitlist',
  live: false,
  render(state, params) {
    const entry = state.waitlist;
    const editing = params[0] === 'edit';
    const intro = head('Step 01 · Get in', 'Join the waitlist', `Registration for ${EVENT.name} is not open yet. Join the waitlist to show your interest and be ready when it opens.`);
    if (entry && !editing) {
      return html`<section class="view">${intro}
        <div class="card accent">
          <div class="card-head"><p class="eyebrow">You are on the list</p>${questTag(state, 'waitlist')}</div>
          <h2>${entry.name}</h2>
          <dl class="summary-list"><div><dt>Email</dt><dd>${entry.email}</dd></div><div><dt>Role</dt><dd>${roleLabel(entry.role)}</dd></div><div><dt>Track</dt><dd>${entry.track ? trackTitle(entry.track) : 'Not sure yet'}</dd></div><div><dt>Joined</dt><dd>${new Date(entry.joinedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div></dl>
          <p class="muted">${entry.sent ? 'Your entry was sent to the organizers.' : 'Your entry is saved on this device. The official waitlist is not connected yet, so nobody has received it; the app will say so here when it is.'}</p>
          <div class="form-actions"><a class="btn primary" href="#/register">Pre-register next ${icon('arrow')}</a><a class="btn" href="#/waitlist/edit">Edit entry</a><button type="button" class="btn ghost" data-action="leave">Leave the waitlist</button></div>
        </div>
      </section>`;
    }
    const value = entry ?? { name: state.profile.name, email: state.profile.email, role: state.profile.role, track: state.profile.tracks[0] ?? '' };
    return html`<section class="view">${intro}
      <form data-form="join" novalidate class="card">
        <div class="card-head"><h2>Your details</h2>${questTag(state, 'waitlist')}</div>
        ${errorSummary()}
        ${field('name', 'Name', html`<input class="input" id="f-name" name="name" autocomplete="name" maxlength="60" value="${value.name}" aria-describedby="f-name-error">`)}
        ${field('email', 'Email', html`<input class="input" id="f-email" name="email" type="email" autocomplete="email" inputmode="email" value="${value.email}" aria-describedby="f-email-error">`)}
        ${field('role', 'Role', html`<select id="f-role" name="role" aria-describedby="f-role-error"><option value="">Choose a role</option>${ROLES.map((role) => html`<option value="${role.id}" ${value.role === role.id ? 'selected' : ''}>${role.label}</option>`)}</select>`)}
        ${field('track', 'Track you are most interested in', html`<select id="f-track" name="track"><option value="">Not sure yet</option>${TRACKS.map((track) => html`<option value="${track.id}" ${value.track === track.id ? 'selected' : ''}>${track.title}</option>`)}</select>`)}
        <div class="field"><label class="option"><input type="checkbox" name="consent" ${entry ? 'checked' : ''}><span>${connected()
          ? 'Send my entry to the Dragon Connector organizers so they can email me about registration.'
          : 'I understand my entry stays on this device until the official waitlist is connected.'}</span></label><p class="error" data-error-for="consent" hidden></p></div>
        <div class="form-actions"><button class="btn primary" type="submit">${icon('list')} ${entry ? 'Save changes' : 'Join the waitlist'}</button>${entry ? html`<a class="btn ghost" href="#/waitlist">Cancel</a>` : ''}</div>
      </form>
    </section>`;
  },
  forms: {
    async join(form, event, ctx) {
      const data = readForm(form);
      if (!showErrors(form, validateWaitlist(data))) return;
      const entry = { name: data.name.trim(), email: data.email.trim(), role: data.role, track: data.track || '', joinedAt: ctx.store.get().waitlist?.joinedAt ?? ctx.now(), sent: false };
      if (connected()) {
        try {
          const response = await fetch(INTEGRATIONS.waitlistEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
          entry.sent = response.ok;
        } catch { entry.sent = false; }
        if (!entry.sent) ctx.toast('We could not reach the waitlist service. Your entry is saved on this device; try again later.', { title: 'Not sent' });
      }
      ctx.store.update((state) => {
        state.waitlist = entry;
        state.profile.name ||= entry.name;
        state.profile.email ||= entry.email;
        state.profile.role ||= entry.role;
        if (entry.track && !state.profile.tracks.length) state.profile.tracks = [entry.track];
      });
      ctx.navigate('waitlist');
      ctx.rerender();
    },
  },
  actions: {
    leave(button, event, ctx) {
      if (!confirm('Leave the waitlist and delete your entry from this device?')) return;
      ctx.store.update((state) => { state.waitlist = null; });
      ctx.rerender();
    },
  },
};
