// HQ's figures, drawn in HTML and CSS. Each chart is one series in the chart gold (validated against
// the panel: OKLCH lightness, chroma and 3:1 contrast), values and labels stay in text colours, and
// every chart has a table view, so a tooltip is never the only way to read a number.
import { html } from '../src/lib/html.js';

const number = (value) => Number(value).toLocaleString('en-US');

/** A stat tile: a label, a value and an optional note. */
export const tile = (label, value, note = '', href = '') => {
  const body = html`<span class="tile-label">${label}</span><strong class="tile-value">${typeof value === 'number' ? number(value) : value}</strong>${note ? html`<span class="tile-note">${note}</span>` : ''}`;
  return href ? html`<a class="kpi" href="${href}">${body}</a>` : html`<div class="kpi">${body}</div>`;
};

/** The top of the scale: 1, 2 or 5 times a power of ten, at least the largest value. */
export function niceMax(value) {
  if (value <= 1) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5, 10].map((step) => step * power).find((top) => top >= value);
}

const day = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });

/** Columns over days, from one baseline. The largest day is labelled; the rest are in the tooltip and table. */
export function columns(points, { title, unit, column = 'Count' }) {
  const top = niceMax(Math.max(0, ...points.map((point) => point.count)));
  const peak = points.reduce((best, point) => (point.count > (best?.count ?? 0) ? point : best), null);
  return html`<figure class="chart">
    <figcaption class="chart-title">${title}</figcaption>
    <div class="columns-frame">
      <div class="y-axis" aria-hidden="true"><span>${number(top)}</span><span>${Number.isInteger(top / 2) ? number(top / 2) : ''}</span><span>0</span></div>
      <div class="columns">${points.map((point) => {
        const label = `${day(point.date)}: ${number(point.count)} ${point.count === 1 ? unit[0] : unit[1]}`;
        return html`<div class="column" tabindex="0" data-tip="${label}" aria-label="${label}"><span class="column-bar${point.count ? '' : ' zero'}" style="height:${(point.count / top) * 100}%">${point === peak ? html`<b class="column-value">${number(point.count)}</b>` : ''}</span></div>`;
      })}</div>
    </div>
    <div class="x-axis" aria-hidden="true"><span>${day(points[0].date)}</span><span>${day(points.at(-1).date)}</span></div>
    ${tableView(['Day', column], points.map((point) => [day(point.date), number(point.count)]), { newestFirst: true })}
  </figure>`;
}

/** Ranked horizontal bars: a name, its bar and its count on each row, largest first. */
export function bars(items, { title, empty = 'Nothing yet.', total = null }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  const sum = total ?? items.reduce((all, item) => all + item.count, 0);
  return html`<figure class="chart">
    <figcaption class="chart-title">${title}</figcaption>
    ${items.length ? html`<ul class="barlist">${items.map((item) => {
      const share = sum ? Math.round((item.count / sum) * 100) : 0;
      return html`<li tabindex="0" data-tip="${item.label}: ${number(item.count)} (${share}%)"><span class="barlist-label">${item.label}</span><span class="barlist-track" aria-hidden="true"><span class="barlist-bar" style="width:${(item.count / max) * 100}%"></span></span><span class="barlist-value">${number(item.count)}</span></li>`;
    })}</ul>` : html`<p class="muted">${empty}</p>`}
  </figure>`;
}

/** A thin meter for a score out of its maximum. */
export const meter = (value, max, label) => html`<span class="score-meter" role="img" aria-label="${label}"><span style="width:${value === null ? 0 : (value / max) * 100}%"></span></span>`;

/** The table twin of a chart, folded away until asked for: a name column, then a number column. */
export function tableView([name, value], rows, { newestFirst = false } = {}) {
  return html`<details class="table-view"><summary>Show as a table</summary>
    <table class="data"><thead><tr><th scope="col">${name}</th><th scope="col" class="num">${value}</th></tr></thead>
    <tbody>${(newestFirst ? [...rows].reverse() : rows).map(([label, count]) => html`<tr><th scope="row">${label}</th><td class="num">${count}</td></tr>`)}</tbody></table>
  </details>`;
}
