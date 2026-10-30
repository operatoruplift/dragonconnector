import { html } from '../lib/html.js';
import { JUDGING, PRIZES, TRACKS } from '../data/event.js';
import { head, questTag, usd } from './common.js';

export default {
  title: () => 'Prize pool',
  render(state) {
    const top = Math.max(...PRIZES.scenarios.map((scenario) => scenario.usd));
    return html`<section class="view">
      ${head('Explore', 'Prize pool', 'What the proposal plans for prizes, and how projects are judged.')}
      <div class="card accent">
        <div class="card-head"><div class="stack" style="gap:4px"><p class="eyebrow">Planned prize allocation</p><h2>Up to ${usd(top)}</h2></div>${questTag(state, 'prizes')}</div>
        <p class="muted">The pool depends on which funding scenario the event secures. The same plan applies to both formats.</p>
        <div class="vault">${PRIZES.scenarios.map((scenario) => html`<div class="vault-row"><span class="eyebrow">${scenario.tier}</span><span class="bar" aria-hidden="true"><span style="width:${Math.round((scenario.usd / top) * 100)}%"></span></span><strong>${usd(scenario.usd)}</strong></div>`)}</div>
        <p class="small-print">Sponsor cash received so far: ${usd(PRIZES.cashReceivedUsd)}.</p>
      </div>
      <div class="notice"><strong>Planned, not promised.</strong><ul>${PRIZES.notes.map((note) => html`<li>${note}</li>`)}</ul></div>
      <div class="card">
        <h2>How judging works</h2>
        <ol class="rubric">${JUDGING.rubric.map((item) => html`<li><strong>${item.points}</strong><span>${item.label}</span></li>`)}</ol>
        <p class="muted">Up to ${JUDGING.finalists} finalists each get a ${JUDGING.slotMinutes}-minute slot: ${JUDGING.slot.map((part) => `${part.minutes} min ${part.label.toLowerCase()}`).join(', ')}.</p>
        <p class="small-print">${JUDGING.status}</p>
      </div>
      <div class="card">
        <h2>Tracks</h2>
        <div class="grid cols-3">${TRACKS.map((track) => html`<div class="stack" style="gap:6px"><h3>${track.title}</h3><p class="muted">${track.description}</p><p class="small-print">Output: ${track.output}</p></div>`)}</div>
      </div>
    </section>`;
  },
};
