// Judging. Organizers see the leaderboard and each judge's progress; judges see the projects to score.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { meter } from '../charts.js';
import { CRITERIA, FINALISTS, MAX_TOTAL, judgeProgress, leaderboard, scoreTotal, toCsv, trackLabel } from '../model.js';
import { empty, head, waiting } from './common.js';

const one = (value) => (value === null || value === undefined ? '–' : (Math.round(value * 10) / 10).toLocaleString('en-US'));

function results(state) {
  const event = state.event;
  const open = Boolean(event.settings?.judging_open);
  const board = leaderboard(event);
  const judges = judgeProgress(event);
  return html`<section class="view">
    ${head('Projects', 'Judging', `Each judge scores every submitted project on ${CRITERIA.length} criteria, ${CRITERIA[0].max} points each. Projects are ranked by the average of their full scores; conflicts of interest are left out. The top ${FINALISTS} are the finalists.`,
      html`<button type="button" class="btn small" data-action="export-results">${icon('download')} Results CSV</button>`)}
    <div class="card accent">
      <div class="card-head"><div class="stack" style="gap:4px"><p class="eyebrow">Judging is ${open ? 'open' : 'closed'}</p><p class="muted">${open ? 'Judges can save and change scores.' : 'Judges can read the projects; scores are frozen.'}</p></div>
        <button type="button" class="btn ${open ? '' : 'primary'}" data-action="switch" data-setting="judging_open" data-on="${open ? 'false' : 'true'}">${open ? 'Close judging' : 'Open judging'}</button></div>
    </div>
    <section class="card" aria-labelledby="judges-title">
      <div class="card-head"><h2 id="judges-title">Judges</h2><a class="small-print" href="#/crew">Add a judge</a></div>
      ${judges.length ? html`<ul class="plain-list">${judges.map((judge) => html`<li><span>${judge.name}</span>${meter(judge.of ? judge.scored + judge.conflicts : 0, judge.of || 1, `${judge.scored + judge.conflicts} of ${judge.of} projects done`)}<span class="small-print">${judge.scored} of ${judge.of} scored${judge.conflicts ? ` · ${judge.conflicts} conflict${judge.conflicts === 1 ? '' : 's'}` : ''}</span></li>`)}</ul>` : html`<p class="muted">No judges have HQ access yet. Add them in Crew; each gets a personal code.</p>`}
    </section>
    ${board.length ? html`<div class="table-wrap"><table class="data leaderboard">
      <thead><tr><th scope="col" class="num">Rank</th><th scope="col">Project</th><th scope="col" class="num">Average of ${MAX_TOTAL}</th>${CRITERIA.map((item) => html`<th scope="col" class="num"><abbr title="${item.label}">${item.short}</abbr></th>`)}<th scope="col" class="num">Judges</th></tr></thead>
      <tbody>${board.map((row) => html`<tr class="${row.finalist ? 'finalist' : ''}">
        <td data-label="Rank" class="num">${row.rank ?? '–'}${row.finalist ? html` <span class="pill gold">Finalist</span>` : ''}</td>
        <th scope="row" data-label="Project">${row.name}<span class="cell-sub">${[row.team ? `Team ${row.team}` : '', trackLabel(row.track)].filter(Boolean).join(' · ')}</span></th>
        <td data-label="Average" class="num"><strong>${one(row.average)}</strong>${meter(row.average, MAX_TOTAL, `Average ${one(row.average)} of ${MAX_TOTAL}`)}</td>
        ${CRITERIA.map((item) => html`<td data-label="${item.label}" class="num">${one(row.criteria[item.id])}</td>`)}
        <td data-label="Judges" class="num">${row.judged}${row.conflicts ? html`<span class="cell-sub">${row.conflicts} conflict${row.conflicts === 1 ? '' : 's'}</span>` : ''}</td>
      </tr>
      ${row.scores.length ? html`<tr class="breakdown"><td colspan="${CRITERIA.length + 4}"><details><summary>Scores and notes from ${row.scores.length} judge${row.scores.length === 1 ? '' : 's'}</summary>
        <ul class="plain-list">${row.scores.map((score) => html`<li><strong>${score.judge}</strong>${score.revoked ? html`<span class="pill">Revoked</span>` : ''}<span class="small-print">${score.conflict ? 'Conflict of interest: not scored' : score.total === null ? 'Not finished' : `${score.total} of ${MAX_TOTAL} · ${CRITERIA.map((item) => `${item.label} ${score[item.id]}`).join(' · ')}`}</span>${score.notes ? html`<span class="snippet">${score.notes}</span>` : ''}</li>`)}</ul>
      </details></td></tr>` : ''}`)}</tbody>
    </table></div>` : empty('No submitted projects yet. They appear here once builders submit, on Sunday 13 December.')}
  </section>`;
}

