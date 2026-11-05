// Announcements: published to every builder's app at once, or scheduled for later.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { when } from '../model.js';
import { back, empty, head, waiting } from './common.js';

// datetime-local works in the device's time zone; HQ shows and stores times as real instants.
const localInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const instant = (value) => (value ? new Date(value).toISOString() : null);

function composer(item = null) {
  const scheduled = item && Date.parse(item.published_at) > Date.now();
  return html`<form class="card" data-form="${item ? 'edit-announcement' : 'announce'}" ${item ? html`data-id="${item.id}"` : ''} novalidate>
    <div class="field"><label for="f-message">${item ? 'Announcement' : 'New announcement'}</label><textarea id="f-message" name="message" maxlength="2000" required>${item?.body ?? ''}</textarea>
      <p class="hint">Every builder sees it in Messages, under Announcements. Plain text, up to 2,000 characters.</p></div>
    <div class="field"><label for="f-when">Publish</label><input class="input" id="f-when" name="when" type="datetime-local" value="${scheduled ? localInput(item.published_at) : ''}">
      <p class="hint">Leave empty to publish ${item ? 'with the current time kept' : 'now'}. A future time schedules it; it appears then.</p></div>
    <div class="form-actions"><button class="btn primary" type="submit">${icon('megaphone')} ${item ? 'Save changes' : 'Publish'}</button>${item ? html`<a class="btn ghost" href="#/announcements">Cancel</a>` : ''}</div>
  </form>`;
}

export default {
  title: () => 'Announcements',
  roles: ['organizer'],
  live: (params) => !params[0],
  render(state, params, ctx) {
    if (!state.event) return html`<section class="view">${head('Messages', 'Announcements')}${waiting(state)}</section>`;
    const list = state.event.announcements ?? [];
    if (params[0]) {
      const item = list.find((entry) => String(entry.id) === params[0]);
      return html`<section class="view">${back('announcements', 'Announcements')}${item ? html`${head('Messages', 'Edit announcement')}${composer(item)}` : head('Messages', 'Not found', 'This announcement was deleted.')}</section>`;
    }
    return html`<section class="view">
      ${head('Messages', 'Announcements', 'Posts every builder sees in the app, newest first.')}
      ${composer()}
      ${list.length ? html`<ul class="announcement-list">${list.map((item) => {
        const scheduled = Date.parse(item.published_at) > ctx.now();
        return html`<li class="card">
          <div class="card-head"><span class="pill${scheduled ? '' : ' gold'}">${scheduled ? `Scheduled · ${when(item.published_at)}` : `Published · ${when(item.published_at)}`}</span>
            <div class="row"><a class="btn small" href="#/announcements/${item.id}">${icon('pen')} Edit</a><button type="button" class="btn ghost small" data-action="delete-announcement" data-id="${item.id}">${icon('trash')} Delete</button></div></div>
          <p class="prose-text">${item.body}</p>
        </li>`;
      })}</ul>` : empty('No announcements yet.')}
    </section>`;
  },
  forms: {
    async announce(form, event, ctx) {
      const data = new FormData(form);
      const message = String(data.get('message') ?? '').trim();
      if (!message) { form.querySelector('#f-message').focus(); return; }
      const publishAt = instant(data.get('when'));
      const posted = await ctx.run(() => ctx.api.announce(message, publishAt), publishAt && Date.parse(publishAt) > Date.now() ? `Scheduled for ${when(publishAt)}.` : 'Published to every builder.');
      if (posted) form.reset();
    },
    async 'edit-announcement'(form, event, ctx) {
      const data = new FormData(form);
      const message = String(data.get('message') ?? '').trim();
      if (!message) { form.querySelector('#f-message').focus(); return; }
      const saved = await ctx.run(() => ctx.api.editAnnouncement(Number(form.dataset.id), message, instant(data.get('when'))), 'Announcement saved.');
      if (saved) ctx.navigate('announcements');
    },
  },
  actions: {
    async 'delete-announcement'(button, event, ctx) {
      if (!confirm('Delete this announcement? It disappears from every builder\'s app.')) return;
      await ctx.run(() => ctx.api.deleteAnnouncement(Number(button.dataset.id)), 'Announcement deleted.');
    },
  },
};
