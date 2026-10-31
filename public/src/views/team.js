import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { profileComplete } from '../lib/game.js';
import { rankMatches } from '../lib/match.js';
import { isWebUrl } from '../lib/validate.js';
import { TRACKS } from '../data/event.js';
import { ROLES, SAMPLE_PROFILES } from '../data/people.js';
import { avatar, back, canGoLive, connectCard, head, liveMode, questTag, roleLabel, trackTitle } from './common.js';

// Filters live only while the app is open.
const filters = { role: '', track: '', cofounder: false, query: '' };

const sampleById = (id) => SAMPLE_PROFILES.find((profile) => profile.id === id);
const byId = (state, id) => sampleById(id) ?? state.builders?.find((builder) => builder.id === id);
export const dmId = (profileId) => `dm-${profileId}`;

function visible(matches) {
  const query = filters.query.trim().toLowerCase();
  return matches.filter(({ profile }) => (!filters.role || profile.role === filters.role)
    && (!filters.track || profile.tracks.includes(filters.track))
    && (!filters.cofounder || profile.lookingFor === 'cofounder')
    && (!query || [profile.name, profile.bio, ...profile.skills].join(' ').toLowerCase().includes(query)));
}

/** Whether this person can be invited to your team: 'open', 'invited', 'member' or null. */
function inviteState(state, profile) {
  const team = state.team;
  if (!team) return null;
  if (profile.sample) {
    if (team.remote) return null; // sample profiles cannot join a live team
    return team.invites?.includes(profile.id) ? 'invited' : 'open';
  }
  if (!team.remote || !team.owner) return null;
  const member = team.members?.find((item) => item.id === profile.id);
  if (!member) return 'open';
  return member.status === 'joined' ? 'member' : 'invited';
}

function personCard(state, match, { detail = false } = {}) {
  const { profile, score, reasons } = match;
  const invite = inviteState(state, profile);
  return html`<article class="person">
    <div class="person-head">${avatar(profile.name)}<div class="stack" style="gap:2px"><h3>${detail ? profile.name : html`<a href="#/team/${profile.id}">${profile.name}</a>`}</h3><span class="muted">${roleLabel(profile.role)}</span></div>
      <div class="score"><strong>${score}</strong><span>Match</span></div></div>
    <div class="row">${profile.sample ? html`<span class="pill">Sample profile</span>` : ''}${profile.lookingFor === 'cofounder' ? html`<span class="pill gold">Co-founder search</span>` : ''}${profile.lookingFor === 'members' ? html`<span class="pill gold">Has a team</span>` : ''}</div>
    ${reasons.length ? html`<ul class="reasons" aria-label="Why you match">${reasons.map((reason) => html`<li>${reason}</li>`)}</ul>` : ''}
    ${detail && profile.bio ? html`<p>${profile.bio}</p>` : ''}
    <div class="chips">${profile.skills.map((skill) => html`<span class="chip">${skill}</span>`)}</div>
    ${detail ? html`<p class="muted">Tracks: ${profile.tracks.map(trackTitle).join(', ') || 'none yet'} · Languages: ${profile.languages.join(', ') || 'not given'}</p>` : ''}
    ${detail && !profile.sample && isWebUrl(profile.github ?? '') ? html`<p><a href="${profile.github}" target="_blank" rel="noopener noreferrer nofollow">${profile.github} ${icon('external')}</a></p>` : ''}
    <div class="row">
      <button type="button" class="btn small primary" data-action="intro" data-id="${profile.id}">${icon('send')} Send intro</button>
      ${invite === 'open' ? html`<button type="button" class="btn small" data-action="invite" data-id="${profile.id}">Invite to team</button>` : ''}
      ${invite === 'invited' ? html`<button type="button" class="btn small" disabled>Invited</button>` : ''}
      ${invite === 'member' ? html`<span class="pill done">${icon('check')} On your team</span>` : ''}
      ${detail ? '' : html`<a class="btn small ghost" href="#/team/${profile.id}">View</a>`}
    </div>
  </article>`;
}

