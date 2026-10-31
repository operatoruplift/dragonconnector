import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { validateWaitlist } from '../lib/validate.js';
import { EVENT, TRACKS } from '../data/event.js';
import { ROLES } from '../data/people.js';
import { SERVICES, errorSummary, field, head, liveMode, questTag, readForm, roleLabel, showErrors, trackTitle } from './common.js';

let sending = false; // while an entry is on its way, say so rather than "not sent"

function entryStatus(state, ctx) {
  const entry = state.waitlist;
  if (entry.sent) return 'Your entry reached the organizers. They will email you about registration.';
  if (sending) return 'Sending your entry to the organizers…';
  if (!SERVICES) return 'Your entry is saved on this device. The official waitlist is not connected yet, so nobody has received it.';
  if (!entry.consented && state.dataHome !== 'account') return 'Your entry is saved on this device only. Send it when you are ready.';
  if (liveMode(state, ctx) === 'offline') return 'Your entry is saved on this device and is sent when you are back online.';
  return 'Your entry is saved on this device but has not reached the organizers yet.';
}

/** Send the saved entry and say how it went. */
async function send(ctx) {
  sending = true;
  ctx.rerender();
  try {
    await ctx.backend?.syncNow();
  } finally {
    sending = false;
  }
  const state = ctx.store.get();
  if (state.waitlist?.sent) ctx.toast('The organizers will email you about registration.', { title: 'You are on the list' });
  else if (ctx.backend) ctx.toast(entryStatus(state, ctx), { title: 'Not sent yet' });
}

export default {
  title: () => 'Waitlist',
  live: false,
  render(state, params, ctx) {
    const entry = state.waitlist;
    const editing = params[0] === 'edit';
    const intro = head('Step 01 · Get in', 'Join the waitlist', `Registration for ${EVENT.name} is not open yet. Join the waitlist to show your interest and be ready when it opens.`);
    if (entry && !editing) {
      return html`<section class="view">${intro}
        <div class="card accent">
          <div class="card-head"><p class="eyebrow">You are on the list</p>${questTag(state, 'waitlist')}</div>
          <h2>${entry.name}</h2>
          <dl class="summary-list"><div><dt>Email</dt><dd>${entry.email}</dd></div><div><dt>Role</dt><dd>${roleLabel(entry.role)}</dd></div><div><dt>Track</dt><dd>${entry.track ? trackTitle(entry.track) : 'Not sure yet'}</dd></div><div><dt>Joined</dt><dd>${new Date(entry.joinedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div></dl>
          <p class="muted">${entryStatus(state, ctx)}</p>
          <div class="form-actions"><a class="btn primary" href="#/register">Pre-register next ${icon('arrow')}</a>${SERVICES && !entry.sent && !sending ? html`<button type="button" class="btn" data-action="send">${icon('send')} Send my entry</button>` : ''}<a class="btn" href="#/waitlist/edit">Edit entry</a><button type="button" class="btn ghost" data-action="leave">Leave the waitlist</button></div>
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
        <div class="field"><label class="option"><input type="checkbox" name="consent" ${entry ? 'checked' : ''}><span>${SERVICES
          ? html`Send my entry to the Dragon Connector organizers so they can email me about registration. It is stored in their database. <a href="#/docs/privacy">How your data is kept</a>`
          : 'I understand my entry stays on this device until the official waitlist is connected.'}</span></label><p class="error" data-error-for="consent" hidden></p></div>
        <div class="form-actions"><button class="btn primary" type="submit">${icon('list')} ${entry ? 'Save changes' : 'Join the waitlist'}</button>${entry ? html`<a class="btn ghost" href="#/waitlist">Cancel</a>` : ''}</div>
      </form>
    </section>`;
  },
  forms: {
    async join(form, event, ctx) {
      const data = readForm(form);
      if (!showErrors(form, validateWaitlist(data))) return;
      const previous = ctx.store.get().waitlist;
      const entry = {
        name: data.name.trim(), email: data.email.trim(), role: data.role, track: data.track || '', joinedAt: previous?.joinedAt ?? ctx.now(),
        sent: false, consented: SERVICES, replace: Boolean(previous?.sent && previous.linked),
      };
      const unchanged = previous?.sent && ['name', 'email', 'role', 'track'].every((key) => previous[key] === entry[key]);
      if (unchanged) Object.assign(entry, { sent: true, linked: previous.linked, replace: false });
      ctx.store.update((state) => {
        state.waitlist = entry;
        state.profile.name ||= entry.name;
        state.profile.email ||= entry.email;
        state.profile.role ||= entry.role;
        if (entry.track && !state.profile.tracks.length) state.profile.tracks = [entry.track];
      });
      ctx.navigate('waitlist');
      ctx.rerender();
      if (!entry.sent) {
        await send(ctx);
        ctx.rerender();
      }
    },
  },
  actions: {
    async send(button, event, ctx) {
      button.disabled = true;
      ctx.store.update((state) => { if (state.waitlist) state.waitlist.consented = true; });
      await send(ctx);
      ctx.rerender();
    },
    async leave(button, event, ctx) {
      const entry = ctx.store.get().waitlist;
      const sent = Boolean(entry?.sent && ctx.backend);
      if (!confirm(sent ? 'Leave the waitlist? Your entry is deleted from this device and from the organizers\' list.' : 'Leave the waitlist and delete your entry from this device?')) return;
      if (sent) {
        const result = await ctx.backend.leaveWaitlist();
        if (result.error) {
          ctx.toast(result.error, { title: 'Still on the list' });
          return;
        }
        if (!result.removed) ctx.toast('Your entry was sent before you had an account, so it cannot be traced back to you. Ask the organizers to remove it.', { title: 'Removed from this device', duration: 8000 });
      }
      ctx.store.update((state) => { state.waitlist = null; });
      ctx.rerender();
    },
  },
};
