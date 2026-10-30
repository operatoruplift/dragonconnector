import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { GUIDES } from '../data/content.js';
import { back, head, questTag } from './common.js';

/** Render content blocks ({ p }, { h }, { list }, { links }) as escaped HTML. */
export function blocks(body = []) {
  return body.map((block) => {
    if (block.h) return html`<h2>${block.h}</h2>`;
    if (block.list) return html`<ul>${block.list.map((item) => html`<li>${item}</li>`)}</ul>`;
    if (block.links) return html`<div class="row">${block.links.map((link) => html`<a class="btn small" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label} ${icon('external')}</a>`)}</div>`;
    return html`<p>${block.p}</p>`;
  });
}

export default {
  title: (state, params) => GUIDES.find((guide) => guide.slug === params[0])?.title ?? 'Guides',
  render(state, params) {
    if (params[0]) {
      const index = GUIDES.findIndex((item) => item.slug === params[0]);
      const guide = GUIDES[index];
      if (!guide) return html`<section class="view">${back('guides', 'Guides')}<h1 tabindex="-1">Guide not found</h1></section>`;
      const read = state.guidesRead.includes(guide.slug);
      const next = GUIDES[index + 1];
      return html`<section class="view">${back('guides', 'All guides')}
        ${head(`Guide · ${guide.minutes} min read`, guide.title, guide.summary)}
        <article class="prose">${blocks(guide.body)}</article>
        <div class="card ${read ? '' : 'accent'}">
          ${read ? html`<p class="row"><span class="pill done">${icon('check')} Read</span> Nice work.</p>` : html`<p>Finished reading?</p><div class="row"><button type="button" class="btn primary" data-action="read" data-slug="${guide.slug}">${icon('check')} Mark as read</button>${questTag(state, state.guidesRead.length ? 'all-guides' : 'first-guide')}</div>`}
          ${next ? html`<a class="btn ghost" href="#/guides/${next.slug}">Next: ${next.title} ${icon('arrow')}</a>` : ''}
        </div>
      </section>`;
    }
    return html`<section class="view">
      ${head('Explore', 'Guides', 'Short reads to help you prepare: the tracks, teams, judging, demos and submitting.')}
      <div class="row">${questTag(state, 'first-guide')}${questTag(state, 'all-guides')}<span class="small-print">${state.guidesRead.length} of ${GUIDES.length} read</span></div>
      <ul class="list-links">${GUIDES.map((guide) => html`<li><a href="#/guides/${guide.slug}"><span><strong>${guide.title}</strong><small>${guide.summary} · ${guide.minutes} min</small></span>${state.guidesRead.includes(guide.slug) ? html`<span class="pill done">Read</span>` : icon('arrow')}</a></li>`)}</ul>
    </section>`;
  },
  actions: {
    read(button, event, ctx) {
      const slug = button.dataset.slug;
      ctx.store.update((draft) => { if (!draft.guidesRead.includes(slug)) draft.guidesRead.push(slug); });
    },
  },
};
