// Everyone who has shown up: registrations, builder profiles and the waitlist, with exports.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { TRACKS } from '../../src/data/event.js';
import { EXPERIENCE, PEOPLE_FILTERS, REGISTRATION_COLUMNS, ago, filterPeople, lookingLabel, people, roleLabel, toCsv, trackLabel, when } from '../model.js';
import { back, empty, head, statusPill, waiting } from './common.js';

function detail(state, row, ctx) {
  const facts = [
    ['Email', row.email ? html`<a href="mailto:${row.email}">${row.email}</a>` : ''],
    ['Phone', row.phone ? html`<a href="tel:${row.phone.replace(/\s+/g, '')}">${row.phone}</a>` : ''],
    ['Pass code', row.pass ? html`<span class="mono">${row.pass}</span>` : ''],
    ['Role', roleLabel(row.role)],
    ['Tracks', row.tracks.map(trackLabel).join(', ')],
    ['Team', row.team ? html`<a href="#/teams">${row.team.name}</a>` : ''],
    ['Looking for', lookingLabel(row.lookingFor)],
    ['Skills', row.skills.join(', ')],
    ['Languages', row.languages.join(', ')],
    ['Experience', EXPERIENCE[row.experience] ?? ''],
    ['Dietary needs', row.dietary],
    ['Access needs', row.access],
    ['Photos and video', row.media === null ? '' : row.media ? 'Agrees to appear' : 'Keep out of event media'],
    ['Checked in', row.checkedInAt ? when(row.checkedInAt) : row.pass ? 'Not yet' : ''],
    ['Joined', when(row.joinedAt)],
    ['GitHub', row.github ? html`<a href="${row.github}" target="_blank" rel="noopener noreferrer">${row.github}</a>` : ''],
    ['Profile', row.id ? (row.discoverable ? 'Visible to other builders' : 'Hidden from other builders') : ''],
    ['About', row.bio],
  ].filter(([, value]) => value);
  return html`<section class="view">
    ${back('people', 'People')}
    ${head(statusPill(row.status), row.name, row.status === 'waitlist' ? 'On the waitlist. They hear first when registration opens.' : '')}
    <div class="card"><dl class="summary-list">${facts.map(([label, value]) => html`<div><dt>${label}</dt><dd>${value}</dd></div>`)}</dl></div>
    <div class="form-actions">
      ${row.pass ? html`<a class="btn primary" href="#/door/${row.pass}">${icon('scan')} Open at the check-in desk</a>` : ''}
      ${row.waitlistId ? html`<button type="button" class="btn ghost" data-action="remove-waitlist" data-id="${row.waitlistId}">${icon('trash')} Remove from the waitlist</button>` : ''}
    </div>
    ${row.status === 'unconfirmed' ? html`<p class="notice quiet">They saved their details before the waitlist and pre-registration became one step. When registration opens, the app asks them to confirm.</p>` : ''}
  </section>`;
}

