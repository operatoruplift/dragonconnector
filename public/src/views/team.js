import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { profileComplete } from '../lib/game.js';
import { rankMatches } from '../lib/match.js';
import { TRACKS } from '../data/event.js';
import { ROLES, SAMPLE_PROFILES } from '../data/people.js';
import { avatar, back, head, questTag, roleLabel, trackTitle } from './common.js';

// Filters live only while the app is open.
const filters = { role: '', track: '', cofounder: false, query: '' };

const byId = (id) => SAMPLE_PROFILES.find((profile) => profile.id === id);
export const dmId = (profileId) => `dm-${profileId}`;

function visible(matches) {
  const query = filters.query.trim().toLowerCase();
  return matches.filter(({ profile }) => (!filters.role || profile.role === filters.role)
    && (!filters.track || profile.tracks.includes(filters.track))
    && (!filters.cofounder || profile.lookingFor === 'cofounder')
    && (!query || [profile.name, profile.bio, ...profile.skills].join(' ').toLowerCase().includes(query)));
}

function personCard(state, match, { detail = false } = {}) {
  const { profile, score, reasons } = match;
  const invited = state.team?.invites?.includes(profile.id);
  return html`<article class="person">
    <div class="person-head">${avatar(profile.name)}<div class="stack" style="gap:2px"><h3>${detail ? profile.name : html`<a href="#/team/${profile.id}">${profile.name}</a>`}</h3><span class="muted">${roleLabel(profile.role)}</span></div>
      <div class="score"><strong>${score}</strong><span>Match</span></div></div>
    <div class="row"><span class="pill">Sample profile</span>${profile.lookingFor === 'cofounder' ? html`<span class="pill gold">Co-founder search</span>` : ''}${profile.lookingFor === 'members' ? html`<span class="pill gold">Has a team</span>` : ''}</div>
    ${reasons.length ? html`<ul class="reasons" aria-label="Why you match">${reasons.map((reason) => html`<li>${reason}</li>`)}</ul>` : ''}
    ${detail ? html`<p>${profile.bio}</p>` : ''}
    <div class="chips">${profile.skills.map((skill) => html`<span class="chip">${skill}</span>`)}</div>
    ${detail ? html`<p class="muted">Tracks: ${profile.tracks.map(trackTitle).join(', ')} · Languages: ${profile.languages.join(', ')}</p>` : ''}
    <div class="row">
      <button type="button" class="btn small primary" data-action="intro" data-id="${profile.id}">${icon('send')} Send intro</button>
      ${state.team ? html`<button type="button" class="btn small" data-action="invite" data-id="${profile.id}" ${invited ? 'disabled' : ''}>${invited ? 'Invited' : 'Invite to team'}</button>` : ''}
      ${detail ? '' : html`<a class="btn small ghost" href="#/team/${profile.id}">View</a>`}
    </div>
  </article>`;
}

function teamCard(state) {
  const team = state.team;
  if (!team) {
    return html`<details class="card"><summary><span>Start a team</span><span class="row" style="margin-left:auto">${questTag(state, 'team')}</span></summary>
      <form data-form="create-team" novalidate>
      <div class="field"><label for="f-team">Team name</label><input class="input" id="f-team" name="name" maxlength="40" placeholder="For example: Han River Labs"><p class="error" data-error-for="name" hidden></p></div>
      <div class="field"><label for="f-team-track">Track</label><select id="f-team-track" name="track">${TRACKS.map((track) => html`<option value="${track.id}" ${state.profile.tracks[0] === track.id ? 'selected' : ''}>${track.title}</option>`)}</select></div>
      <fieldset><legend>Roles you still need</legend><div class="chips">${ROLES.filter((role) => role.id !== state.profile.role).map((role) => html`<label class="chip"><input type="checkbox" name="openRoles" value="${role.id}"> ${role.label}</label>`)}</div></fieldset>
      <button class="btn primary" type="submit">${icon('plus')} Create team</button>
    </form></details>`;
  }
  const invited = (team.invites ?? []).map(byId).filter(Boolean);
  return html`<div class="card accent">
    <div class="card-head"><div class="stack" style="gap:2px"><p class="eyebrow">Your team · ${trackTitle(team.track)}</p><h2>${team.name}</h2></div>${questTag(state, 'team')}</div>
    <div class="row">${avatar(state.profile.name || 'You', { me: true })}<span>${state.profile.name || 'You'} <span class="muted">(you)</span></span></div>
    ${invited.length ? html`<p class="small-print">Invited: ${invited.map((person) => person.name).join(', ')}. Sample profiles cannot accept, so invitations stay on this device.</p>` : html`<p class="small-print">Invite builders below to fill your open roles.</p>`}
    ${team.openRoles.length ? html`<div class="chips">${team.openRoles.map((id) => html`<span class="chip gold">Needs: ${roleLabel(id)}</span>`)}</div>` : ''}
    <div class="row"><a class="btn small" href="#/inbox/team">${icon('inbox')} Team chat</a><button type="button" class="btn small ghost" data-action="leave-team">Disband team</button></div>
  </div>`;
}

