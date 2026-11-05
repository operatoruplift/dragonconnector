// A judge's sheet for one project: the project itself, then the four criteria, a conflict of
// interest option and notes. Typed scores are kept while the judge moves around HQ until saved.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { CRITERIA, MAX_TOTAL, trackLabel, when } from '../model.js';
import { back, head, waiting } from './common.js';
import { projectBody } from './projects.js';

const readSheet = (form) => {
  const data = new FormData(form);
  const value = (name) => (data.get(name) === '' || data.get(name) === null ? null : Number(data.get(name)));
  return { ...Object.fromEntries(CRITERIA.map((item) => [item.id, value(item.id)])), notes: String(data.get('notes') ?? ''), conflict: data.get('conflict') === 'on' };
};

export const sheetTotal = (sheet) => (sheet.conflict ? null : CRITERIA.every((item) => Number.isInteger(sheet[item.id])) ? CRITERIA.reduce((sum, item) => sum + sheet[item.id], 0) : null);

/** Problems with a sheet before it is saved, keyed by field. */
export function sheetErrors(sheet) {
  if (sheet.conflict) return {};
  const errors = {};
  for (const item of CRITERIA) {
    const value = sheet[item.id];
    if (value === null) errors[item.id] = `Give ${item.label.toLowerCase()} a score from 0 to ${item.max}.`;
    else if (!Number.isInteger(value) || value < 0 || value > item.max) errors[item.id] = `${item.label} is a whole number from 0 to ${item.max}.`;
  }
  return errors;
}

export default {
  title: () => 'Score',
  roles: ['judge'],
  live: false, // background refreshes never redraw the sheet under the judge's fingers
  render(state, params) {
    const data = state.projects;
    if (!data) return html`<section class="view">${back('', 'Projects')}${head('Judging', 'Score a project')}${waiting(state)}</section>`;
    const list = data.projects;
    const position = list.findIndex((item) => item.id === params[0]);
    const project = list[position];
    if (!project) return html`<section class="view">${back('', 'Projects')}${head('Judging', 'Not found', 'This project is not submitted, or it was withdrawn.')}</section>`;
    const saved = project.score ?? {};
    const sheet = state.ui.sheets[project.id] ?? { ...Object.fromEntries(CRITERIA.map((item) => [item.id, saved[item.id] ?? null])), notes: saved.notes ?? '', conflict: Boolean(saved.conflict) };
    const total = sheetTotal(sheet);
    const open = data.judging_open;
    const previous = list[position - 1];
    const next = list[position + 1];
    return html`<section class="view">
      ${back('', 'Projects')}
      ${head(`Project ${position + 1} of ${list.length}`, project.name, project.tagline ?? '')}
      <div class="card">
        <p class="small-print">${project.team ? `Team ${project.team}: ` : ''}${project.members.join(', ')}${project.track ? ` · ${trackLabel(project.track)}` : ''} · submitted ${when(project.submitted_at)}</p>
        ${projectBody(project)}
      </div>
      <form class="card score-sheet" data-form="score" data-id="${project.id}" data-input="sheet" novalidate>
        <div class="card-head"><h2>Your scores</h2><output class="score-total" id="score-total" aria-live="polite">${sheet.conflict ? 'Conflict of interest' : total === null ? `– of ${MAX_TOTAL}` : `${total} of ${MAX_TOTAL}`}</output></div>
        ${open ? '' : html`<p class="notice"><strong>Judging is closed.</strong> Scores open when the organizers start judging. You can read the project now.</p>`}
        <div class="criteria">${CRITERIA.map((item) => html`<div class="field">
          <label for="f-${item.id}">${item.label} <span class="small-print">0 to ${item.max}</span></label>
          <input class="input score-input" id="f-${item.id}" name="${item.id}" type="number" inputmode="numeric" min="0" max="${item.max}" step="1" value="${sheet[item.id] ?? ''}" ${sheet.conflict || !open ? 'disabled' : ''} aria-describedby="f-${item.id}-error">
          <p class="error" data-error-for="${item.id}" id="f-${item.id}-error" hidden></p>
        </div>`)}</div>
        <label class="option"><input type="checkbox" name="conflict" ${sheet.conflict ? 'checked' : ''} ${open ? '' : 'disabled'}><span>I have a conflict of interest with this team<small>I know someone in it, advised it or work with it. My scores are left out.</small></span></label>
        <div class="field"><label for="f-notes">Notes <span class="small-print">only organizers see these</span></label><textarea id="f-notes" name="notes" maxlength="2000" ${open ? '' : 'disabled'}>${sheet.notes}</textarea></div>
        <div class="form-actions">
          <button class="btn primary" type="submit" ${open ? '' : 'disabled'}>${icon('check')} Save${next ? ' and go to the next project' : ''}</button>
          ${saved.updated_at ? html`<span class="small-print">Saved ${when(saved.updated_at)}</span>` : ''}
        </div>
      </form>
      <div class="row">${previous ? html`<a class="btn small" href="#/score/${previous.id}">${icon('back')} ${previous.name}</a>` : ''}<span class="spacer"></span>${next ? html`<a class="btn small" href="#/score/${next.id}">${next.name} ${icon('arrow')}</a>` : ''}</div>
    </section>`;
  },
  inputs: {
    // Keep what the judge types, and the total, without redrawing the form.
    sheet(form, event, ctx) {
      // An edited field loses its old error at once.
      if (event.target.getAttribute('aria-invalid')) {
        event.target.removeAttribute('aria-invalid');
        const slot = form.querySelector(`[data-error-for="${event.target.name}"]`);
        if (slot) slot.hidden = true;
      }
      const sheet = readSheet(form);
      ctx.state.ui.sheets[form.dataset.id] = sheet;
      for (const item of CRITERIA) form.querySelector(`[name="${item.id}"]`).disabled = sheet.conflict;
      const total = sheetTotal(sheet);
      form.querySelector('#score-total').textContent = sheet.conflict ? 'Conflict of interest' : total === null ? `– of ${MAX_TOTAL}` : `${total} of ${MAX_TOTAL}`;
    },
  },
  forms: {
    async score(form, event, ctx) {
      const sheet = readSheet(form);
      const errors = sheetErrors(sheet);
      form.querySelectorAll('[data-error-for]').forEach((slot) => { slot.hidden = true; slot.textContent = ''; });
      form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
      const entries = Object.entries(errors);
      if (entries.length) {
        for (const [name, message] of entries) {
          const slot = form.querySelector(`[data-error-for="${name}"]`);
          slot.textContent = message;
          slot.hidden = false;
          form.querySelector(`[name="${name}"]`).setAttribute('aria-invalid', 'true');
        }
        form.querySelector(`[name="${entries[0][0]}"]`).focus();
        return;
      }
      const id = form.dataset.id;
      const saved = await ctx.run(() => ctx.api.score(id, sheet, sheet.notes, sheet.conflict), sheet.conflict ? 'Conflict of interest recorded.' : `Saved: ${sheetTotal(sheet)} of ${MAX_TOTAL}.`);
      if (!saved) return;
      delete ctx.state.ui.sheets[id];
      const list = ctx.state.projects?.projects ?? [];
      const next = list[list.findIndex((item) => item.id === id) + 1];
      ctx.navigate(next ? `score/${next.id}` : '');
    },
  },
};
