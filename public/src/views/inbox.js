import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { answer, QUICK_QUESTIONS } from '../lib/guide.js';
import { relativeTime } from '../lib/time.js';
import { latestAt } from '../lib/backend.js';
import { SAMPLE_PROFILES } from '../data/people.js';
import { avatar, back, canGoLive, connectCard, head, liveMode } from './common.js';

const lastAt = (thread) => thread.messages.at(-1)?.at ?? 0;
const AVATARS = { guide: 'Dragon Guide', announcements: 'Dragon Connector', organizers: 'Organizers', team: null };

function threadAvatar(state, thread) {
  if (thread.kind === 'team') return avatar(state.team?.name ?? 'Team');
  return avatar(AVATARS[thread.kind] ?? thread.title);
}

function authorOf(thread, item) {
  if (item.from === 'me') return 'You';
  if (item.from === 'guide') return 'Dragon Guide';
  if (item.from === 'organizers') return 'Organizers';
  if (thread.remote) return thread.people?.[item.from]?.name ?? 'Former member';
  return thread.title;
}

function message(thread, item, now) {
  if (item.from === 'system') return html`<p class="msg system">${item.text}</p>`;
  const author = authorOf(thread, item);
  const when = item.pending ? 'Sending…' : item.failed ? 'Not sent' : relativeTime(item.at, now);
  return html`<div class="msg${item.from === 'me' ? ' me' : ''}${item.pending ? ' pending' : ''}${item.failed ? ' failed' : ''}"><span class="sr-only">${author}: </span><span class="text">${item.text}</span>
    ${item.links?.length ? html`<div class="row links">${item.links.map((link) => html`<a class="chip gold" href="#/${link.route}">${link.label}</a>`)}</div>` : ''}
    <span class="meta">${author} · ${when}</span>
    ${item.failed ? html`<span class="retry"><span>${typeof item.failed === 'string' ? item.failed : 'It was not delivered.'}</span><button type="button" class="chip" data-action="retry" data-id="${item.id}">Retry</button></span>` : ''}</div>`;
}

function inboxNote(mode, ctx) {
  if (mode === 'local') return 'Messages stay on this device. Live messaging between builders arrives when accounts go live.';
  if (mode === 'device') return 'Messages stay on this device until you connect your details.';
  if (mode === 'offline') return 'You are offline. Messages you write are sent when you are back online.';
  if (mode === 'guest') return `${ctx.backend.problem() || 'Accounts are not available right now.'} Messages to sample profiles stay on this device.`;
  return 'Messages to builders, your team and the organizers are delivered live. Messages to sample profiles and the Dragon Guide stay on this device.';
}

