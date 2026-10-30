// Toasts, celebrations and the coach-mark tour. Everything respects reduced motion and keeps
// keyboard focus where people expect it.
import { esc } from './html.js';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function toast(message, { tone = 'info', title = '', action = null, duration = 4200 } = {}) {
  const region = document.getElementById('toasts');
  const item = document.createElement('div');
  item.className = `toast ${tone}`;
  item.innerHTML = `${title ? `<strong>${esc(title)}</strong>` : ''}<span>${esc(message)}</span>`;
  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn small';
    button.textContent = action.label;
    button.addEventListener('click', () => { action.run(); item.remove(); });
    item.append(button);
  }
  region.append(item);
  if (duration) setTimeout(() => item.remove(), duration);
  return item;
}

/** A short burst of gold sparks from the top of the screen. */
export function celebrate() {
  if (reducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'celebration';
  canvas.setAttribute('aria-hidden', 'true');
  const scale = devicePixelRatio || 1;
  canvas.width = innerWidth * scale;
  canvas.height = innerHeight * scale;
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  context.scale(scale, scale);
  const colours = ['#D4AF37', '#EBC76E', '#F8F8F6'];
  const sparks = Array.from({ length: 70 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.4,
    y: -10,
    vx: (Math.random() - 0.5) * 7,
    vy: Math.random() * 4 + 2,
    size: Math.random() * 4 + 2,
    colour: colours[Math.floor(Math.random() * colours.length)],
    spin: Math.random() * Math.PI,
  }));
  const started = performance.now();
  function frame(time) {
    const elapsed = time - started;
    context.clearRect(0, 0, innerWidth, innerHeight);
    for (const spark of sparks) {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += 0.12;
      spark.spin += 0.2;
      context.save();
      context.globalAlpha = Math.max(0, 1 - elapsed / 1800);
      context.translate(spark.x, spark.y);
      context.rotate(spark.spin);
      context.fillStyle = spark.colour;
      context.fillRect(-spark.size / 2, -spark.size / 2, spark.size, spark.size * 0.6);
      context.restore();
    }
    if (elapsed < 1800) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

const visible = (element) => element && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';

/**
 * Run a coach-mark tour. Each step names one or more selectors; the first visible match is
 * highlighted, so the same tour works with the phone tab bar and the desktop sidebar.
 */
export function startTour(steps, { onFinish = () => {}, onSkip = () => {} } = {}) {
  const usable = steps.filter((step) => [].concat(step.target).some((selector) => visible(document.querySelector(selector))));
  if (!usable.length) { onFinish(); return () => {}; }
  const previousFocus = document.activeElement;
  const layer = document.createElement('div');
  layer.className = 'tour';
  layer.innerHTML = `<div class="tour-spot"></div><div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text">
    <p class="eyebrow" id="tour-count"></p><h2 id="tour-title"></h2><p id="tour-text"></p>
    <div class="tour-actions"><button type="button" class="btn ghost small" data-tour-skip>Skip tour</button><span class="spacer"></span><button type="button" class="btn small" data-tour-back>Back</button><button type="button" class="btn primary small" data-tour-next>Next</button></div></div>`;
  document.body.append(layer);
  const spot = layer.querySelector('.tour-spot');
  const card = layer.querySelector('.tour-card');
  let index = 0;

  function target(step) {
    return [].concat(step.target).map((selector) => document.querySelector(selector)).find(visible);
  }

  function place() {
    const step = usable[index];
    const element = target(step);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const pad = 6;
    Object.assign(spot.style, { left: `${rect.left - pad}px`, top: `${rect.top - pad}px`, width: `${rect.width + pad * 2}px`, height: `${rect.height + pad * 2}px` });
    const cardWidth = Math.min(340, innerWidth - 32);
    card.style.width = `${cardWidth}px`;
    const below = rect.bottom + 16;
    const cardHeight = card.offsetHeight;
    const top = below + cardHeight < innerHeight - 8 ? below : Math.max(8, rect.top - cardHeight - 16);
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardWidth / 2), innerWidth - cardWidth - 16);
    Object.assign(card.style, { top: `${top}px`, left: `${left}px` });
  }

  function show() {
    const step = usable[index];
    const element = target(step);
    element?.scrollIntoView?.({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    layer.querySelector('#tour-count').textContent = `Tour · ${index + 1} of ${usable.length}`;
    layer.querySelector('#tour-title').textContent = step.title;
    layer.querySelector('#tour-text').textContent = step.text;
    layer.querySelector('[data-tour-back]').hidden = index === 0;
    layer.querySelector('[data-tour-next]').textContent = index === usable.length - 1 ? 'Finish' : 'Next';
    requestAnimationFrame(place);
    layer.querySelector('[data-tour-next]').focus();
  }

  function close(finished) {
    removeEventListener('resize', place);
    removeEventListener('scroll', place, true);
    document.removeEventListener('keydown', keys, true);
    layer.remove();
    previousFocus?.focus?.();
    (finished ? onFinish : onSkip)();
  }

  function keys(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(false); }
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); index -= 1; show(); }
    if (event.key === 'Tab') {
      const buttons = [...card.querySelectorAll('button:not([hidden])')];
      const position = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(position + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  }

  function next() {
    if (index === usable.length - 1) close(true);
    else { index += 1; show(); }
  }

  layer.querySelector('[data-tour-next]').addEventListener('click', next);
  layer.querySelector('[data-tour-back]').addEventListener('click', () => { index -= 1; show(); });
  layer.querySelector('[data-tour-skip]').addEventListener('click', () => close(false));
  addEventListener('resize', place);
  addEventListener('scroll', place, true);
  document.addEventListener('keydown', keys, true);
  show();
  return () => close(false);
}
