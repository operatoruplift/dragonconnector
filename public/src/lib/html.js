// A tagged template that escapes every interpolated value unless it is already trusted markup.
// Views build their HTML with it, so names, messages and anything else people type stay text.

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ENTITIES[char]);

class Markup {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}

/** Mark a string as trusted markup. Use only for markup the app itself produced. */
export const raw = (value) => new Markup(String(value));

function render(value) {
  if (value instanceof Markup) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  if (value === false || value === null || value === undefined) return '';
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, index) => { out += render(value) + strings[index + 1]; });
  return new Markup(out);
}
