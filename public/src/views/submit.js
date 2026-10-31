import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { submissionsOpen, formatOf } from '../lib/gates.js';
import { SUBMISSION_CHECKS, splitList, validateSubmission } from '../lib/validate.js';
import { GATES, TRACKS } from '../data/event.js';
import { SERVICES, errorSummary, field, head, previewNotice, questTag, readForm, showErrors, syncNote, trackTitle } from './common.js';

function readSubmission(form) {
  const data = readForm(form);
  return {
    name: String(data.name ?? '').trim(),
    tagline: String(data.tagline ?? '').trim(),
    track: data.track ?? '',
    description: String(data.description ?? '').trim(),
    stack: splitList(data.stack),
    solana: String(data.solana ?? '').trim(),
    repo: String(data.repo ?? '').trim(),
    video: String(data.video ?? '').trim(),
    live: String(data.live ?? '').trim(),
    checks: [].concat(data.checks ?? []),
  };
}

function summary(state, data) {
  return html`<dl class="summary-list">
    <div><dt>Project</dt><dd>${data.name}</dd></div><div><dt>Tagline</dt><dd>${data.tagline}</dd></div>
    <div><dt>Track</dt><dd>${trackTitle(data.track)}</dd></div><div><dt>Team</dt><dd>${state.team?.name ?? 'Solo'}</dd></div>
    <div><dt>Repository</dt><dd><a href="${data.repo}" target="_blank" rel="noopener noreferrer">${data.repo}</a></dd></div>
    ${data.video ? html`<div><dt>Video</dt><dd><a href="${data.video}" target="_blank" rel="noopener noreferrer">${data.video}</a></dd></div>` : ''}
    ${data.live ? html`<div><dt>Live demo</dt><dd><a href="${data.live}" target="_blank" rel="noopener noreferrer">${data.live}</a></dd></div>` : ''}
    ${data.stack?.length ? html`<div><dt>Built with</dt><dd>${data.stack.join(', ')}</dd></div>` : ''}
  </dl><p>${data.description}</p>`;
}

