// Building blocks shared by HQ's views.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { STATUS_LABEL } from '../model.js';

export function head(eyebrow, title, lede = '', actions = '') {
  return html`<header class="view-head"><div class="view-head-row"><div class="stack" style="gap:8px"><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1></div>${actions ? html`<div class="row">${actions}</div>` : ''}</div>${lede ? html`<p class="lede">${lede}</p>` : ''}</header>`;
}

export const statusPill = (status) => html`<span class="pill state-${status}">${STATUS_LABEL[status] ?? status}</span>`;
export const empty = (text) => html`<p class="empty">${text}</p>`;
export const out = (url, label) => (url ? html`<a class="btn small" href="${url}" target="_blank" rel="noopener noreferrer">${label} ${icon('external')}</a>` : '');
export const back = (route, label) => html`<a class="back-link" href="#/${route}">${icon('back')}${label}</a>`;

/** Shown while the first read is on its way, or when it failed. */
export function waiting(state) {
  if (state.problem) return html`<div class="notice"><strong>HQ could not load the event.</strong> ${state.problem} <button type="button" class="btn small" data-action="reload">${icon('refresh')} Try again</button></div>`;
  return html`<p class="muted">Loading the event…</p>`;
}

/** Explains that builder accounts are switched off, and how to switch them on. */
export const accountsNotice = () => html`<div class="notice"><strong>Builder accounts are switched off in Supabase.</strong> Only waitlist entries and sponsor enquiries reach HQ. Builders' profiles, registrations, messages, teams and check-ins stay on their phones until you turn on anonymous sign-ins: Supabase dashboard, Authentication, Sign In / Providers, <em>Allow anonymous sign-ins</em>.</div>`;
