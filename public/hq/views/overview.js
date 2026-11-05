// The organizer's first screen: the headline numbers, the switches, sign-ups and who is coming.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { bars, columns, tile } from '../charts.js';
import { EXPERIENCE, SWITCHES, ago, lookingLabel, people, roleLabel, signupsByDay, stats, tally, threads, trackLabel } from '../model.js';
import { accountsNotice, head, statusPill, waiting } from './common.js';

export default {
  title: () => 'Overview',
  roles: ['organizer'],
  render(state, params, ctx) {
    if (!state.event) return html`<section class="view">${head('HQ', 'Overview')}${waiting(state)}</section>`;
    const event = state.event;
    const numbers = stats(event);
    const rows = people(event);
    const settings = event.settings ?? {};
    const recent = rows.slice(0, 6);
    const inbox = threads(event).filter((thread) => thread.waiting).slice(0, 4);
    return html`<section class="view">
      ${head('HQ · Overview', 'Dragon Connector HQ', `Everything about the event, live from the database. Updated ${ago(state.loadedAt, ctx.now()).toLowerCase()}.`)}
      ${state.accountsOn === false ? accountsNotice() : ''}

      <div class="kpis">
        ${tile('Waitlist', numbers.waitlist, 'Hear first when registration opens', '#/people?filter=waitlist')}
        ${tile('Registered', numbers.registered, numbers.unconfirmed ? `${numbers.unconfirmed} not confirmed yet` : 'Confirmed registrations', '#/people?filter=registered')}
        ${tile('Checked in', numbers.checkedIn, `of ${numbers.registered + numbers.unconfirmed} registered`, '#/door')}
        ${tile('Teams', numbers.teams, `${numbers.withoutTeam} registered without a team`, '#/teams')}
        ${tile('Projects', numbers.submitted, `${numbers.drafts} ${numbers.drafts === 1 ? 'draft' : 'drafts'} in progress`, '#/projects')}
        ${tile('Inbox', numbers.waiting, numbers.waiting === 1 ? 'conversation waits for a reply' : 'conversations wait for a reply', '#/inbox')}
        ${tile('Sponsor enquiries', numbers.inquiries, `${numbers.newInquiries} new`, '#/sponsors')}
      </div>

      <section class="card" aria-labelledby="switches-title">
        <div class="card-head"><h2 id="switches-title">Event switches</h2><a class="btn small" href="#/event">${icon('settings')} Change</a></div>
        <ul class="switch-strip">${SWITCHES.map((item) => html`<li><span>${item.title}</span><span class="pill${settings[item.id] ? ' gold' : ''}">${settings[item.id] ? 'Open' : 'Closed'}</span></li>`)}</ul>
      </section>

      <section class="card">${columns(signupsByDay(event, ctx.now()), { title: 'Sign-ups per day, last 3 weeks (waitlist and registrations)', unit: ['sign-up', 'sign-ups'], column: 'Sign-ups' })}</section>

      <div class="grid cols-2">
        <section class="card">${bars(tally(rows.flatMap((row) => row.tracks), trackLabel), { title: 'Tracks people chose', empty: 'No tracks chosen yet.' })}</section>
        <section class="card">${bars(tally(rows.map((row) => row.role), roleLabel), { title: 'Roles', empty: 'No roles yet.' })}</section>
        <section class="card">${bars(tally(rows.map((row) => row.experience), (id) => EXPERIENCE[id] ?? id), { title: 'Hackathon experience (registered)', empty: 'Nobody has registered yet.' })}</section>
        <section class="card">${bars(tally((event.profiles ?? []).map((profile) => profile.looking_for), lookingLabel), { title: 'What builders are looking for', empty: 'No builder profiles yet.' })}</section>
      </div>

      <div class="grid cols-2">
        <section class="card" aria-labelledby="recent-title">
          <div class="card-head"><h2 id="recent-title">Newest people</h2><a class="small-print" href="#/people">Everyone</a></div>
          ${recent.length ? html`<ul class="plain-list">${recent.map((row) => html`<li><a href="#/people/${row.key}">${row.name}</a>${statusPill(row.status)}<span class="small-print">${ago(row.joinedAt, ctx.now())}</span></li>`)}</ul>` : html`<p class="muted">Nobody yet. Share dragonconnector.com/app to fill the waitlist.</p>`}
        </section>
        <section class="card" aria-labelledby="waiting-title">
          <div class="card-head"><h2 id="waiting-title">Waiting for a reply</h2><a class="small-print" href="#/inbox">Inbox</a></div>
          ${inbox.length ? html`<ul class="plain-list">${inbox.map((thread) => html`<li><a href="#/inbox/${thread.id}">${thread.name}</a><span class="snippet">${thread.last.body}</span><span class="small-print">${ago(thread.last.created_at, ctx.now())}</span></li>`)}</ul>` : html`<p class="muted">Nobody is waiting. Messages builders send from "Ask the organizers" arrive here.</p>`}
        </section>
      </div>
    </section>`;
  },
};
