// The organizer inbox: each builder's private line from "Ask the organizers" in the app. Replies
// arrive in the builder's app as "Organizers". Builders' own chats never appear in HQ.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { ago, people, threads, when } from '../model.js';
import { back, empty, head, waiting } from './common.js';

export default {
  title: () => 'Inbox',
  roles: ['organizer'],
  render(state, params, ctx) {
    if (!state.event) return html`<section class="view">${head('Messages', 'Inbox')}${waiting(state)}</section>`;
    const list = threads(state.event);
    if (params[0]) {
      const thread = list.find((item) => item.id === params[0]);
      if (!thread) return html`<section class="view">${back('inbox', 'Inbox')}${head('Messages', 'Not found', 'This conversation is no longer in the inbox. The builder may have deleted their data.')}</section>`;
      const person = people(state.event).find((row) => row.id === thread.builder_id);
      return html`<section class="view">
        ${back('inbox', 'Inbox')}
        ${head('Messages', thread.name, person ? html`<a href="#/people/${person.key}">Their details</a>` : '')}
        <ol class="hq-messages">${thread.messages.map((message) => html`<li class="${message.from_organizers ? 'ours' : 'theirs'}"><span class="who">${message.from_organizers ? 'Organizers' : thread.name} · ${when(message.created_at)}</span><p>${message.body}</p></li>`)}</ol>
        <form class="card" data-form="reply" data-thread="${thread.id}" novalidate>
          <div class="field"><label for="f-reply">Reply as the organizers</label><textarea id="f-reply" name="reply" maxlength="1000" required data-input="draft">${state.ui.replies[thread.id] ?? ''}</textarea>
            <p class="hint">It arrives in ${thread.name}'s app, signed "Organizers".</p></div>
          <div class="form-actions"><button class="btn primary" type="submit">${icon('send')} Send reply</button></div>
        </form>
      </section>`;
    }
    return html`<section class="view">
      ${head('Messages', 'Inbox', 'Questions builders send from "Ask the organizers" in the app. Conversations waiting for a reply come first.')}
      ${list.length ? html`<ul class="thread-list">${list.map((thread) => html`<li><a class="thread-row" href="#/inbox/${thread.id}">
        <span class="stack" style="gap:2px"><strong>${thread.name}</strong><span class="snippet">${thread.last.from_organizers ? 'You: ' : ''}${thread.last.body}</span></span>
        <span class="stack" style="gap:4px;justify-items:end">${thread.waiting ? html`<span class="pill gold">Waiting</span>` : ''}<span class="small-print">${ago(thread.last.created_at, ctx.now())}</span></span>
      </a></li>`)}</ul>` : empty('No messages yet.')}
    </section>`;
  },
  inputs: {
    draft(textarea, event, ctx) { ctx.state.ui.replies[textarea.closest('form').dataset.thread] = textarea.value; },
  },
  forms: {
    async reply(form, event, ctx) {
      const thread = form.dataset.thread;
      const text = String(new FormData(form).get('reply') ?? '').trim();
      if (!text) { form.querySelector('#f-reply').focus(); return; }
      const sent = await ctx.run(() => ctx.api.reply(thread, text), 'Reply sent.');
      if (sent) {
        delete ctx.state.ui.replies[thread];
        ctx.rerender({ force: true });
      }
    },
  },
};
