import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { REGISTRATION_STEPS, validateRegistrationStep } from '../lib/validate.js';
import { officialRegistrationOpen, registrationOpen } from '../lib/gates.js';
import { registered } from '../lib/game.js';
import { FORMATS, GATES, INTEGRATIONS } from '../data/event.js';
import { SERVICES, errorSummary, field, head, options, previewNotice, questTag, readForm, roleLabel, showErrors, syncNote, trackTitle } from './common.js';
import { profileFields, readProfile } from './profile.js';

const EXPERIENCE = [
  { id: 'first', label: 'This will be my first hackathon' },
  { id: 'some', label: 'One to three hackathons' },
  { id: 'many', label: 'Four or more' },
];
const MEDIA = [{ id: 'yes', label: 'Yes, I agree to appear in approved event photos and video' }, { id: 'no', label: 'No, please keep me out of event media' }];

// The registration form starts from what the builder already gave: the waitlist entry and profile.
function stepFields(step, data, profile, { waitlist = null, official = true } = {}) {
  if (step === 0) {
    return html`
      ${field('name', 'Full name', html`<input class="input" id="f-name" name="name" autocomplete="name" maxlength="60" value="${data.name ?? (profile.name || waitlist?.name || '')}">`)}
      ${field('email', 'Email', html`<input class="input" id="f-email" name="email" type="email" inputmode="email" autocomplete="email" value="${data.email ?? (profile.email || waitlist?.email || '')}">`)}
      ${field('phone', 'Phone (optional)', html`<input class="input" id="f-phone" name="phone" type="tel" autocomplete="tel" value="${data.phone ?? ''}">`, { hint: 'Only used to reach you during the event.' })}`;
  }
  if (step === 1) return profileFields(profile);
  if (step === 2) {
    return html`
      ${options('experience', EXPERIENCE, data.experience, { legend: 'Hackathon experience' })}
      ${field('dietary', 'Dietary needs (optional)', html`<input class="input" id="f-dietary" name="dietary" maxlength="200" value="${data.dietary ?? ''}">`)}
      ${field('access', 'Access needs (optional)', html`<input class="input" id="f-access" name="access" maxlength="200" value="${data.access ?? ''}">`, { hint: 'Anything that would help you take part fully.' })}`;
  }
  if (step === 3) {
    return html`
      <div class="field"><label class="option"><input type="checkbox" name="conduct" ${data.conduct ? 'checked' : ''}><span>I agree to follow the <a href="#/docs/conduct">code of conduct</a>.</span></label><p class="error" data-error-for="conduct" hidden></p></div>
      ${options('media', MEDIA, data.media, { legend: 'Event photos and video' })}
      <div class="field"><label class="option"><input type="checkbox" name="data" ${data.data ? 'checked' : ''}><span>${consent(official)}</span></label><p class="error" data-error-for="data" hidden></p></div>`;
  }
  return html`<dl class="summary-list">
    <div><dt>Name</dt><dd>${data.name}</dd></div><div><dt>Email</dt><dd>${data.email}</dd></div>${data.phone ? html`<div><dt>Phone</dt><dd>${data.phone}</dd></div>` : ''}
    <div><dt>Role</dt><dd>${roleLabel(profile.role)}</dd></div><div><dt>Skills</dt><dd>${profile.skills.join(', ')}</dd></div>
    <div><dt>Tracks</dt><dd>${profile.tracks.map(trackTitle).join(', ')}</dd></div>
    <div><dt>Dates</dt><dd>${FORMATS.A.dateLabel}</dd></div><div><dt>Experience</dt><dd>${EXPERIENCE.find((item) => item.id === data.experience)?.label ?? ''}</dd></div>
    ${data.dietary ? html`<div><dt>Dietary</dt><dd>${data.dietary}</dd></div>` : ''}${data.access ? html`<div><dt>Access</dt><dd>${data.access}</dd></div>` : ''}
    <div><dt>Media</dt><dd>${data.media === 'yes' ? 'Agrees to appear' : 'Keep out of media'}</dd></div>
  </dl>`;
}

/** What the builder agrees to on the last step. In preview mode nothing leaves the device. */
function consent(official) {
  if (!official) return 'Preview: I understand this registration stays on this device and is not sent, because registration has not opened yet.';
  return SERVICES
    ? html`Send my registration to the Dragon Connector organizers. It is stored in their database, and I can delete it in Settings. <a href="#/docs/privacy">How your data is kept</a>`
    : 'I understand my registration stays on this device until the official registration page exists, and that I will need to confirm my details there.';
}

function readStep(step, form, state) {
  const data = readForm(form);
  if (step === 1) return { profile: readProfile(form, state.profile), data: state.registration.data };
  const merged = { ...state.registration.data };
  if (step === 0) Object.assign(merged, { name: (data.name ?? '').trim(), email: (data.email ?? '').trim(), phone: (data.phone ?? '').trim() });
  if (step === 2) Object.assign(merged, { format: 'A', experience: data.experience ?? '', dietary: (data.dietary ?? '').trim(), access: (data.access ?? '').trim() });
  if (step === 3) Object.assign(merged, { conduct: Boolean(data.conduct), media: data.media ?? '', data: Boolean(data.data) });
  return { profile: state.profile, data: merged };
}