export default {
  title: () => 'Submit',
  live: false,
  render(state, params, ctx) {
    const submission = state.submission;
    const data = submission.data;
    const open = submissionsOpen(state, ctx.now());
    const format = formatOf(state);
    const intro = head('Step 07 · Event day', 'Submit your project', `Draft your submission any time. Final submission opens on event day and closes at code freeze (${format.codeFreeze}, proposed).`);
    if (submission.status === 'submitted' && params[0] !== 'edit') {
      return html`<section class="view">${intro}
        <div class="card accent">
          <div class="card-head"><p class="eyebrow">Submitted${submission.preview ? ' · preview' : ''}</p>${questTag(state, 'submit')}</div>
          <h2>${data.name}</h2>
          ${summary(state, data)}
          <p class="small-print">Submitted ${new Date(submission.submittedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. ${submission.preview
            ? 'This was a preview, so it stays on this device. Submit again once submissions open.'
            : SERVICES ? syncNote(state, ctx) : 'Saved on this device; the official submission platform will be announced with the rules.'}</p>
          <div class="form-actions"><a class="btn primary" href="#/guides/demo">Prepare your demo ${icon('arrow')}</a><a class="btn" href="#/submit/edit">Update submission</a></div>
        </div>
      </section>`;
    }
    return html`<section class="view">${intro}
      ${previewNotice(state)}
      ${open ? '' : html`<p class="notice quiet">${GATES.submissions.note} Your draft saves as you type.</p>`}
      <form data-form="submission" class="card" novalidate data-input="autosave">
        <div class="card-head"><h2>Project details</h2><div class="row">${questTag(state, 'draft')}${questTag(state, 'submit')}</div></div>
        ${errorSummary()}
        ${field('name', 'Project name', html`<input class="input" id="f-name" name="name" maxlength="60" value="${data.name ?? ''}">`)}
        ${field('tagline', 'One-line tagline', html`<input class="input" id="f-tagline" name="tagline" maxlength="120" value="${data.tagline ?? ''}">`, { hint: 'What it does, for whom, in one sentence.' })}
        ${field('track', 'Track', html`<select id="f-track" name="track"><option value="">Choose a track</option>${TRACKS.map((track) => html`<option value="${track.id}" ${data.track === track.id ? 'selected' : ''}>${track.title}</option>`)}</select>`)}
        ${field('description', 'Description', html`<textarea id="f-description" name="description" maxlength="2000" rows="6">${data.description ?? ''}</textarea>`, { hint: 'The problem, who it is for and what works today. At least 50 characters.' })}
        ${field('stack', 'Built with (optional)', html`<input class="input" id="f-stack" name="stack" value="${(data.stack ?? []).join(', ')}">`, { hint: 'Comma-separated, for example: Kotlin, Anchor, Mobile Wallet Adapter.' })}
        ${field('solana', 'Solana or partner integration (optional)', html`<textarea id="f-solana" name="solana" maxlength="800" rows="3">${data.solana ?? ''}</textarea>`, { hint: 'What runs on-chain or uses a partner tool. Judges score integration out of 25.' })}
        ${field('repo', 'Repository link', html`<input class="input" id="f-repo" name="repo" type="url" inputmode="url" placeholder="https://github.com/team/project" value="${data.repo ?? ''}">`)}
        ${field('video', 'Demo video link (optional)', html`<input class="input" id="f-video" name="video" type="url" inputmode="url" value="${data.video ?? ''}">`, { hint: 'A backup in case the live demo has network trouble.' })}
        ${field('live', 'Live demo link (optional)', html`<input class="input" id="f-live" name="live" type="url" inputmode="url" value="${data.live ?? ''}">`)}
        <p class="muted">Team: <strong>${state.team?.name ?? 'Solo'}</strong>${state.team ? '' : html` · <a href="#/team">Create a team</a>`}</p>
        <fieldset class="field" data-field="checks"><legend>Before you submit</legend>
          <div class="options">${SUBMISSION_CHECKS.map((check) => html`<label class="option"><input type="checkbox" name="checks" value="${check.id}" ${(data.checks ?? []).includes(check.id) ? 'checked' : ''}><span>${check.label}</span></label>`)}</div>
          <p class="error" data-error-for="checks" hidden></p></fieldset>
        <div class="form-actions">
          <button class="btn primary" type="submit" ${open ? '' : html`aria-disabled="true"`}>${icon('upload')} Submit project</button>
          <button class="btn" type="button" data-action="save">Save draft</button>
        </div>
      </form>
    </section>`;
  },
  inputs: {
    autosave(form, event, ctx) {
      const data = readSubmission(form);
      ctx.store.update((draft) => {
        draft.submission.data = data;
        draft.submission.updatedAt = ctx.now();
        if (draft.submission.status === 'empty' && data.name) draft.submission.status = 'draft';
      }, { quiet: true });
    },
  },
  actions: {
    save(button, event, ctx) {
      const form = button.form;
      const data = readSubmission(form);
      if (!showErrors(form, validateSubmission(data))) return;
      ctx.store.update((draft) => {
        draft.submission.data = data;
        draft.submission.updatedAt = ctx.now();
        if (draft.submission.status === 'empty') draft.submission.status = 'draft';
      });
      ctx.toast(syncNote(ctx.store.get(), ctx), { title: 'Draft saved' });
    },
  },
  forms: {
    submission(form, event, ctx) {
      const state = ctx.store.get();
      const data = readSubmission(form);
      if (!submissionsOpen(state, ctx.now())) {
        showErrors(form, {});
        ctx.toast(`${GATES.submissions.note} Your draft is saved.`, { title: 'Not open yet' });
        ctx.store.update((draft) => { draft.submission.data = data; if (draft.submission.status === 'empty' && data.name) draft.submission.status = 'draft'; });
        return;
      }
      if (!showErrors(form, validateSubmission(data, { final: true }))) return;
      // Submitted only through preview mode: kept on this device, a draft for the organizers.
      const preview = !submissionsOpen({ ...state, preview: false }, ctx.now());
      ctx.store.update((draft) => {
        draft.submission = { status: 'submitted', data, updatedAt: ctx.now(), submittedAt: ctx.now(), preview };
      });
      ctx.navigate('submit');
      ctx.rerender();
    },
  },
};