function createTeamForm(state) {
  return html`<details class="card"><summary><span>Start a team</span><span class="row" style="margin-left:auto">${questTag(state, 'team')}</span></summary>
    <form data-form="create-team" novalidate>
    <div class="field"><label for="f-team">Team name</label><input class="input" id="f-team" name="name" maxlength="40" placeholder="For example: Han River Labs"><p class="error" data-error-for="name" hidden></p></div>
    <div class="field"><label for="f-team-track">Track</label><select id="f-team-track" name="track">${TRACKS.map((track) => html`<option value="${track.id}" ${state.profile.tracks[0] === track.id ? 'selected' : ''}>${track.title}</option>`)}</select></div>
    <fieldset><legend>Roles you still need</legend><div class="chips">${ROLES.filter((role) => role.id !== state.profile.role).map((role) => html`<label class="chip"><input type="checkbox" name="openRoles" value="${role.id}"> ${role.label}</label>`)}</div></fieldset>
    <button class="btn primary" type="submit">${icon('plus')} Create team</button>
  </form></details>`;
}

function teamCard(state, ctx) {
  const team = state.team;
  if (!team) return createTeamForm(state);
  const roles = team.openRoles.length ? html`<div class="chips">${team.openRoles.map((id) => html`<span class="chip gold">Needs: ${roleLabel(id)}</span>`)}</div>` : '';
  if (team.remote) {
    return html`<div class="card accent">
      <div class="card-head"><div class="stack" style="gap:2px"><p class="eyebrow">Your team · ${trackTitle(team.track)}</p><h2>${team.name}</h2></div>${questTag(state, 'team')}</div>
      <div class="stack" style="gap:8px">${team.members.map((member) => html`<div class="row">${avatar(member.name, { me: member.me })}<span>${member.name}${member.me ? html` <span class="muted">(you)</span>` : ''}</span>${member.status === 'invited' ? html`<span class="pill">Invited</span>` : ''}</div>`)}</div>
      <p class="small-print">${team.owner ? 'Invite builders below to fill your open roles. They accept from their own Teammates page.' : 'You are a member of this team.'}</p>
      ${roles}
      <div class="row"><a class="btn small" href="#/inbox/${team.threadId}">${icon('inbox')} Team chat</a><button type="button" class="btn small ghost" data-action="leave-team">${team.owner ? 'Disband team' : 'Leave team'}</button></div>
    </div>`;
  }
  const invited = (team.invites ?? []).map(sampleById).filter(Boolean);
  let note = invited.length ? `Invited: ${invited.map((person) => person.name).join(', ')}. Sample profiles cannot accept, so invitations stay on this device.` : 'Invite builders below to fill your open roles.';
  if (canGoLive(liveMode(state, ctx))) note = profileComplete(state.profile) ? 'Saving your team to your account…' : 'Complete your profile to make this team live. Until then it is saved on this device.';
  return html`<div class="card accent">
    <div class="card-head"><div class="stack" style="gap:2px"><p class="eyebrow">Your team · ${trackTitle(team.track)}</p><h2>${team.name}</h2></div>${questTag(state, 'team')}</div>
    <div class="row">${avatar(state.profile.name || 'You', { me: true })}<span>${state.profile.name || 'You'} <span class="muted">(you)</span></span></div>
    <p class="small-print">${note}</p>
    ${roles}
    <div class="row"><a class="btn small" href="#/inbox/team">${icon('inbox')} Team chat</a><button type="button" class="btn small ghost" data-action="leave-team">Disband team</button></div>
  </div>`;
}

function invitationsCard(state) {
  if (!state.invitations?.length) return '';
  return html`<div class="card">
    <h2>Team invitations</h2>
    ${state.invitations.map((invitation) => html`<div class="row">
      <span class="stack" style="gap:2px"><strong>${invitation.name}</strong><span class="small-print">${trackTitle(invitation.track)}${invitation.openRoles.length ? ` · needs ${invitation.openRoles.map(roleLabel).join(', ')}` : ''}</span></span>
      <span class="spacer"></span>
      <button type="button" class="btn small primary" data-action="respond" data-team="${invitation.teamId}" data-accept="yes">Accept</button>
      <button type="button" class="btn small ghost" data-action="respond" data-team="${invitation.teamId}" data-accept="no">Decline</button>
    </div>`)}
    ${state.team ? html`<p class="small-print">Leave your current team before you accept another.</p>` : ''}
  </div>`;
}