export default {
  title: (state, params) => (params[0] ? byId(params[0])?.name ?? 'Builder' : 'Teammates'),
  render(state, params) {
    if (params[0]) {
      const profile = byId(params[0]);
      if (!profile) return html`<section class="view">${back('team', 'Teammates')}<h1 tabindex="-1">Builder not found</h1></section>`;
      const match = rankMatches(state.profile, [profile], state.team)[0];
      return html`<section class="view">${back('team', 'All teammates')}
        ${head(roleLabel(profile.role), profile.name, '')}
        <p class="notice quiet">This is a fictional sample profile, so you can try matching and messaging. Messages to samples stay on this device and are not answered.</p>
        ${personCard(state, match, { detail: true })}
      </section>`;
    }
    const matches = rankMatches(state.profile, SAMPLE_PROFILES, state.team);
    const shown = visible(matches);
    return html`<section class="view">
      ${head('Step 05 · Find your crew', 'Find teammates', 'Builders ranked by how well they complement you: different roles, shared tracks, new skills and matching goals.')}
      <p class="notice quiet"><strong>Sample profiles.</strong> Real builders appear when accounts go live. Until then, these fictional profiles let you try matching, intros and team invites; nothing leaves this device.</p>
      ${profileComplete(state.profile) ? '' : html`<div class="card"><div class="card-head"><h2>Sharpen your matches</h2>${questTag(state, 'profile')}</div><p class="muted">Matching works best with your role, skills, tracks and goals.</p><div class="row"><a class="btn primary small" href="#/profile">Complete your profile ${icon('arrow')}</a></div></div>`}
      ${teamCard(state)}
      <div class="card filters" role="search">
        <div class="field"><label for="f-search">Search names, skills and bios</label><input class="input" id="f-search" type="search" value="${filters.query}" data-input="search" placeholder="Rust, Figma, pitching…"></div>
        <div class="row" role="group" aria-label="Filter by role"><button type="button" class="chip" data-action="filter" data-key="role" data-value="" aria-pressed="${!filters.role}">All roles</button>${ROLES.map((role) => html`<button type="button" class="chip" data-action="filter" data-key="role" data-value="${role.id}" aria-pressed="${filters.role === role.id}">${role.label}</button>`)}</div>
        <div class="row" role="group" aria-label="Filter by track"><button type="button" class="chip" data-action="filter" data-key="track" data-value="" aria-pressed="${!filters.track}">All tracks</button>${TRACKS.map((track) => html`<button type="button" class="chip" data-action="filter" data-key="track" data-value="${track.id}" aria-pressed="${filters.track === track.id}">${track.title}</button>`)}<button type="button" class="chip" data-action="filter" data-key="cofounder" aria-pressed="${filters.cofounder}">Co-founder seekers</button></div>
      </div>
      <p class="small-print" role="status">${shown.length} of ${matches.length} builders</p>
      <div class="people">${shown.length ? shown.map((match) => personCard(state, match)) : html`<p class="muted">No one matches these filters yet. Try fewer filters.</p>`}</div>
    </section>`;
  },
  inputs: {
    search(input, event, ctx) { filters.query = input.value; ctx.rerender(); },
  },
  actions: {
    filter(button, event, ctx) {
      const { key, value } = button.dataset;
      if (key === 'cofounder') filters.cofounder = !filters.cofounder;
      else filters[key] = value;
      ctx.rerender();
    },
    intro(button, event, ctx) {
      const person = byId(button.dataset.id);
      const me = ctx.store.get().profile;
      ctx.store.update((draft) => {
        const id = dmId(person.id);
        if (!draft.threads[id]) draft.threads[id] = { id, kind: 'dm', with: person.id, title: person.name, subtitle: roleLabel(person.role), unread: 0, messages: [] };
        draft.threads[id].draft = `Hi ${person.name.split(' ')[0]}! I'm ${me.name || 'a builder'}${me.role ? `, a ${roleLabel(me.role).toLowerCase()}` : ''}. Want to team up for Dragon Connector?`;
      });
      ctx.navigate(`inbox/${dmId(person.id)}`);
    },
    invite(button, event, ctx) {
      const person = byId(button.dataset.id);
      ctx.store.update((draft) => {
        draft.team.invites = [...new Set([...(draft.team.invites ?? []), person.id])];
        draft.threads.team?.messages.push({ id: `t${Date.now()}`, from: 'system', at: ctx.now(), text: `Invitation saved for ${person.name}. Sample profiles cannot accept, so it stays on this device.` });
      });
      ctx.toast(`${person.name} is a sample profile, so the invitation stays on this device.`, { title: 'Invitation saved' });
    },
    'leave-team'(button, event, ctx) {
      if (!confirm('Disband your team? Your team chat will be deleted from this device.')) return;
      ctx.store.update((draft) => { draft.team = null; delete draft.threads.team; });
    },
  },
  forms: {
    'create-team'(form, event, ctx) {
      const data = new FormData(form);
      const name = String(data.get('name') ?? '').trim();
      const slot = form.querySelector('[data-error-for="name"]');
      if (name.length < 2) { slot.textContent = 'Give your team a name of at least two characters.'; slot.hidden = false; form.querySelector('#f-team').focus(); return; }
      ctx.store.update((draft) => {
        draft.team = { name, track: data.get('track'), openRoles: data.getAll('openRoles'), invites: [], createdAt: ctx.now() };
        draft.threads.team = { id: 'team', kind: 'team', title: `Team ${name}`, subtitle: 'Your team chat', unread: 0, messages: [{ id: 't0', from: 'system', at: ctx.now(), text: `You created ${name}. Invite builders from Teammates to fill your open roles.` }] };
      });
    },
  },
};
