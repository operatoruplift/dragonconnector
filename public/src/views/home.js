import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { BADGES, QUESTS, earnedBadges, levelFor, nextQuest, xpOf } from '../lib/game.js';
import { checkInOpen, formatOf, submissionsOpen } from '../lib/gates.js';
import { countdown, eventWindow } from '../lib/time.js';
import { EVENT, GATES } from '../data/event.js';

// The participant journey, in the order people move through it.
export const JOURNEY = [
  { id: 'waitlist', title: 'Join the waitlist', detail: 'Show your interest and hear first.', route: 'waitlist', quest: 'waitlist' },
  { id: 'register', title: 'Pre-register', detail: 'Get your details ready for registration.', route: 'register', quest: 'register' },
  { id: 'onboard', title: 'Onboard and take the tour', detail: 'Learn the app and build your profile.', action: 'start-tour', quest: 'tour' },
  { id: 'checkin', title: 'Check in on event day', detail: 'Show your pass at the venue.', route: 'checkin', quest: 'checkin', gate: 'checkin' },
  { id: 'team', title: 'Find teammates', detail: 'Match on skills, tracks and goals.', route: 'team', quest: 'team' },
  { id: 'connect', title: 'Message your crew', detail: 'Send an intro and plan together.', route: 'inbox', quest: 'intro' },
  { id: 'submit', title: 'Submit your project', detail: 'Ship before code freeze.', route: 'submit', quest: 'submit', gate: 'submit' },
];

const EXPLORE = [
  { route: 'schedule', icon: 'calendar', title: 'Schedule', detail: 'The proposed programme', quest: 'plan' },
  { route: 'quests', icon: 'quest', title: 'Quests & tasks', detail: 'Every XP reward in one list' },
  { route: 'guides', icon: 'book', title: 'Guides', detail: 'Tracks, teams and demos', quest: 'all-guides' },
  { route: 'docs', icon: 'doc', title: 'Docs', detail: 'Rules, conduct and FAQ', quest: 'rules' },
  { route: 'requirements', icon: 'checklist', title: 'Requirements', detail: 'What to bring and set up', quest: 'checklist' },
  { route: 'map', icon: 'map', title: 'Venue map', detail: 'Find your way around', quest: 'map' },
  { route: 'prizes', icon: 'trophy', title: 'Prize pool', detail: 'Planned prizes and judging', quest: 'prizes' },
  { route: 'sponsors', icon: 'handshake', title: 'Sponsors', detail: 'The partner programme', quest: 'sponsors' },
];

function journeyStep(state, step, current, ctx) {
  const done = Boolean(state.quests[step.quest]);
  const locked = !done && ((step.gate === 'checkin' && !checkInOpen(state, ctx.now())) || (step.gate === 'submit' && !submissionsOpen(state, ctx.now())));
  const status = done ? 'done' : locked ? 'locked' : step.id === current ? 'current' : '';
  const quest = QUESTS.find((item) => item.id === step.quest);
  const cta = step.action
    ? html`<button type="button" class="btn small${status === 'current' ? ' primary' : ''}" data-action="${step.action}">${done ? 'Replay the tour' : 'Start the tour'}</button>`
    : html`<a class="btn small${status === 'current' ? ' primary' : ''}" href="#/${step.route}">${done ? 'Open' : locked ? 'Preview' : 'Go'} ${icon('arrow')}</a>`;
  return html`<li class="step ${status}">
    <span class="node">${done ? icon('check') : locked ? icon('lock') : String(JOURNEY.indexOf(step) + 1).padStart(2, '0')}</span>
    <div class="step-body">
      <div class="row"><span class="step-title">${step.title}</span>${done ? html`<span class="pill done">Done</span>` : html`<span class="xp">+${quest.xp} XP</span>`}${locked ? html`<span class="pill">Opens on event day</span>` : ''}</div>
      <p class="muted">${step.detail}</p>
      <div class="row">${cta}</div>
    </div>
  </li>`;
}

