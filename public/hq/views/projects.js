// Every project, submitted or still a draft, with its links and team.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { people, toCsv, trackLabel, when } from '../model.js';
import { empty, head, out, waiting } from './common.js';

const FILTERS = [{ id: 'submitted', label: 'Submitted' }, { id: 'draft', label: 'Drafts' }, { id: 'all', label: 'All' }];

/** A project's links, description and stack: shared with the judges' sheet. */
export function projectBody(project) {
  return html`
    <div class="row">${out(project.repo_url, 'Repository')}${out(project.video_url, 'Demo video')}${out(project.live_url, 'Live demo')}</div>
    ${project.description ? html`<p class="prose-text">${project.description}</p>` : ''}
    ${project.stack?.length ? html`<div class="chips">${project.stack.map((item) => html`<span class="chip">${item}</span>`)}</div>` : ''}
    ${project.integration ? html`<p class="small-print"><strong>How it uses Solana:</strong> ${project.integration}</p>` : ''}`;
}

export default {
  title: () => 'Projects',
  roles: ['organizer'],
  render(state) {
    if (!state.event) return html`<section class="view">${head('Projects', 'Projects')}${waiting(state)}</section>`;
    const event = state.event;
    const teams = new Map((event.teams ?? []).map((team) => [team.id, team]));
    const names = new Map(people(event).filter((row) => row.id).map((row) => [row.id, row.name]));
    const all = event.submissions ?? [];
    const filter = state.ui.projectFilter;
    const shown = all.filter((item) => filter === 'all' || item.status === filter);
    const count = (id) => all.filter((item) => id === 'all' || item.status === id).length;
    return html`<section class="view">
      ${head('Projects', 'Projects', `${count('submitted')} submitted and ${count('draft')} in draft. Judges see submitted projects only.`, html`<button type="button" class="btn small" data-action="export-projects">${icon('download')} Projects CSV</button>`)}
      <div class="segmented" role="group" aria-label="Show">${FILTERS.map((item) => html`<button type="button" data-action="project-filter" data-filter="${item.id}" aria-pressed="${filter === item.id}">${item.label} · ${count(item.id)}</button>`)}</div>
      ${shown.length ? shown.map((project) => html`<article class="card">
        <div class="card-head"><div class="stack" style="gap:4px"><h2>${project.name}</h2>${project.tagline ? html`<p class="muted">${project.tagline}</p>` : ''}</div>
          <span class="pill${project.status === 'submitted' ? ' gold' : ''}">${project.status === 'submitted' ? `Submitted ${when(project.submitted_at)}` : 'Draft'}</span></div>
        <p class="small-print">${teams.get(project.team_id) ? `Team ${teams.get(project.team_id).name}` : `By ${names.get(project.id) ?? 'a builder'}`}${project.track ? ` · ${trackLabel(project.track)}` : ''} · updated ${when(project.updated_at)}</p>
        ${projectBody(project)}
      </article>`) : empty(all.length ? 'No projects in this list.' : 'No projects yet. Builders start a submission in the app; drafts appear here, and judges see them once submitted.')}
    </section>`;
  },
  actions: {
    'project-filter'(button, event, ctx) { ctx.update((state) => { state.ui.projectFilter = button.dataset.filter; }); },
    'export-projects'(button, event, ctx) {
      const event_ = ctx.state.event;
      const teams = new Map((event_.teams ?? []).map((team) => [team.id, team.name]));
      ctx.download('dragon-connector-projects.csv', toCsv(event_.submissions ?? [], [
        ['Project', (row) => row.name], ['Tagline', (row) => row.tagline], ['Status', (row) => row.status], ['Track', (row) => trackLabel(row.track)],
        ['Team', (row) => teams.get(row.team_id) ?? ''], ['Repository', (row) => row.repo_url], ['Video', (row) => row.video_url], ['Live demo', (row) => row.live_url],
        ['Stack', (row) => row.stack], ['Submitted', (row) => row.submitted_at], ['Description', (row) => row.description],
      ]));
    },
  },
};
