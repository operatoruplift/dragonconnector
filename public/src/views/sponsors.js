import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { EVENT, PARTNER_OFFERS, SPONSORS } from '../data/event.js';
import { head, questTag } from './common.js';

export default {
  title: () => 'Sponsors',
  render(state) {
    return html`<section class="view">
      ${head('Explore', 'Sponsors & partners', 'Who supports Dragon Connector, and how organizations can get involved.')}
      ${SPONSORS.length
        ? html`<div class="grid cols-3">${SPONSORS.map((sponsor) => html`<a class="tile" href="${sponsor.url}" target="_blank" rel="noopener noreferrer">${sponsor.logo ? html`<img src="${sponsor.logo}" alt="" height="40">` : ''}<strong>${sponsor.name}</strong><span>${sponsor.tier}</span></a>`)}</div>`
        : html`<div class="card accent"><div class="card-head"><p class="eyebrow">Sponsors</p>${questTag(state, 'sponsors')}</div><h2>To be announced</h2><p class="muted">No sponsor or partner is confirmed yet. Organizations appear here only after they agree in writing to be named. Until then, nothing in this app implies sponsorship or endorsement.</p></div>`}
      <section class="stack" aria-labelledby="offers-title">
        <h2 id="offers-title">Ways partners can help</h2>
        <p class="muted">The proposal invites organizations to fund specific needs. Each contribution is agreed in writing before it is announced, and it funds the selected scenario rather than automatically adding to the prize pool.</p>
        <div class="grid cols-2">${PARTNER_OFFERS.map((offer) => html`<div class="card"><h3>${offer.title}</h3><ul class="small-print">${offer.funds.map((item) => html`<li>${item}</li>`)}</ul></div>`)}</div>
        <a class="btn primary" href="${EVENT.proposalUrl}/#opportunities" target="_blank" rel="noopener noreferrer">Partner with us ${icon('external')}</a>
      </section>
    </section>`;
  },
};
