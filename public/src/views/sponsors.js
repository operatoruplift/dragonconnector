import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { EVENT, EXAMPLE_SPONSORS, PACKAGES, SPONSORS } from '../data/event.js';
import { head, questTag } from './common.js';

// Each tier has one place on this page, from the top banner to the partners row.
const mark = (sponsor) => (sponsor.logo
  ? html`<img class="sponsor-logo" src="${sponsor.logo}" alt="" height="40">`
  : sponsor.example ? html`<span class="logo-slot" aria-hidden="true">Your logo</span>` : '');
const visit = (sponsor, label = 'Visit') => (sponsor.url
  ? html`<a class="sponsor-link" href="${sponsor.url}" target="_blank" rel="noopener noreferrer">${label} ${icon('external')}</a>`
  : sponsor.example ? html`<span class="sponsor-link muted">Your link</span>` : '');

const placements = {
  dragon: (list) => list.map((sponsor) => html`<article class="sponsor-banner">
    <p class="eyebrow">Presented by</p>
    <div class="sponsor-banner-mark">${mark(sponsor)}<h2>${sponsor.name}</h2></div>
    ${sponsor.blurb ? html`<p class="muted">${sponsor.blurb}</p>` : ''}
    ${visit(sponsor)}
  </article>`),
  track: (list) => html`<div class="stack">${list.map((sponsor) => html`<article class="card sponsor-feature">
    <div class="sponsor-feature-head">${mark(sponsor)}<div><h3>${sponsor.name}</h3>${sponsor.track ? html`<span class="chip gold">${sponsor.track}</span>` : ''}</div></div>
    ${sponsor.blurb ? html`<p class="muted">${sponsor.blurb}</p>` : ''}
    ${visit(sponsor)}
  </article>`)}</div>`,
  prize: (list) => html`<div class="sponsor-tiles">${list.map((sponsor) => html`<article class="sponsor-tile">
    ${mark(sponsor)}<strong>${sponsor.name}</strong>${sponsor.challenge ? html`<span class="small-print">${sponsor.challenge}</span>` : ''}${visit(sponsor, 'Prize')}
  </article>`)}</div>`,
  inkind: (list) => html`<div class="sponsor-row">${list.map((sponsor) => html`<div class="sponsor-chip">
    ${mark(sponsor)}<span><strong>${sponsor.name}</strong>${sponsor.provides ? html`<small>${sponsor.provides}</small>` : ''}</span>
  </div>`)}</div>`,
};
const headings = { track: 'Track sponsors', prize: 'Prize sponsors', inkind: 'In-kind partners' };

function placed(list) {
  return PACKAGES.map((pack) => {
    const group = list.filter((sponsor) => sponsor.package === pack.id);
    if (!group.length) return '';
    if (pack.id === 'dragon') return placements.dragon(group);
    return html`<section class="stack sponsor-tier" aria-label="${headings[pack.id]}"><h2 class="tier-title">${headings[pack.id]}</h2>${placements[pack.id](group)}</section>`;
  });
}

export default {
  title: () => 'Sponsors',
  render(state) {
    // Real sponsors always win. Preview mode shows placeholder brands only while there are none.
    const examples = !SPONSORS.length && state.preview;
    const list = SPONSORS.length ? SPONSORS : examples ? EXAMPLE_SPONSORS.map((sponsor) => ({ ...sponsor, example: true })) : [];
    return html`<section class="view">
      ${head('Explore', 'Sponsors & partners', 'Who supports Dragon Connector, and how organizations can get involved.')}
      ${examples ? html`<p class="notice"><strong>Example placements.</strong> Preview mode fills this page with placeholder brands to show where each tier appears. None of them is a sponsor.</p>` : ''}
      ${list.length
        ? placed(list)
        : html`<div class="card accent"><div class="card-head"><p class="eyebrow">Sponsors</p>${questTag(state, 'sponsors')}</div><h2>To be announced</h2><p class="muted">No sponsor or partner is confirmed yet. Organizations appear here only after they agree in writing to be named. Until then, nothing in this app implies sponsorship or endorsement.</p></div>`}
      <section class="stack" aria-labelledby="offers-title">
        <h2 id="offers-title">Sponsor tiers</h2>
        <p class="muted">Four tiers, each with its own place on this page. Every contribution is agreed in writing before it is announced, and every prize is paid in VND or goods.</p>
        <div class="grid cols-2">${PACKAGES.map((pack) => html`<div class="card package"><p class="eyebrow">${pack.contribution}</p><h3>${pack.name}</h3><p class="small-print"><strong>On this page:</strong> ${pack.placement}</p></div>`)}</div>
        <a class="btn primary" href="${EVENT.sponsorsUrl}" target="_blank" rel="noopener noreferrer">Become a sponsor ${icon('external')}</a>
      </section>
    </section>`;
  },
};