function judgeHome(state) {
  const data = state.projects;
  const first = state.staff.name.split(/\s+/)[0];
  if (!data) return html`<section class="view">${head('Judging', `Welcome, ${first}`)}${waiting(state)}</section>`;
  const done = data.projects.filter((project) => project.score && (project.score.conflict || scoreTotal(project.score) !== null)).length;
  return html`<section class="view">
    ${head('Judging', `Welcome, ${first}`, `Score each submitted project on the ${CRITERIA.length} criteria, ${CRITERIA[0].max} points each. If you know a team, mark a conflict of interest instead.`)}
    ${data.judging_open ? '' : html`<p class="notice"><strong>Judging is closed.</strong> You can read every project now; scoring opens when the organizers start judging.</p>`}
    <div class="card">
      <div class="card-head"><h2>Your progress</h2><span class="small-print">${done} of ${data.projects.length} done</span></div>
      ${meter(done, data.projects.length || 1, `${done} of ${data.projects.length} projects done`)}
      <ol class="rubric-list">${CRITERIA.map((item) => html`<li><strong>${item.max}</strong> ${item.label}</li>`)}</ol>
    </div>
    ${data.projects.length ? html`<ul class="project-list">${data.projects.map((project) => {
      const total = project.score ? scoreTotal(project.score) : null;
      const status = project.score?.conflict ? html`<span class="pill">Conflict</span>` : total !== null ? html`<span class="pill gold">${icon('check')} ${total} of ${MAX_TOTAL}</span>` : html`<span class="pill">To score</span>`;
      return html`<li><a class="project-row" href="#/score/${project.id}"><span class="stack" style="gap:2px"><strong>${project.name}</strong><span class="small-print">${[project.team ? `Team ${project.team}` : project.members.join(', '), trackLabel(project.track)].filter(Boolean).join(' · ')}</span>${project.tagline ? html`<span class="muted">${project.tagline}</span>` : ''}</span>${status}</a></li>`;
    })}</ul>` : empty('No projects have been submitted yet. Submissions close at 16:30 on Sunday 13 December; the list fills in as teams submit.')}
  </section>`;
}

export default {
  title: () => 'Judging',
  roles: ['organizer', 'judge'],
  render(state) {
    if (state.staff.role === 'judge') return judgeHome(state);
    if (!state.event) return html`<section class="view">${head('Projects', 'Judging')}${waiting(state)}</section>`;
    return results(state);
  },
  actions: {
    'export-results'(button, event, ctx) {
      ctx.download('dragon-connector-results.csv', toCsv(leaderboard(ctx.state.event), [
        ['Rank', (row) => row.rank ?? ''], ['Project', (row) => row.name], ['Team', (row) => row.team ?? ''], ['Track', (row) => trackLabel(row.track)],
        [`Average of ${MAX_TOTAL}`, (row) => one(row.average)], ...CRITERIA.map((item) => [item.label, (row) => one(row.criteria[item.id])]),
        ['Judges', (row) => row.judged], ['Conflicts', (row) => row.conflicts], ['Finalist', (row) => (row.finalist ? 'Yes' : '')],
      ]));
    },
  },
};