export default {
  title: (state, params) => (params[0] ? state.threads[params[0]]?.title ?? 'Conversation' : 'Messages'),
  render(state, params, ctx) {
    const now = ctx.now();
    if (!params[0]) {
      const mode = liveMode(state, ctx);
      const threads = Object.values(state.threads).sort((a, b) => lastAt(b) - lastAt(a));
      const askOrganizers = canGoLive(mode) && !threads.some((thread) => thread.kind === 'organizers');
      return html`<section class="view">
        ${head('Step 06 · Find your crew', 'Messages', 'Announcements from the organizers, your team chat, intros to builders and the Dragon Guide.')}
        ${mode === 'device' ? connectCard() : ''}
        <ul class="threads">${threads.map((thread) => {
          const last = thread.messages.at(-1);
          return html`<li><a class="thread" href="#/inbox/${thread.id}">${threadAvatar(state, thread)}
            <span><strong>${thread.title}</strong><span class="preview">${last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : thread.subtitle}</span></span>
            <span class="when">${last ? relativeTime(last.at, now) : ''}${thread.unread ? html`<span class="pill done" aria-label="${thread.unread} unread">${thread.unread}</span>` : ''}</span></a></li>`;
        })}</ul>
        <p class="small-print">${inboxNote(mode, ctx)}</p>
        <div class="row"><a class="btn" href="#/team">${icon('team')} Find someone to message</a>${askOrganizers ? html`<button type="button" class="btn" data-action="ask-organizers">${icon('inbox')} Ask the organizers</button>` : ''}</div>
      </section>`;
    }
    const thread = state.threads[params[0]];
    if (!thread) return html`<section class="view">${back('inbox', 'Messages')}<h1 tabindex="-1">Conversation not found</h1><p class="muted">It may have been deleted from this device.</p></section>`;
    const sample = thread.kind === 'dm' && SAMPLE_PROFILES.some((profile) => profile.id === thread.with);
    const sentToSample = sample && thread.messages.some((item) => item.from === 'me');
    return html`<section class="view chat">
      <div class="stack" style="gap:8px">${back('inbox', 'Messages')}
        <div class="row">${threadAvatar(state, thread)}<div class="stack" style="gap:0"><h1 tabindex="-1" style="font-size:1.4rem">${thread.title}</h1><span class="small-print">${thread.subtitle ?? ''}</span></div>${sample ? html`<span class="pill">Sample profile</span>` : ''}</div>
      </div>
      <div class="messages" id="messages" aria-live="polite">
        ${thread.messages.map((item) => message(thread, item, now))}
        ${sentToSample ? html`<p class="msg system">${thread.title} is a sample profile. Your message is saved on this device and will not be answered.</p>` : ''}
        ${thread.kind === 'guide' && thread.typing ? html`<p class="typing">Dragon Guide is typing…</p>` : ''}
      </div>
      ${thread.readOnly ? html`<p class="small-print">Announcements are read-only.</p>` : html`<div class="stack" style="gap:8px">
        ${thread.kind === 'guide' ? html`<div class="quick-replies" aria-label="Suggested questions">${QUICK_QUESTIONS.map((question) => html`<button type="button" class="chip" data-action="ask" data-question="${question}">${question}</button>`)}</div>` : ''}
        <form class="composer" data-form="send" novalidate>
          <label class="sr-only" for="composer">Message ${thread.title}</label>
          <textarea id="composer" name="text" maxlength="1000" rows="1" placeholder="${thread.kind === 'guide' ? 'Ask about dates, venue, prizes…' : thread.kind === 'organizers' ? 'Ask the organizers a question' : 'Write a message'}" data-input="draft">${thread.draft ?? ''}</textarea>
          <button class="btn primary" type="submit" aria-label="Send">${icon('send')}</button>
        </form></div>`}
    </section>`;
  },
  mount(root, state, params, ctx) {
    const thread = state.threads[params[0]];
    if (!thread) return null;
    scrollTo(0, document.documentElement.scrollHeight);
    if (thread.unread || (thread.readAt ?? 0) < latestAt(thread)) {
      ctx.store.update((draft) => {
        const target = draft.threads[thread.id];
        target.unread = 0;
        target.readAt = latestAt(target);
      });
    }
    const composer = root.querySelector('#composer');
    const send = (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); composer.form.requestSubmit(); }
    };
    composer?.addEventListener('keydown', send);
    return () => composer?.removeEventListener('keydown', send);
  },
  inputs: {
    // Keep what people are typing safe across re-renders.
    draft(textarea, event, ctx) {
      const id = location.hash.split('/')[2];
      ctx.store.update((draft) => { if (draft.threads[id]) draft.threads[id].draft = textarea.value; }, { quiet: true });
    },
  },
  forms: {
    send(form, event, ctx) {
      const id = decodeURIComponent(location.hash.split('/')[2] ?? '');
      const text = String(new FormData(form).get('text') ?? '').trim();
      if (!text) return;
      if (ctx.store.get().threads[id]?.remote) ctx.backend?.sendMessage(id, text);
      else sendMessage(ctx, id, text);
    },
  },
  actions: {
    ask(button, event, ctx) { sendMessage(ctx, 'guide', button.dataset.question); },
    retry(button, event, ctx) {
      ctx.backend?.retryMessage(decodeURIComponent(location.hash.split('/')[2] ?? ''), button.dataset.id);
    },
    async 'ask-organizers'(button, event, ctx) {
      button.disabled = true;
      const result = await ctx.backend.organizerChat();
      button.disabled = false;
      if (result.error) {
        ctx.toast(result.error, { title: 'Not available' });
        return;
      }
      ctx.navigate(`inbox/${result.threadId}`);
    },
  },
};

function sendMessage(ctx, id, text) {
  const at = ctx.now();
  ctx.store.update((draft) => {
    const thread = draft.threads[id];
    thread.messages.push({ id: `m${at}`, from: 'me', at, text });
    thread.draft = '';
    if (thread.kind === 'guide') thread.typing = true;
  });
  if (id !== 'guide') return;
  setTimeout(() => {
    const reply = answer(text);
    ctx.store.update((draft) => {
      const thread = draft.threads.guide;
      thread.typing = false;
      thread.messages.push({ id: `g${Date.now()}`, from: 'guide', at: ctx.now(), text: reply.text, links: reply.links ?? [] });
      if (!location.hash.startsWith('#/inbox/guide')) thread.unread = (thread.unread || 0) + 1;
    });
  }, 650);
}
