import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { head } from './common.js';
import { EVENT } from '../data/event.js';

const GROUPS = [
  { title: 'Journey', items: [
    ['waitlist', 'list', 'Waitlist', 'Show your interest'],
    ['register', 'pen', 'Pre-register', 'Get your details ready'],
    ['checkin', 'scan', 'Check-in', 'Your pass for the event'],
    ['submit', 'upload', 'Submit', 'Ship before code freeze'],
  ] },
  { title: 'Explore', items: [
    ['schedule', 'calendar', 'Schedule', 'Both days, hour by hour'],
    ['guides', 'book', 'Guides', 'Tracks, teams and demos'],
    ['docs', 'doc', 'Docs', 'Rules, conduct and FAQ'],
    ['requirements', 'checklist', 'Requirements', 'What to bring'],
    ['map', 'map', 'Venue map', 'Find your way around'],
    ['prizes', 'trophy', 'Prize pool', 'Prizes and judging'],
    ['sponsors', 'handshake', 'Sponsors', 'The partner programme'],
  ] },
  { title: 'You', items: [
    ['profile', 'user', 'Profile', 'How teammates see you'],
    ['settings', 'settings', 'Settings', 'Install, preview and data'],
  ] },
];

export default {
  title: () => 'More',
  render() {
    return html`<section class="view">
      ${head('Dragon Connector', 'Everything else', 'Every section of the app in one place.')}
      ${GROUPS.map((group) => html`<section class="stack"><h2>${group.title}</h2><div class="tiles">${group.items.map(([route, name, title, detail]) => html`<a class="tile" href="#/${route}">${icon(name)}<strong>${title}</strong><span>${detail}</span></a>`)}</div></section>`)}
      <section class="stack"><h2>Follow ${EVENT.handle}</h2><p class="muted">Track reveals, sponsors and the venue are announced here first.</p><div class="row">${EVENT.social.map((item) => html`<a class="btn small" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.name} ${icon('external')}</a>`)}</div></section>
    </section>`;
  },
};
