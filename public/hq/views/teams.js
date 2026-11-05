// Teams, who is in them, what they are building, and who still needs a team.
import { html } from '../../src/lib/html.js';
import { EVENT } from '../../src/data/event.js';
import { lookingLabel, people, roleLabel, trackLabel } from '../model.js';
import { empty, head, waiting } from './common.js';

export default {
  title: () => 'Teams',
  roles: ['organizer'],
  render(state) {
    if (!state.event) return html`<section class="view">${head('People', 'Teams')}${waiting(state)}</section>`;
    const event = state.event;
    const rows = people(event);
    const byId = new Map(rows.filter((row) => row.id).map((row) => [row.id, row]));
    const projects = new Map((event.submissions ?? []).filter((item) => item.team_id).map((item) => [item.team_id, item]));
    const looking = rows.filter((row) => row.id && !row.team && ['team', 'cofounder'].includes(row.lookingFor));
    return html`<section class="view">
      ${head('People', 'Teams', `${(event.teams ?? []).length} teams of up to ${EVENT.teamMax}. ${looking.length} ${looking.length === 1 ? 'builder is' : 'builders are'} looking for one.`)}
      ${(event.teams ?? []).length ? html`<div class="grid cols-2">${event.teams.map((team) => {
        const project = projects.get(team.id);
        const joined = team.members.filter((member) => member.status === 'joined');
        return html`<article class="card">
          <div class="card-head"><h2>${team.name}</h2><span class="pill">${trackLabel(team.track)}</span></div>
          <ul class="plain-list">${team.members.map((member) => {
            const person = byId.get(member.user_id);
            return html`<li>${person ? html`<a href="#/people/${person.key}">${person.name}</a>` : 'Builder'}<span class="small-print">${roleLabel(person?.role)}${member.user_id === team.owner_id ? ' · created the team' : ''}</span>${member.status === 'invited' ? html`<span class="pill">Invited</span>` : ''}</li>`;
          })}</ul>
          <p class="small-print">${joined.length} of ${EVENT.teamMax} seats taken${team.open_roles?.length ? ` · looking for ${team.open_roles.map(roleLabel).join(', ')}` : ''}</p>
          <p>${project ? html`<a href="#/projects">${project.name}</a> <span class="pill${project.status === 'submitted' ? ' gold' : ''}">${project.status === 'submitted' ? 'Submitted' : 'Draft'}</span>` : html`<span class="muted">No project yet</span>`}</p>
        </article>`;
      })}</div>` : empty('No teams yet. Builders create teams in the app, under Teammates.')}
      <section class="card" aria-labelledby="looking-title">
        <div class="card-head"><h2 id="looking-title">Looking for a team</h2><span class="small-print">${looking.length}</span></div>
        ${looking.length ? html`<ul class="plain-list">${looking.map((row) => html`<li><a href="#/people/${row.key}">${row.name}</a><span class="small-print">${roleLabel(row.role)} · ${lookingLabel(row.lookingFor)}${row.skills.length ? ` · ${row.skills.slice(0, 4).join(', ')}` : ''}</span></li>`)}</ul>` : html`<p class="muted">Nobody is waiting for a team right now.</p>`}
      </section>
    </section>`;
  },
};
