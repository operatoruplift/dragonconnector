import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { ictDate, instant, sessionState } from '../lib/time.js';
import { formatOf } from '../lib/gates.js';
import { EVENT, FORMATS } from '../data/event.js';
import { head, questTag } from './common.js';

const TYPES = { arrival: 'Arrival', ceremony: 'Ceremony', build: 'Build', meal: 'Meal', submission: 'Submission', judging: 'Judging', demo: 'Demos', checkpoint: 'Checkpoint' };
const view = { day: 0, mine: false };

export default {
  title: () => 'Schedule',
  render(state, params, ctx) {
    const format = formatOf(state);
    const now = ctx.now();
    const today = format.days.findIndex((day) => day.date === ictDate(now));
    const dayIndex = Math.min(view.day, format.days.length - 1);
    const day = format.days[dayIndex];
    const upcoming = day.sessions.find((session) => instant(day.date, session.start) > now);
    const sessions = day.sessions.filter((session) => !view.mine || state.bookmarks.includes(session.id));
    return html`<section class="view">
      ${head('Explore', 'Schedule', `The proposed programme. All times are ${EVENT.timezoneLabel}. Meals and production are planned scope, subject to budget and delivery confirmation.`)}
      <div class="card">
        <div class="card-head"><div class="segmented" role="group" aria-label="Format">${Object.values(FORMATS).map((item) => html`<button type="button" data-action="format" data-id="${item.id}" aria-pressed="${item.id === format.id}">${item.short}</button>`)}</div>${questTag(state, 'plan')}</div>
        <h2>${format.dateLabel}</h2>
        <p class="muted">${format.note} ${format.buildLabel}. Onboarding ${format.onboarding}.</p>
        <span class="pill">Proposed · not confirmed</span>
      </div>
      <div class="row">
        ${format.days.length > 1 ? html`<div class="segmented" role="tablist" aria-label="Day">${format.days.map((item, index) => html`<button type="button" role="tab" data-action="day" data-index="${index}" aria-selected="${index === dayIndex}">${item.label.split(' · ')[0]}${index === today ? ' · today' : ''}</button>`)}</div>` : ''}
        <button type="button" class="chip" data-action="mine" aria-pressed="${view.mine}">${icon('bookmark')} My plan (${state.bookmarks.filter((id) => format.days.some((item) => item.sessions.some((session) => session.id === id))).length})</button>
      </div>
      <h2>${day.label}</h2>
      ${sessions.length ? html`<ol class="sessions">${sessions.map((session) => {
        const status = sessionState(now, day.date, session, upcoming?.id);
        const saved = state.bookmarks.includes(session.id);
        return html`<li class="session ${session.type} ${status === 'now' ? 'now' : status === 'past' ? 'past' : ''}">
          <span class="time">${session.start}–${session.end}${status === 'now' ? html`<br><span class="pill done">Now</span>` : status === 'next' && today === dayIndex ? html`<br><span class="pill gold">Next</span>` : ''}</span>
          <span class="stack" style="gap:4px"><strong>${session.title}</strong><span class="eyebrow" style="color:var(--muted)">${TYPES[session.type] ?? session.type}</span>${session.detail ? html`<span class="detail">${session.detail}</span>` : ''}</span>
          <button type="button" class="bookmark" data-action="bookmark" data-id="${session.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from' : 'Save to'} my plan: ${session.title}">${icon('bookmark')}</button>
        </li>`;
      })}</ol>` : html`<p class="muted">You have not saved any sessions for this day. Tap the bookmark on a session to add it.</p>`}
    </section>`;
  },
  actions: {
    format(button, event, ctx) { view.day = 0; ctx.store.update((draft) => { draft.format = button.dataset.id; }); },
    day(button, event, ctx) { view.day = Number(button.dataset.index); ctx.rerender(); },
    mine(button, event, ctx) { view.mine = !view.mine; ctx.rerender(); },
    bookmark(button, event, ctx) {
      const id = button.dataset.id;
      ctx.store.update((draft) => {
        draft.bookmarks = draft.bookmarks.includes(id) ? draft.bookmarks.filter((item) => item !== id) : [...draft.bookmarks, id];
      });
    },
  },
};