/** Registration is not open yet and preview mode is off: the waitlist is the way in. */
function notYet(state) {
  const entry = state.waitlist;
  return html`<div class="card accent">
    <div class="card-head"><p class="eyebrow">Opens soon</p>${questTag(state, 'register')}</div>
    <h2>Registration is not open yet</h2>
    <p class="muted">${entry
      ? 'You are on the waitlist, so you hear first when it opens. Your name, email, role and track are filled in for you then.'
      : 'Join the waitlist to hear first when it opens. Your details carry over to this form.'}</p>
    <div class="form-actions">${entry
      ? html`<a class="btn primary" href="#/profile">Build your profile ${icon('arrow')}</a><a class="btn" href="#/waitlist">Your waitlist entry</a>`
      : html`<a class="btn primary" href="#/waitlist">${icon('list')} Join the waitlist</a>`}</div>
    <p class="small-print">To see the form before it opens, turn on preview mode in <a href="#/settings">Settings</a>.</p>
  </div>`;
}

export default {
  title: () => 'Register',
  live: false,
  render(state, params, ctx) {
    const registration = state.registration;
    const official = officialRegistrationOpen(state);
    const intro = head('Step 01 · Get in', 'Register', official
      ? `Registration is open. Complete these steps${INTEGRATIONS.registrationUrl ? ', then confirm on the official registration page' : ' to register'}. Your waitlist details are filled in.`
      : GATES.registration.note);
    const editing = params[0] === 'edit';
    // Saved before registration opened: a preview on this device, or details kept from before the
    // waitlist and pre-registration became one step. Either becomes a registration once confirmed.
    const unconfirmed = registered(state) && (registration.status !== 'registered' || registration.preview);
    if (registered(state) && !editing) {
      const external = official && INTEGRATIONS.registrationUrl;
      const eyebrow = external ? 'Almost there' : !unconfirmed ? 'Registered' : registration.preview ? 'Preview registration' : 'Details saved';
      const note = external
        ? 'Finish on the official registration page to secure your place. Your details here are a copy for your reference.'
        : !unconfirmed
          ? `Last updated ${new Date(registration.updatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. ${syncNote(state, ctx)}`
          : official
            ? `Registration has opened. Confirm these details to register: ${SERVICES ? 'they go to the organizers, and you can delete them in Settings.' : 'they stay on this device.'}`
            : registration.preview
              ? 'Saved on this device only. When registration opens, confirm these details to register.'
              : 'When registration opens, confirm these details to register.';
      return html`<section class="view">${intro}
        <div class="card accent">
          <div class="card-head"><p class="eyebrow">${eyebrow}</p>${questTag(state, 'register')}</div>
          <h2>${unconfirmed ? `${registration.data.name}, your details are ready.` : `${registration.data.name}, you are registered.`}</h2>
          ${stepFields(4, registration.data, state.profile)}
          <p class="muted">${note}</p>
          <div class="form-actions">${external
            ? html`<a class="btn primary" href="${INTEGRATIONS.registrationUrl}" target="_blank" rel="noopener noreferrer">Official registration ${icon('external')}</a>`
            : unconfirmed && official
              ? html`<button type="button" class="btn primary" data-action="confirm">${icon('check')} Confirm and register</button>`
              : html`<a class="btn primary" href="#/team">Find teammates ${icon('arrow')}</a>`}<a class="btn" href="#/register/edit">Edit details</a>${unconfirmed && !official && !state.waitlist ? html`<a class="btn ghost" href="#/waitlist">Join the waitlist</a>` : ''}</div>
        </div>
      </section>`;
    }
    if (!registrationOpen(state)) return html`<section class="view">${intro}${notYet(state)}</section>`;
    const step = Math.min(registration.step ?? 0, REGISTRATION_STEPS.length - 1);
    const last = step === REGISTRATION_STEPS.length - 1;
    return html`<section class="view">${intro}
      ${previewNotice(state)}
      ${official ? '' : html`<p class="notice"><strong>Preview.</strong> Registration has not opened yet, so this form stays on this device. ${state.waitlist ? 'You are on the waitlist and hear first when it opens.' : html`<a href="#/waitlist">Join the waitlist</a> to hear first when it opens.`}</p>`}
      <ol class="stepper" aria-label="Registration steps">${REGISTRATION_STEPS.map((label, index) => html`<li class="${index < step ? 'done' : index === step ? 'current' : ''}" ${index === step ? html`aria-current="step"` : ''}><span>${index + 1}. ${label}</span></li>`)}</ol>
      <form data-form="step" novalidate class="card" data-input="autosave">
        <div class="card-head"><h2>${step + 1}. ${REGISTRATION_STEPS[step]}</h2>${last ? questTag(state, 'register') : html`<span class="small-print">Step ${step + 1} of ${REGISTRATION_STEPS.length}</span>`}</div>
        ${errorSummary()}
        ${stepFields(step, registration.data, state.profile, { waitlist: state.waitlist, official })}
        <div class="form-actions">
          ${step > 0 ? html`<button type="button" class="btn" data-action="previous">${icon('back')} Back</button>` : ''}
          <button class="btn primary" type="submit">${last ? (official ? 'Complete registration' : 'Save preview registration') : 'Continue'} ${last ? icon('check') : icon('arrow')}</button>
        </div>
        <p class="small-print">${!official ? 'Preview: saved on this device only.' : SERVICES ? 'Saved on this device as you go. The organizers receive a copy when you finish.' : 'Saved on this device as you go.'}</p>
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
          // Completed before registration opens (preview mode): kept on this device until confirmed.
          draft.registration.status = 'registered';
          draft.registration.preview = !officialRegistrationOpen(draft);
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
    confirm(button, event, ctx) {
      if (!officialRegistrationOpen(ctx.store.get())) return;
      ctx.store.update((draft) => {
        draft.registration.status = 'registered';
        draft.registration.preview = false;
        draft.registration.data.data = true;
        draft.registration.updatedAt = ctx.now();
      });
      ctx.rerender();
    },
  },
};