export default {
  title: () => 'People',
  roles: ['organizer'],
  render(state, params, ctx) {
    if (!state.event) return html`<section class="view">${head('People', 'People')}${waiting(state)}</section>`;
    const rows = people(state.event);
    if (params[0]) {
      const row = rows.find((item) => item.key === params[0]);
      return row ? detail(state, row, ctx) : html`<section class="view">${back('people', 'People')}${head('People', 'Not found', 'This person is no longer in the event database.')}</section>`;
    }
    const filter = ctx.query.filter ?? state.ui.peopleFilter;
    const shown = filterPeople(rows, { filter, query: state.ui.peopleQuery, track: state.ui.peopleTrack });
    return html`<section class="view">
      ${head('People', 'People', `${rows.length} ${rows.length === 1 ? 'person' : 'people'}: registrations, builder profiles and the waitlist.`, html`
        <button type="button" class="btn small" data-action="export" data-what="people">${icon('download')} Registrations CSV</button>
        <button type="button" class="btn small" data-action="export" data-what="catering">${icon('download')} Dietary and access CSV</button>`)}
      <div class="filter-row" role="group" aria-label="Filter people">
        <div class="chips">${PEOPLE_FILTERS.map((item) => {
          const count = filterPeople(rows, { filter: item.id }).length;
          return html`<button type="button" class="chip" data-action="people-filter" data-filter="${item.id}" aria-pressed="${filter === item.id}">${item.label} · ${count}</button>`;
        })}</div>
        <div class="row">
          <label class="sr-only" for="f-people-query">Search people</label>
          <input class="input" id="f-people-query" type="search" placeholder="Search names, emails, skills, teams or pass codes" value="${state.ui.peopleQuery}" data-input="people-query">
          <label class="sr-only" for="f-people-track">Track</label>
          <select id="f-people-track" data-change="people-track"><option value="">Every track</option>${TRACKS.map((track) => html`<option value="${track.id}" ${state.ui.peopleTrack === track.id ? 'selected' : ''}>${track.title}</option>`)}</select>
        </div>
      </div>
      ${shown.length ? html`<div class="table-wrap"><table class="data people-table">
        <thead><tr><th scope="col">Name</th><th scope="col">Status</th><th scope="col">Role</th><th scope="col">Track</th><th scope="col">Team</th><th scope="col">Checked in</th><th scope="col">Joined</th></tr></thead>
        <tbody>${shown.map((row) => html`<tr>
          <th scope="row" data-label="Name"><a href="#/people/${row.key}">${row.name}</a>${row.email ? html`<span class="cell-sub">${row.email}</span>` : ''}</th>
          <td data-label="Status">${statusPill(row.status)}</td>
          <td data-label="Role">${roleLabel(row.role)}</td>
          <td data-label="Track">${row.tracks.map(trackLabel).join(', ')}</td>
          <td data-label="Team">${row.team?.name ?? ''}</td>
          <td data-label="Checked in">${row.checkedInAt ? html`<span class="pill gold">${icon('check')} ${when(row.checkedInAt)}</span>` : ''}</td>
          <td data-label="Joined" class="num">${ago(row.joinedAt, ctx.now())}</td>
        </tr>`)}</tbody>
      </table></div>` : empty(rows.length ? 'Nobody matches these filters.' : 'Nobody yet. Waitlist entries, builder profiles and registrations appear here as they arrive.')}
    </section>`;
  },
  actions: {
    'people-filter'(button, event, ctx) {
      ctx.update((state) => { state.ui.peopleFilter = button.dataset.filter; });
      ctx.navigate('people');
    },
    export(button, event, ctx) {
      const rows = people(ctx.state.event);
      if (button.dataset.what === 'catering') {
        const needs = rows.filter((row) => ['registered', 'unconfirmed'].includes(row.status) && (row.dietary || row.access));
        ctx.download('dragon-connector-dietary-and-access.csv', toCsv(needs, [['Name', (row) => row.name], ['Dietary needs', (row) => row.dietary], ['Access needs', (row) => row.access], ['Status', (row) => row.status], ['Pass code', (row) => row.pass]]));
      } else {
        ctx.download('dragon-connector-people.csv', toCsv(rows, REGISTRATION_COLUMNS));
      }
    },
    async 'remove-waitlist'(button, event, ctx) {
      if (!confirm('Remove this person from the waitlist? Their entry is deleted from the event database.')) return;
      await ctx.run(() => ctx.api.removeWaitlist(Number(button.dataset.id)), 'Removed from the waitlist.');
      ctx.navigate('people');
    },
  },
  inputs: {
    'people-query'(input, event, ctx) { ctx.update((state) => { state.ui.peopleQuery = input.value; }); },
  },
  changes: {
    'people-track'(select, event, ctx) { ctx.update((state) => { state.ui.peopleTrack = select.value; }); },
  },
};