function liveNotice(state, ctx, mode) {
  const samples = 'The sample profiles below are fictional, for trying out matching, intros and invites.';
  if (mode === 'local') return html`<p class="notice quiet"><strong>Sample profiles.</strong> Real builders appear when accounts go live. Until then, these fictional profiles let you try matching, intros and team invites; nothing leaves this device.</p>`;
  if (mode === 'device') return connectCard();
  if (mode === 'offline') return html`<p class="notice quiet"><strong>You are offline.</strong> Real builders appear when you are back online. ${samples}</p>`;
  if (mode === 'guest') return html`<p class="notice quiet"><strong>${ctx.backend.problem() || 'Accounts are not available right now.'}</strong> Real builders appear once accounts are available. ${samples}</p>`;
  if (state.profile.discoverable) return '';
  return html`<p class="notice quiet">Only builders who choose to show their profile appear here. ${profileComplete(state.profile)
    ? html`<a href="#/profile">Show yours</a> so others can find you.`
    : html`<a href="#/profile">Complete your profile</a> and show it so others can find you.`}</p>`;
}

export default {
  title: (state, params) => (params[0] ? byId(state, params[0])?.name ?? 'Builder' : 'Teammates'),
  render(state, params, ctx) {
    if (params[0]) {
      const profile = byId(state, params[0]);
      if (!profile) return html`<section class="view">${back('team', 'Teammates')}<h1 tabindex="-1">Builder not found</h1><p class="muted">They may have hidden their profile.</p></section>`;
      const match = rankMatches(state.profile, [profile], state.team)[0];
      return html`<section class="view">${back('team', 'All teammates')}
        ${head(roleLabel(profile.role), profile.name, '')}
        ${profile.sample ? html`<p class="notice quiet">This is a fictional sample profile, so you can try matching and messaging. Messages to samples stay on this device and are not answered.</p>` : ''}
        ${personCard(state, match, { detail: true })}
      </section>`;
    }
    const mode = liveMode(state, ctx);
    const real = canGoLive(mode) ? rankMatches(state.profile, state.builders ?? [], state.team) : [];
    const samples = rankMatches(state.profile, SAMPLE_PROFILES, state.team);
    const shownReal = visible(real);
    const shownSamples = visible(samples);
    return html`<section class="view">
      ${head('Step 05 · Find your crew', 'Find teammates', 'Builders ranked by how well they complement you: different roles, shared tracks, new skills and matching goals.')}
      ${liveNotice(state, ctx, mode)}
      ${profileComplete(state.profile) ? '' : html`<div class="card"><div class="card-head"><h2>Sharpen your matches</h2>${questTag(state, 'profile')}</div><p class="muted">Matching works best with your role, skills, tracks and goals.</p><div class="row"><a class="btn primary small" href="#/profile">Complete your profile ${icon('arrow')}</a></div></div>`}
      ${invitationsCard(state)}
      ${teamCard(state, ctx)}
      <div class="card filters" role="search">
        <div class="field"><label for="f-search">Search names, skills and bios</label><input class="input" id="f-search" type="search" value="${filters.query}" data-input="search" placeholder="Rust, Figma, pitching…"></div>
        <div class="row" role="group" aria-label="Filter by role"><button type="button" class="chip" data-action="filter" data-key="role" data-value="" aria-pressed="${!filters.role}">All roles</button>${ROLES.map((role) => html`<button type="button" class="chip" data-action="filter" data-key="role" data-value="${role.id}" aria-pressed="${filters.role === role.id}">${role.label}</button>`)}</div>
        <div class="row" role="group" aria-label="Filter by track"><button type="button" class="chip" data-action="filter" data-key="track" data-value="" aria-pressed="${!filters.track}">All tracks</button>${TRACKS.map((track) => html`<button type="button" class="chip" data-action="filter" data-key="track" data-value="${track.id}" aria-pressed="${filters.track === track.id}">${track.title}</button>`)}<button type="button" class="chip" data-action="filter" data-key="cofounder" aria-pressed="${filters.cofounder}">Co-founder seekers</button></div>
      </div>
      <p class="small-print" role="status">${shownReal.length + shownSamples.length} of ${real.length + samples.length} builders</p>
      ${canGoLive(mode) ? html`<section class="stack" aria-labelledby="real-title">
        <h2 id="real-title">Builders on Dragon Connector</h2>
        ${shownReal.length ? html`<div class="people">${shownReal.map((match) => personCard(state, match))}</div>`
          : html`<p class="muted">${real.length ? 'No one matches these filters. Try fewer filters.' : 'No builders have shown their profile yet. Show yours so others can find you.'}</p>`}
      </section>` : ''}
      <section class="stack" aria-labelledby="samples-title">
        ${canGoLive(mode) ? html`<h2 id="samples-title">Sample profiles</h2>` : html`<h2 id="samples-title" class="sr-only">Sample profiles</h2>`}
        <div class="people">${shownSamples.length ? shownSamples.map((match) => personCard(state, match)) : html`<p class="muted">No one matches these filters yet. Try fewer filters.</p>`}</div>
      </section>
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
    async intro(button, event, ctx) {
      const state = ctx.store.get();
      const person = byId(state, button.dataset.id);
      if (!person) return;
      const me = state.profile;
      const greeting = `Hi ${person.name.split(' ')[0]}! I'm ${me.name || 'a builder'}${me.role ? `, a ${roleLabel(me.role).toLowerCase()}` : ''}. Want to team up for Dragon Connector?`;
      if (person.sample) {
        ctx.store.update((draft) => {
          const id = dmId(person.id);
          if (!draft.threads[id]) draft.threads[id] = { id, kind: 'dm', with: person.id, title: person.name, subtitle: roleLabel(person.role), unread: 0, messages: [] };
          draft.threads[id].draft = greeting;
        });
        ctx.navigate(`inbox/${dmId(person.id)}`);
        return;
      }
      if (!profileComplete(me)) {
        ctx.toast('Complete your profile first, so builders know who is writing.', { title: 'Almost there' });
        ctx.navigate('profile');
        return;
      }
      button.disabled = true;
      const result = await ctx.backend.openDirect(person.id);
      button.disabled = false;
      if (result.error) {
        ctx.toast(result.error, { title: 'Could not start a conversation' });
        return;
      }
      ctx.store.update((draft) => {
        const thread = draft.threads[result.threadId];
        if (thread && !thread.messages.length && !thread.draft) thread.draft = greeting;
      });
      ctx.navigate(`inbox/${result.threadId}`);
    },
    async invite(button, event, ctx) {
      const person = byId(ctx.store.get(), button.dataset.id);
      if (!person) return;
      if (person.sample) {
        ctx.store.update((draft) => {
          draft.team.invites = [...new Set([...(draft.team.invites ?? []), person.id])];
          draft.threads.team?.messages.push({ id: `t${Date.now()}`, from: 'system', at: ctx.now(), text: `Invitation saved for ${person.name}. Sample profiles cannot accept, so it stays on this device.` });
        });
        ctx.toast(`${person.name} is a sample profile, so the invitation stays on this device.`, { title: 'Invitation saved' });
        return;
      }
      button.disabled = true;
      const result = await ctx.backend.invite(person.id);
      if (result.error) {
        button.disabled = false;
        ctx.toast(result.error, { title: 'Not invited' });
        return;
      }
      ctx.toast(`${person.name} can accept from their Teammates page.`, { title: 'Invitation sent' });
    },
    async respond(button, event, ctx) {
      const accept = button.dataset.accept === 'yes';
      button.disabled = true;
      const result = await ctx.backend.respond(button.dataset.team, accept);
      if (result.error) {
        button.disabled = false;
        ctx.toast(result.error, { title: accept ? 'Not joined' : 'Not declined' });
        return;
      }
      ctx.toast(accept ? 'Say hello in your team chat.' : 'The invitation is declined.', { title: accept ? 'You joined the team' : 'Declined' });
    },
    async 'leave-team'(button, event, ctx) {
      const team = ctx.store.get().team;
      if (!team) return;
      if (team.remote) {
        if (!confirm(team.owner ? 'Disband your team? Everyone leaves, and the team chat is deleted for everyone.' : 'Leave the team? You will lose access to the team chat.')) return;
        button.disabled = true;
        const result = await ctx.backend.leaveTeam();
        if (result.error) {
          button.disabled = false;
          ctx.toast(result.error, { title: 'Still in the team' });
        }
        return;
      }
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
      // The team starts on this device; with an account, the next sync makes it live.
      ctx.store.update((draft) => {
        draft.team = { name, track: data.get('track'), openRoles: data.getAll('openRoles'), invites: [], createdAt: ctx.now() };
        draft.threads.team = { id: 'team', kind: 'team', title: `Team ${name}`, subtitle: 'Your team chat', unread: 0, messages: [{ id: 't0', from: 'system', at: ctx.now(), text: `You created ${name}. Invite builders from Teammates to fill your open roles.` }] };
      });
      ctx.backend?.syncSoon(0);
    },
  },
};