export default {
  title: () => 'Your quest',
  render(state, params, ctx) {
    const xp = xpOf(state);
    const level = levelFor(xp);
    const format = formatOf(state);
    const until = countdown(ctx.now(), eventWindow(format).start);
    const done = QUESTS.filter((quest) => state.quests[quest.id]).length;
    const badges = earnedBadges(state);
    const current = JOURNEY.find((step) => !state.quests[step.quest])?.id;
    const next = nextQuest(state);
    const name = state.profile.name.trim().split(/\s+/)[0];
    return html`<section class="view">
      <header class="view-head"><p class="eyebrow">${EVENT.edition} · ${EVENT.status}</p><h1 tabindex="-1">${name ? `Welcome back, ${name}` : 'Your quest begins'}</h1>
        <p class="lede">${EVENT.promise} Every step from the waitlist to your demo is a quest. Complete them to earn XP and level up.</p></header>

      <div class="hero" data-tour="level">
        <div class="hero-top">
          <div class="level-badge"><strong>${level.number}</strong><span>Level</span></div>
          <div class="stack" style="gap:6px;flex:1">
            <p class="eyebrow">${level.name}</p>
            <div class="meter" role="progressbar" aria-label="Progress to the next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(level.progress * 100)}"><span style="width:${Math.round(level.progress * 100)}%"></span></div>
            <p class="small-print">${level.next ? `${level.next.min - xp} XP to ${level.next.name}` : 'Top level reached. You are a Dragon.'}</p>
          </div>
        </div>
        <div class="stats"><div class="stat"><strong>${xp}</strong><span>XP earned</span></div><div class="stat"><strong>${done}/${QUESTS.length}</strong><span>Quests done</span></div><div class="stat"><strong>${badges.length}/${BADGES.length}</strong><span>Badges</span></div></div>
      </div>

      <div class="grid cols-2">
        <div class="card">
          <div class="card-head"><p class="eyebrow">Proposed date</p><span class="pill">Not confirmed</span></div>
          <h2>${format.dateLabel}</h2>
          <p class="muted">${until.past ? 'The proposed dates have passed.' : `${until.days} days to go, if the proposal goes ahead.`} ${format.label}. ${EVENT.venue.name}, ${EVENT.venue.city} (proposed).</p>
          <div class="row"><a class="btn small" href="#/schedule">${icon('calendar')} Schedule</a><a class="btn small ghost" href="#/docs/faq">Is it confirmed?</a></div>
        </div>
        ${next ? html`<div class="card accent" data-tour="next">
          <div class="card-head"><p class="eyebrow">Next quest</p><span class="xp">+${next.xp} XP</span></div>
          <h2>${next.title}</h2>
          ${next.hint ? html`<p class="muted">${next.hint}</p>` : html`<p class="muted">Stage: ${next.phase}</p>`}
          <div class="row">${next.id === 'tour' ? html`<button type="button" class="btn primary small" data-action="start-tour">Start the tour</button>` : html`<a class="btn primary small" href="#/${next.route}">Start ${icon('arrow')}</a>`}</div>
        </div>` : html`<div class="card accent"><p class="eyebrow">All quests complete</p><h2>Legendary.</h2><p class="muted">You have done everything the app can track. See you on the build floor.</p></div>`}
      </div>

      ${GATES.registration.open ? '' : html`<p class="notice"><strong>Registration is not open.</strong> Join the waitlist and pre-register so you are ready when it opens. The app keeps your details on this device until then.</p>`}

      <section class="card" aria-labelledby="journey-title" data-tour="journey">
        <div class="card-head"><h2 id="journey-title">Your journey</h2><span class="small-print">${JOURNEY.filter((step) => state.quests[step.quest]).length} of ${JOURNEY.length} steps</span></div>
        <ol class="journey">${JOURNEY.map((step) => journeyStep(state, step, current, ctx))}</ol>
      </section>

      <section class="stack" aria-labelledby="explore-title">
        <h2 id="explore-title">Explore</h2>
        <div class="tiles" data-tour="explore">${EXPLORE.map((tile) => html`<a class="tile" href="#/${tile.route}">${icon(tile.icon)}<strong>${tile.title}</strong><span>${tile.detail}</span>${tile.quest && state.quests[tile.quest] ? html`<span class="pill done">Done</span>` : ''}</a>`)}</div>
      </section>

      <section class="stack" aria-labelledby="badges-title">
        <div class="card-head"><h2 id="badges-title">Badges</h2><a class="small-print" href="#/quests">How to earn them</a></div>
        <div class="badges">${BADGES.map((badge) => {
          const earned = badges.includes(badge);
          return html`<div class="badge${earned ? ' earned' : ''}">${icon(earned ? 'star' : 'lock')}<strong>${badge.title}</strong><small>${badge.detail}</small><span class="sr-only">${earned ? 'Earned' : 'Not earned yet'}</span></div>`;
        })}</div>
      </section>
    </section>`;
  },
};
