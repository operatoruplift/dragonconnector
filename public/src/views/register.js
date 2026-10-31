import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { REGISTRATION_STEPS, validateRegistrationStep } from '../lib/validate.js';
import { officialRegistrationOpen, registrationOpen } from '../lib/gates.js';
import { FORMATS, GATES, INTEGRATIONS } from '../data/event.js';
import { SERVICES, errorSummary, field, head, options, previewNotice, questTag, readForm, roleLabel, showErrors, syncNote, trackTitle } from './common.js';
import { profileFields, readProfile } from './profile.js';

const EXPERIENCE = [
  { id: 'first', label: 'This will be my first hackathon' },
  { id: 'some', label: 'One to three hackathons' },
  { id: 'many', label: 'Four or more' },
];
const FORMAT_CHOICES = [
  ...Object.values(FORMATS).map((format) => ({ id: format.id, label: format.label, detail: format.dateLabel })),
  { id: 'either', label: 'Either format', detail: 'I can attend whichever is confirmed' },
];
const MEDIA = [{ id: 'yes', label: 'Yes, I agree to appear in approved event photos and video' }, { id: 'no', label: 'No, please keep me out of event media' }];

function stepFields(step, data, profile) {
  if (step === 0) {
    return html`
      ${field('name', 'Full name', html`<input class="input" id="f-name" name="name" autocomplete="name" maxlength="60" value="${data.name ?? profile.name}">`)}
      ${field('email', 'Email', html`<input class="input" id="f-email" name="email" type="email" inputmode="email" autocomplete="email" value="${data.email ?? profile.email}">`)}
      ${field('phone', 'Phone (optional)', html`<input class="input" id="f-phone" name="phone" type="tel" autocomplete="tel" value="${data.phone ?? ''}">`, { hint: 'Only used to reach you on event day, once registration is real.' })}`;
  }
  if (step === 1) return profileFields(profile);
  if (step === 2) {
    return html`
      ${options('format', FORMAT_CHOICES, data.format, { legend: 'Which format could you attend?', hint: 'Both formats are proposals; the organizers will confirm one.' })}
      ${options('experience', EXPERIENCE, data.experience, { legend: 'Hackathon experience' })}
      ${field('dietary', 'Dietary needs (optional)', html`<input class="input" id="f-dietary" name="dietary" maxlength="200" value="${data.dietary ?? ''}">`)}
      ${field('access', 'Access needs (optional)', html`<input class="input" id="f-access" name="access" maxlength="200" value="${data.access ?? ''}">`, { hint: 'Anything that would help you take part fully.' })}`;
  }
  if (step === 3) {
    return html`
      <div class="field"><label class="option"><input type="checkbox" name="conduct" ${data.conduct ? 'checked' : ''}><span>I agree to follow the <a href="#/docs/conduct">code of conduct</a>.</span></label><p class="error" data-error-for="conduct" hidden></p></div>
      ${options('media', MEDIA, data.media, { legend: 'Event photos and video' })}
      <div class="field"><label class="option"><input type="checkbox" name="data" ${data.data ? 'checked' : ''}><span>${SERVICES
        ? html`Send my pre-registration to the Dragon Connector organizers. It is stored in their database to prepare registration, I will confirm my details when registration opens, and I can delete them in Settings. <a href="#/docs/privacy">How your data is kept</a>`
        : 'I understand my pre-registration stays on this device until the official registration page exists, and that I will need to confirm my details there.'}</span></label><p class="error" data-error-for="data" hidden></p></div>`;
  }
  const format = FORMAT_CHOICES.find((choice) => choice.id === data.format);
  return html`<dl class="summary-list">
    <div><dt>Name</dt><dd>${data.name}</dd></div><div><dt>Email</dt><dd>${data.email}</dd></div>${data.phone ? html`<div><dt>Phone</dt><dd>${data.phone}</dd></div>` : ''}
    <div><dt>Role</dt><dd>${roleLabel(profile.role)}</dd></div><div><dt>Skills</dt><dd>${profile.skills.join(', ')}</dd></div>
    <div><dt>Tracks</dt><dd>${profile.tracks.map(trackTitle).join(', ')}</dd></div>
    <div><dt>Format</dt><dd>${format?.label ?? ''}</dd></div><div><dt>Experience</dt><dd>${EXPERIENCE.find((item) => item.id === data.experience)?.label ?? ''}</dd></div>
    ${data.dietary ? html`<div><dt>Dietary</dt><dd>${data.dietary}</dd></div>` : ''}${data.access ? html`<div><dt>Access</dt><dd>${data.access}</dd></div>` : ''}
    <div><dt>Media</dt><dd>${data.media === 'yes' ? 'Agrees to appear' : 'Keep out of media'}</dd></div>
  </dl>`;
}

function readStep(step, form, state) {
  const data = readForm(form);
  if (step === 1) return { profile: readProfile(form, state.profile), data: state.registration.data };
  const merged = { ...state.registration.data };
  if (step === 0) Object.assign(merged, { name: (data.name ?? '').trim(), email: (data.email ?? '').trim(), phone: (data.phone ?? '').trim() });
  if (step === 2) Object.assign(merged, { format: data.format ?? '', experience: data.experience ?? '', dietary: (data.dietary ?? '').trim(), access: (data.access ?? '').trim() });
  if (step === 3) Object.assign(merged, { conduct: Boolean(data.conduct), media: data.media ?? '', data: Boolean(data.data) });
  return { profile: state.profile, data: merged };
}

