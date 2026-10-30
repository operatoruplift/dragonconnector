import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { profileComplete } from '../lib/game.js';
import { splitList, validateProfile } from '../lib/validate.js';
import { FORMATS, TRACKS } from '../data/event.js';
import { LANGUAGES, LOOKING_FOR, ROLES, SKILL_SUGGESTIONS } from '../data/people.js';
import { avatar, errorSummary, field, head, options, questTag, readForm, roleLabel, showErrors } from './common.js';

/** The builder-profile fields, shared with step 2 of registration. */
export function profileFields(profile) {
  return html`
    ${field('name', 'Name', html`<input class="input" id="f-name" name="name" autocomplete="name" maxlength="60" value="${profile.name}" aria-describedby="f-name-error">`)}
    ${field('role', 'Main role', html`<select id="f-role" name="role" aria-describedby="f-role-error"><option value="">Choose a role</option>${ROLES.map((role) => html`<option value="${role.id}" ${profile.role === role.id ? 'selected' : ''}>${role.label}</option>`)}</select>`)}
    ${field('skills', 'Skills', html`<input class="input" id="f-skills" name="skills" list="skill-suggestions" value="${profile.skills.join(', ')}" aria-describedby="f-skills-hint f-skills-error"><datalist id="skill-suggestions">${SKILL_SUGGESTIONS.map((skill) => html`<option value="${skill}"></option>`)}</datalist>`, { hint: 'Separate skills with commas, for example: Rust, Figma, Pitching. Add at least three.' })}
    ${options('tracks', TRACKS.map((track) => ({ id: track.id, label: track.title, detail: track.description })), profile.tracks, { type: 'checkbox', legend: 'Tracks you are interested in' })}
    ${options('lookingFor', LOOKING_FOR, profile.lookingFor, { legend: 'What you are looking for' })}
    ${options('languages', LANGUAGES.map((language) => ({ id: language, label: language })), profile.languages, { type: 'checkbox', legend: 'Languages you work in' })}
    ${options('formats', Object.values(FORMATS).map((format) => ({ id: format.id, label: format.label, detail: format.dateLabel })), profile.formats, { type: 'checkbox', legend: 'Formats you could attend', hint: 'Both formats are proposed; pick any you could make.' })}
    ${field('bio', 'Short bio', html`<textarea id="f-bio" name="bio" maxlength="280" aria-describedby="f-bio-hint f-bio-error">${profile.bio}</textarea>`, { hint: 'One or two sentences about what you like to build. Up to 280 characters.' })}
    ${field('github', 'GitHub or portfolio link (optional)', html`<input class="input" id="f-github" name="github" type="url" inputmode="url" placeholder="https://github.com/you" value="${profile.github}" aria-describedby="f-github-error">`)}`;
}

/** Turn the submitted profile fields into a profile object. */
export function readProfile(form, previous = {}) {
  const data = readForm(form);
  return {
    ...previous,
    name: String(data.name ?? '').trim(),
    role: data.role ?? '',
    skills: splitList(data.skills),
    tracks: [].concat(data.tracks ?? []),
    lookingFor: data.lookingFor ?? '',
    languages: [].concat(data.languages ?? []),
    formats: [].concat(data.formats ?? []),
    bio: String(data.bio ?? '').trim(),
    github: String(data.github ?? '').trim(),
  };
}

export default {
  title: () => 'Profile',
  live: false,
  render(state) {
    const profile = state.profile;
    return html`<section class="view">
      ${head('You', 'Builder profile', 'Teammates see this when they look for people to build with. Matching uses your role, skills, tracks and goals.')}
      <div class="card"><div class="person-head">${avatar(profile.name || 'You', { me: true, large: true })}<div class="stack" style="gap:4px"><h2>${profile.name || 'Your name'}</h2><p class="muted">${profile.role ? roleLabel(profile.role) : 'Add your role'}</p></div><span class="spacer"></span>${questTag(state, 'profile')}</div>
        ${profileComplete(profile) ? '' : html`<p class="muted">Complete your name, role, three skills, a track and what you are looking for to finish this quest.</p>`}</div>
      <form data-form="profile" novalidate class="card">
        ${errorSummary()}
        ${profileFields(profile)}
        <div class="form-actions"><button class="btn primary" type="submit">${icon('check')} Save profile</button><a class="btn ghost" href="#/team">Find teammates</a></div>
        <p class="small-print">Your profile stays on this device. Real builders will see profiles once accounts go live.</p>
      </form>
    </section>`;
  },
  forms: {
    profile(form, event, ctx) {
      const profile = readProfile(form, ctx.store.get().profile);
      if (!showErrors(form, validateProfile(profile))) return;
      ctx.store.update((state) => { state.profile = profile; });
      ctx.toast('Your profile is saved.', { title: 'Saved' });
      ctx.rerender();
    },
  },
};
