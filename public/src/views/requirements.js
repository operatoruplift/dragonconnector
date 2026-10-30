import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { REQUIREMENTS, SUBMISSION_REQUIREMENTS } from '../data/content.js';
import { TRACKS } from '../data/event.js';
import { head, questTag } from './common.js';

export default {
  title: () => 'Requirements',
  render(state) {
    const total = REQUIREMENTS.reduce((sum, group) => sum + group.items.length, 0);
    const done = state.requirementsChecked.length;
    return html`<section class="view">
      ${head('Explore', 'Requirements', 'What to bring, the accounts to set up and what a submission needs. Final eligibility rules will be published before launch.')}
      <div class="card accent">
        <div class="card-head"><h2>Your checklist</h2>${questTag(state, 'checklist')}</div>
        <div class="meter" role="progressbar" aria-label="Checklist progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><span style="width:${Math.round((done / total) * 100)}%"></span></div>
        <p class="small-print">${done} of ${total} ready</p>
        ${REQUIREMENTS.map((group) => html`<fieldset><legend>${group.group}</legend><div class="options">${group.items.map((item) => html`<label class="option"><input type="checkbox" data-action="check" data-id="${item.id}" ${state.requirementsChecked.includes(item.id) ? 'checked' : ''}><span>${item.label}</span></label>`)}</div></fieldset>`)}
      </div>
      <div class="card">
        <h2>A submission needs</h2>
        <ul>${SUBMISSION_REQUIREMENTS.map((item) => html`<li>${item}</li>`)}</ul>
        <div class="row"><a class="btn small" href="#/submit">${icon('upload')} Draft your submission</a><a class="btn small ghost" href="#/docs/rules">Draft rules</a></div>
      </div>
      <div class="card">
        <h2>Track eligibility</h2>
        ${TRACKS.map((track) => html`<div class="stack" style="gap:4px"><h3>${track.title}</h3><p class="muted">${track.eligibility}</p></div>`)}
      </div>
    </section>`;
  },
  actions: {
    check(input, event, ctx) {
      const id = input.dataset.id;
      ctx.store.update((draft) => {
        draft.requirementsChecked = draft.requirementsChecked.includes(id) ? draft.requirementsChecked.filter((item) => item !== id) : [...draft.requirementsChecked, id];
      });
    },
  },
};
