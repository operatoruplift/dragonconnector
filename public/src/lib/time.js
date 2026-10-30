// Event time is Indochina Time (UTC+7, no daylight saving), wherever the viewer is.
const ICT_OFFSET_MS = 7 * 60 * 60 * 1000;

export const ictDate = (now) => new Date(now + ICT_OFFSET_MS).toISOString().slice(0, 10);

export function ictMinutes(now) {
  const date = new Date(now + ICT_OFFSET_MS);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export const instant = (date, time) => Date.parse(`${date}T${time}:00+07:00`);

export function eventWindow(format) {
  const first = format.days[0];
  const last = format.days.at(-1);
  return { start: instant(first.date, first.sessions[0].start), end: instant(last.date, last.sessions.at(-1).end) };
}

export const isEventDay = (now, format) => format.dates.includes(ictDate(now));

export function countdown(now, target) {
  const ms = target - now;
  if (ms <= 0) return { past: true, days: 0, hours: 0, minutes: 0 };
  const minutes = Math.floor(ms / 60000);
  return { past: false, days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60 };
}

/** Where a session sits relative to now: 'past', 'now', 'next' or 'later'. */
export function sessionState(now, date, session, nextId) {
  const start = instant(date, session.start);
  const end = instant(date, session.end);
  if (now >= end) return 'past';
  if (now >= start) return 'now';
  return session.id === nextId ? 'next' : 'later';
}

export function relativeTime(then, now) {
  const minutes = Math.round((now - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