export default {
  title: (state) => (officialRegistrationOpen(state) ? 'Register' : 'Pre-register'),
  live: false,
  render(state, params, ctx) {
    const registration = state.registration;
    const open = officialRegistrationOpen(state);
    const title = open ? 'Register' : 'Pre-register';
    const intro = head('Step 02 · Get in', title, open
      ? `Registration is open. Complete these steps${INTEGRATIONS.registrationUrl ? ', then confirm on the official registration page' : ' to register'}.`
      : GATES.registration.note);
    const finished = ['pre-registered', 'registered'].includes(registration.status);
    if (finished && params[0] !== 'edit') {
      return html`<section class="view">${intro}
        <div class="card accent">
          <div class="card-head"><p class="eyebrow">${open && INTEGRATIONS.registrationUrl ? 'Almost there' : registration.status === 'registered' ? 'Registered' : 'Pre-registration saved'}</p>${questTag(state, 'register')}</div>
          <h2>${registration.data.name}, you are ready.</h2>
          ${stepFields(4, registration.data, state.profile)}
          <p class="muted">${INTEGRATIONS.registrationUrl && open
            ? 'Finish on the official registration page to secure your place. Your details here are a copy for your reference.'
            : `Last updated ${new Date(registration.updatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. ${syncNote(state, ctx)}${open ? '' : ' When registration opens, you will confirm these details.'}`}</p>
          <div class="form-actions">${INTEGRATIONS.registrationUrl && open ? html`<a class="btn primary" href="${INTEGRATIONS.registrationUrl}" target="_blank" rel="noopener noreferrer">Official registration ${icon('external')}</a>` : html`<a class="btn primary" href="#/team">Find teammates ${icon('arrow')}</a>`}<a class="btn" href="#/register/edit">Edit details</a></div>
        </div>
      </section>`;
    }
    const step = Math.min(registration.step ?? 0, REGISTRATION_STEPS.length - 1);
    const last = step === REGISTRATION_STEPS.length - 1;
    return html`<section class="view">${intro}
      ${previewNotice(state)}
      <ol class="stepper" aria-label="Registration steps">${REGISTRATION_STEPS.map((label, index) => html`<li class="${index < step ? 'done' : index === step ? 'current' : ''}" ${index === step ? html`aria-current="step"` : ''}><span>${index + 1}. ${label}</span></li>`)}</ol>
      <form data-form="step" novalidate class="card" data-input="autosave">
        <div class="card-head"><h2>${step + 1}. ${REGISTRATION_STEPS[step]}</h2>${last ? questTag(state, 'register') : html`<span class="small-print">Step ${step + 1} of ${REGISTRATION_STEPS.length}</span>`}</div>
        ${errorSummary()}
        ${stepFields(step, registration.data, state.profile)}
        <div class="form-actions">
          ${step > 0 ? html`<button type="button" class="btn" data-action="previous">${icon('back')} Back</button>` : ''}
          <button class="btn primary" type="submit">${last ? (registrationOpen(state) && open ? 'Complete registration' : 'Save pre-registration') : 'Continue'} ${last ? icon('check') : icon('arrow')}</button>
        </div>
        <p class="small-print">${SERVICES ? 'Saved on this device as you go. The organizers receive a copy when you finish.' : 'Saved on this device as you go.'}</p>
      </form>
    </section>`;
  },
  inputs: {
    // Keep a draft as people type, without re-rendering the form under them.
    autosave(form, event, ctx) {
      const state = ctx.store.get();
      const step = state.registration.step ?? 0;
      if (step >= REGISTRATION_STEPS.length - 1) return;
      const next = readStep(step, form, state);
      ctx.store.update((draft) => { draft.registration.data = next.data; if (step === 1) draft.profile = next.profile; }, { quiet: true });
    },
  },
  forms: {
    step(form, event, ctx) {
      const state = ctx.store.get();
      const step = state.registration.step ?? 0;
      const last = step === REGISTRATION_STEPS.length - 1;
      if (!last) {
        const next = readStep(step, form, state);
        if (!showErrors(form, validateRegistrationStep(step, next.data, next.profile))) return;
        ctx.store.update((draft) => {
          draft.registration.data = next.data;
          draft.profile = next.profile;
          if (step === 0) draft.profile.email = next.data.email;
          draft.registration.step = step + 1;
          if (draft.registration.status === 'none') draft.registration.status = 'draft';
        });
      } else {
        ctx.store.update((draft) => {
          draft.registration.status = officialRegistrationOpen(draft) ? 'registered' : 'pre-registered';
          draft.registration.updatedAt = ctx.now();
          draft.registration.step = 0;
        });
        ctx.navigate('register');
      }
      ctx.rerender();
    },
  },
  actions: {
    previous(button, event, ctx) {
      ctx.store.update((draft) => { draft.registration.step = Math.max(0, (draft.registration.step ?? 0) - 1); });
      ctx.rerender();
    },
  },
};
