import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { EVENT, JUDGING, PRIZES, TRACKS } from '../data/event.js';
import { head, questTag, usd } from './common.js';

export default {
  title: () => 'Prizes',
  render(state) {
    return html`<section class="view">
      ${head('Explore', 'Prizes', 'Where the prizes come from, how they are paid and how projects are judged.')}
      <div class="card accent">
        <div class="card-head"><div class="stack" style="gap:4px"><p class="eyebrow">Paid in VND or goods</p><h2>Prizes grow with every sponsor</h2></div>${questTag(state, 'prizes')}</div>
        <ul class="prize-list">${PRIZES.categories.map((item) => html`<li><strong>${item.title}</strong><span>${item.from}</span></li>`)}</ul>
        <p class="small-print">Sponsor cash committed so far: ${usd(PRIZES.cashReceivedUsd)}. Amounts are announced as sponsors commit.</p>
        <a class="btn" href="${EVENT.sponsorsUrl}" target="_blank" rel="noopener noreferrer">See the sponsor tracker ${icon('external')}</a>
      </div>
      <div class="notice"><strong>How prizes are paid.</strong><ul>${PRIZES.notes.map((note) => html`<li>${note}</li>`)}</ul></div>
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
      <p class="small-print">${EVENT.independence}</p>
    </section>`;
  },
};
