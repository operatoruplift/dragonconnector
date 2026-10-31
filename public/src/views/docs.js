import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { DOCS } from '../data/content.js';
import { back, head, questTag } from './common.js';
import { blocks } from './guides.js';

export default {
  title: (state, params) => DOCS.find((doc) => doc.slug === params[0])?.title ?? 'Docs',
  render(state, params) {
    if (params[0]) {
      const doc = DOCS.find((item) => item.slug === params[0]);
      if (!doc) return html`<section class="view">${back('docs', 'Docs')}<h1 tabindex="-1">Document not found</h1></section>`;
      return html`<section class="view">${back('docs', 'All docs')}
        ${head('Docs', doc.title, doc.summary)}
        ${doc.slug === 'rules' ? html`<div class="row">${questTag(state, 'rules')}</div>` : ''}
        <article class="prose">${doc.faqs
          ? doc.faqs.map((item) => html`<details class="faq"><summary>${item.q}</summary><p>${item.a}</p></details>`)
          : blocks(doc.body)}</article>
      </section>`;
    }
    return html`<section class="view">
      ${head('Explore', 'Docs', 'The draft rules, the code of conduct, privacy, answers to common questions and the story behind the name.')}
      <ul class="list-links">${DOCS.map((doc) => html`<li><a href="#/docs/${doc.slug}"><span><strong>${doc.title}</strong><small>${doc.summary}</small></span>${doc.slug === 'rules' && state.quests.rules ? html`<span class="pill done">Read</span>` : icon('arrow')}</a></li>`)}</ul>
    </section>`;
  },
};
