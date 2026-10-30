// Building blocks shared by the views.
import { html, esc } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { QUESTS } from '../lib/game.js';
import { ROLES } from '../data/people.js';
import { TRACKS } from '../data/event.js';

export const usd = (value) => `$${Number(value).toLocaleString('en-US')}`;
export const roleLabel = (id) => ROLES.find((role) => role.id === id)?.label ?? 'Role not set';
export const trackTitle = (id) => TRACKS.find((track) => track.id === id)?.title ?? id;
export const initials = (name = '') => name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';

export function head(eyebrow, title, lede = '') {
  return html`<header class="view-head"><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1>${lede ? html`<p class="lede">${lede}</p>` : ''}</header>`;
}

export function back(route, label) {
  return html`<a class="back-link" href="#/${route}">${icon('back')}${label}</a>`;
}

/** The XP a quest is worth, or a completed mark. */
export function questTag(state, id) {
  const quest = QUESTS.find((item) => item.id === id);
  if (!quest) return '';
  return state.quests[id]
    ? html`<span class="pill done">${icon('check')} Done</span>`
    : html`<span class="pill gold">+${quest.xp} XP</span>`;
}

export function avatar(name, { me = false, large = false } = {}) {
  return html`<span class="avatar${me ? ' me' : ''}${large ? ' large' : ''}" aria-hidden="true">${initials(name)}</span>`;
}

export const previewNotice = (state) => (state.preview
  ? html`<p class="notice"><strong>Preview mode is on.</strong> Steps that open later are unlocked on this device so you can try them. Nothing is sent anywhere.</p>`
  : '');

/** A labelled control with its hint and an error slot. */
export function field(name, label, control, { hint = '', wide = false } = {}) {
  return html`<div class="field${wide ? ' wide' : ''}">
    <label for="f-${name}">${label}</label>${control}
    ${hint ? html`<p class="hint" id="f-${name}-hint">${hint}</p>` : ''}
    <p class="error" data-error-for="${name}" id="f-${name}-error" hidden></p>
  </div>`;
}

export function options(name, list, selected, { type = 'radio', legend, hint = '' } = {}) {
  const chosen = [].concat(selected ?? []);
  return html`<fieldset class="field" data-field="${name}">
    <legend>${legend}</legend>${hint ? html`<p class="hint">${hint}</p>` : ''}
    <div class="options${list.length > 3 ? ' two' : ''}">
      ${list.map((item) => html`<label class="option"><input type="${type}" name="${name}" value="${item.id}" ${chosen.includes(item.id) ? 'checked' : ''}><span>${item.label}${item.detail ? html`<small>${item.detail}</small>` : ''}</span></label>`)}
    </div>
    <p class="error" data-error-for="${name}" hidden></p>
  </fieldset>`;
}

/** Show validation errors beside each field and in a summary that links to them. */
export function showErrors(form, errors) {
  form.querySelectorAll('.invalid').forEach((element) => element.classList.remove('invalid'));
  form.querySelectorAll('[data-error-for]').forEach((element) => { element.hidden = true; element.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach((element) => element.removeAttribute('aria-invalid'));
  const summary = form.querySelector('[data-error-summary]');
  const entries = Object.entries(errors);
  if (summary) summary.hidden = entries.length === 0;
  if (!entries.length) return true;
  for (const [name, message] of entries) {
    const slot = form.querySelector(`[data-error-for="${name}"]`);
    if (slot) { slot.textContent = message; slot.hidden = false; }
    (slot?.closest('.field') ?? form.querySelector(`[name="${name}"]`)?.closest('.field'))?.classList.add('invalid');
    form.querySelectorAll(`[name="${name}"]`).forEach((control) => control.setAttribute('aria-invalid', 'true'));
  }
  if (summary) {
    summary.innerHTML = `<p><strong>Check ${entries.length === 1 ? 'this field' : `these ${entries.length} fields`}:</strong></p><ul>${entries
      .map(([name, message]) => `<li><a href="#" data-focus="${esc(name)}">${esc(message)}</a></li>`).join('')}</ul>`;
    summary.focus();
  }
  return false;
}

export const errorSummary = () => html`<div class="error-summary" data-error-summary tabindex="-1" role="alert" hidden></div>`;

/** Read a form into a plain object; repeated names become arrays. */
export function readForm(form) {
  const data = {};
  for (const [key, value] of new FormData(form)) {
    if (key in data) data[key] = [].concat(data[key], value);
    else data[key] = value;
  }
  form.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    const several = form.querySelectorAll(`input[type="checkbox"][name="${box.name}"]`).length > 1;
    if (several) data[box.name] = [].concat(data[box.name] ?? []);
    else if (!(box.name in data)) data[box.name] = false;
    else data[box.name] = data[box.name] === 'on' ? true : data[box.name];
  });
  return data;
}
