import { html } from '../lib/html.js';
import { MAP_ZONES } from '../data/content.js';
import { EVENT } from '../data/event.js';
import { head, questTag } from './common.js';

let selected = 'checkin';

export default {
  title: () => 'Venue map',
  render(state) {
    const zone = MAP_ZONES.find((item) => item.id === selected) ?? MAP_ZONES[0];
    return html`<section class="view">
      ${head('Explore', 'Venue map', `${EVENT.venue.name}, ${EVENT.venue.city}. ${EVENT.venue.status}`)}
      <p class="notice quiet"><strong>Illustrative layout.</strong> The zones come from the stations in the event plan. The real floor plan will follow the confirmed room.</p>
      <div class="map-wrap">
        <svg class="floor" viewBox="0 0 800 400" role="group" aria-label="Illustrative venue floor plan">
          <rect x="1" y="1" width="798" height="398" rx="6" fill="none" stroke="rgba(248,248,246,0.2)" stroke-dasharray="6 6"/>
          <text x="95" y="394" fill="#A9A9A4" font-size="16" font-family="IBM Plex Mono, monospace" text-anchor="middle">ENTRANCE ↓</text>
          ${MAP_ZONES.map((item) => html`<g class="zone" tabindex="0" role="button" data-action="zone" data-id="${item.id}" aria-pressed="${item.id === zone.id}" aria-label="${item.label}">
            <rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="6"/>
            <text x="${item.x + item.w / 2}" y="${item.y + item.h / 2 - (item.lines.length - 1) * 15 + 9}" text-anchor="middle">${item.lines.map((line, index) => html`<tspan x="${item.x + item.w / 2}" dy="${index ? 30 : 0}">${line}</tspan>`)}</text></g>`)}
        </svg>
        <div class="card accent" aria-live="polite">
          <div class="card-head"><p class="eyebrow">Zone</p>${questTag(state, 'map')}</div>
          <h2>${zone.label}</h2>
          <p>${zone.detail}</p>
          <p class="small-print">Select a zone on the plan, or use Tab and Enter, to read about it.</p>
        </div>
      </div>
    </section>`;
  },
  mount(root, state, params, ctx) {
    // SVG groups are not buttons, so give them the Enter and Space behaviour people expect.
    const keys = (event) => {
      const zone = event.target.closest?.('.zone');
      if (zone && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selected = zone.dataset.id; ctx.rerender(); }
    };
    root.addEventListener('keydown', keys);
    return () => root.removeEventListener('keydown', keys);
  },
  actions: {
    zone(element, event, ctx) { selected = element.dataset.id; ctx.rerender(); },
  },
};
