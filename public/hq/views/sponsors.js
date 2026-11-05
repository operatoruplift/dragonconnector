// Sponsor enquiries from the website's "Become a sponsor" form, as a small pipeline.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { EVENT } from '../../src/data/event.js';
import { INQUIRY_STATUSES, inquiryLabel, tierLabel, toCsv, when } from '../model.js';
import { empty, head, waiting } from './common.js';

export default {
  title: () => 'Sponsors',
  roles: ['organizer'],
  live: false, // keeps half-typed notes while HQ refreshes
  render(state) {
    if (!state.event) return html`<section class="view">${head('Partners', 'Sponsors')}${waiting(state)}</section>`;
    const list = state.event.inquiries ?? [];
    return html`<section class="view">
      ${head('Partners', 'Sponsor enquiries', 'From the Become a sponsor form on the website. Track each one from new to confirmed.', html`
        <button type="button" class="btn small" data-action="export-inquiries">${icon('download')} Enquiries CSV</button>
        <a class="btn small" href="${EVENT.sponsorsUrl}" target="_blank" rel="noopener noreferrer">Sponsor page ${icon('external')}</a>`)}
      <div class="chips" aria-label="Pipeline">${INQUIRY_STATUSES.map((status) => html`<span class="chip">${status.label} · ${list.filter((item) => item.status === status.id).length}</span>`)}</div>
      ${list.length ? list.map((item) => html`<form class="card" data-form="inquiry" data-id="${item.id}" novalidate>
        <div class="card-head"><div class="stack" style="gap:4px"><h2>${item.company}</h2><p class="small-print">${item.name} · <a href="mailto:${item.email}">${item.email}</a> · ${tierLabel(item.tier)} · ${item.lang === 'vi' ? 'Vietnamese' : 'English'} · ${when(item.created_at)}</p></div>
          <span class="pill${item.status === 'confirmed' ? ' gold' : ''}">${inquiryLabel(item.status)}</span></div>
        ${item.message ? html`<p class="prose-text">${item.message}</p>` : ''}
        <div class="grid cols-2">
          <div class="field"><label for="f-status-${item.id}">Status</label><select id="f-status-${item.id}" name="status">${INQUIRY_STATUSES.map((status) => html`<option value="${status.id}" ${item.status === status.id ? 'selected' : ''}>${status.label}</option>`)}</select></div>
          <div class="field"><label for="f-notes-${item.id}">Notes</label><textarea id="f-notes-${item.id}" name="notes" maxlength="2000" rows="2">${item.notes ?? ''}</textarea></div>
        </div>
        <div class="form-actions"><button class="btn small" type="submit">${icon('check')} Save</button>${item.updated_at && item.updated_at !== item.created_at ? html`<span class="small-print">Updated ${when(item.updated_at)}</span>` : ''}</div>
      </form>`) : empty('No enquiries yet. They arrive from the sponsor page on dragonconnector.com.')}
    </section>`;
  },
  forms: {
    async inquiry(form, event, ctx) {
      const data = new FormData(form);
      await ctx.run(() => ctx.api.updateInquiry(Number(form.dataset.id), String(data.get('status')), String(data.get('notes') ?? '')), 'Enquiry saved.');
      ctx.rerender({ force: true });
    },
  },
  actions: {
    'export-inquiries'(button, event, ctx) {
      ctx.download('dragon-connector-sponsor-enquiries.csv', toCsv(ctx.state.event.inquiries ?? [], [
        ['Company', (row) => row.company], ['Contact', (row) => row.name], ['Email', (row) => row.email], ['Tier', (row) => tierLabel(row.tier)],
        ['Status', (row) => inquiryLabel(row.status)], ['Notes', (row) => row.notes], ['Message', (row) => row.message], ['Language', (row) => row.lang], ['Received', (row) => row.created_at],
      ]));
    },
  },
};
