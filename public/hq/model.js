// HQ's data, worked out from what the hq_ functions return. Everything here is pure, so it can be
// tested without a browser or a database (tests/hq.test.mjs).
import { JUDGING, PACKAGES, TRACKS } from '../src/data/event.js';
import { LOOKING_FOR, ROLES } from '../src/data/people.js';

// The four published criteria, 25 points each, in the order the site and the app list them.
export const CRITERIA = [['prototype', 'Prototype'], ['ux', 'Experience'], ['technical', 'Technical'], ['pitch', 'Pitch']]
  .map(([id, short], index) => ({ id, short, label: JUDGING.rubric[index].label, max: JUDGING.rubric[index].points }));
export const MAX_TOTAL = CRITERIA.reduce((sum, item) => sum + item.max, 0);
export const FINALISTS = JUDGING.finalists;

export const STATUS_LABEL = { registered: 'Registered', unconfirmed: 'Not confirmed', waitlist: 'Waitlist', profile: 'Profile only' };
export const EXPERIENCE = { first: 'First hackathon', some: 'One to three', many: 'Four or more' };
export const INQUIRY_STATUSES = [
  { id: 'new', label: 'New' }, { id: 'contacted', label: 'Contacted' }, { id: 'talking', label: 'In talks' },
  { id: 'confirmed', label: 'Confirmed' }, { id: 'declined', label: 'Declined' },
];
export const ROLE_LABEL = { organizer: 'Organizer', judge: 'Judge', crew: 'Check-in crew' };
export const SWITCHES = [
  { id: 'registration_open', title: 'Registration', on: 'Builders can register in the app. The waitlist step becomes Register.', off: 'Builders join the waitlist. Registration stays closed.' },
  { id: 'check_in_open', title: 'Self check-in', on: 'Builders can check themselves in with the venue code below.', off: 'Only the check-in desk checks people in.' },
  { id: 'submissions_open', title: 'Final submissions', on: 'Builders can submit their projects. Drafts are always allowed.', off: 'Builders can save drafts but not submit.' },
  { id: 'judging_open', title: 'Judging', on: 'Judges can score submitted projects in HQ.', off: 'Judges can read projects, but scores are frozen.' },
];

export const roleLabel = (id) => ROLES.find((role) => role.id === id)?.label ?? id ?? '';
export const trackLabel = (id) => TRACKS.find((track) => track.id === id)?.title ?? id ?? '';
export const lookingLabel = (id) => LOOKING_FOR.find((item) => item.id === id)?.label ?? id ?? '';
export const tierLabel = (id) => PACKAGES.find((item) => item.id === id)?.name ?? (id === 'unsure' ? 'Not sure yet' : id);
export const inquiryLabel = (id) => INQUIRY_STATUSES.find((item) => item.id === id)?.label ?? id;

/** The pass code in whatever was scanned or typed: the code, the pass's QR link or an old DC001: pass. */
export function passFrom(text) {
  const match = String(text ?? '').match(/DC-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
  return match ? match[0].toUpperCase() : null;
}

const time = (value) => (typeof value === 'number' ? value : value ? Date.parse(value) : 0);
const index = (list, key) => new Map((list ?? []).map((item) => [item[key], item]));

/**
 * One row per person: builders who registered, made a profile or joined the waitlist. A waitlist
 * entry joins its builder when it was sent from their account; otherwise it stands alone.
 */
export function people(event) {
  const registrations = index(event.registrations, 'user_id');
  const profiles = index(event.profiles, 'id');
  const checkIns = index(event.check_ins, 'user_id');
  const teamOf = new Map();
  for (const team of event.teams ?? []) for (const member of team.members) if (member.status === 'joined') teamOf.set(member.user_id, team);
  const waitlistByUser = new Map((event.waitlist ?? []).filter((entry) => entry.user_id).map((entry) => [entry.user_id, entry]));
  const ids = new Set([...registrations.keys(), ...profiles.keys()]);
  const rows = [...ids].map((id) => {
    const registration = registrations.get(id);
    const profile = profiles.get(id);
    const entry = waitlistByUser.get(id);
    const team = teamOf.get(id);
    const status = registration ? (registration.status === 'registered' ? 'registered' : 'unconfirmed') : entry ? 'waitlist' : 'profile';
    return {
      id,
      key: id,
      name: registration?.name ?? profile?.name ?? entry?.name ?? 'Builder',
      email: registration?.email ?? entry?.email ?? '',
      phone: registration?.phone ?? '',
      status,
      role: profile?.role ?? entry?.role ?? '',
      tracks: profile?.tracks?.length ? profile.tracks : entry?.track ? [entry.track] : [],
      skills: profile?.skills ?? [],
      languages: profile?.languages ?? [],
      lookingFor: profile?.looking_for ?? '',
      bio: profile?.bio ?? '',
      github: profile?.github ?? '',
      discoverable: Boolean(profile?.discoverable),
      experience: registration?.experience ?? '',
      dietary: registration?.dietary ?? '',
      access: registration?.access_needs ?? '',
      media: registration ? Boolean(registration.media_consent) : null,
      pass: registration?.pass_code ?? '',
      checkedInAt: checkIns.get(id)?.checked_in_at ?? null,
      team: team ? { id: team.id, name: team.name } : null,
      waitlistId: entry?.id ?? null,
      joinedAt: [registration?.created_at, profile?.created_at, entry?.created_at].filter(Boolean).sort()[0] ?? null,
    };
  });
  for (const entry of event.waitlist ?? []) {
    if (entry.user_id && ids.has(entry.user_id)) continue;
    rows.push({
      id: null, key: `w${entry.id}`, name: entry.name, email: entry.email, phone: '', status: 'waitlist', role: entry.role,
      tracks: entry.track ? [entry.track] : [], skills: [], languages: [], lookingFor: '', bio: '', github: '', discoverable: false,
      experience: '', dietary: '', access: '', media: null, pass: '', checkedInAt: null, team: null, waitlistId: entry.id, joinedAt: entry.created_at,
    });
  }
  return rows.sort((a, b) => time(b.joinedAt) - time(a.joinedAt) || a.name.localeCompare(b.name));
}

export const PEOPLE_FILTERS = [
  { id: 'all', label: 'Everyone', test: () => true },
  { id: 'registered', label: 'Registered', test: (row) => row.status === 'registered' },
  { id: 'unconfirmed', label: 'Not confirmed', test: (row) => row.status === 'unconfirmed' },
  { id: 'waitlist', label: 'Waitlist', test: (row) => row.status === 'waitlist' },
  { id: 'in', label: 'Checked in', test: (row) => Boolean(row.checkedInAt) },
  { id: 'out', label: 'Not checked in', test: (row) => ['registered', 'unconfirmed'].includes(row.status) && !row.checkedInAt },
  { id: 'needs', label: 'Dietary or access needs', test: (row) => Boolean(row.dietary || row.access) },
];

/** People matching a filter and a search across names, emails, skills, teams and pass codes. */
export function filterPeople(rows, { filter = 'all', query = '', track = '' } = {}) {
  const test = PEOPLE_FILTERS.find((item) => item.id === filter)?.test ?? (() => true);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter((row) => test(row)
    && (!track || row.tracks.includes(track))
    && words.every((word) => [row.name, row.email, row.pass, row.team?.name, roleLabel(row.role), ...row.skills].join(' ').toLowerCase().includes(word)));
}

/** Counts across ranked categories, largest first, for a bar list. */
export function tally(values, labels = (id) => id) {
  const counts = new Map();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].map(([id, count]) => ({ id, label: labels(id), count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Days from first to last (YYYY-MM-DD, Vietnam time), with how many sign-ups each had. */
export function signupsByDay(event, now, days = 21) {
  const day = (value) => new Date(time(value) + 7 * 3600000).toISOString().slice(0, 10);
  const counts = new Map();
  for (const item of [...(event.waitlist ?? []), ...(event.registrations ?? [])]) counts.set(day(item.created_at), (counts.get(day(item.created_at)) ?? 0) + 1);
  const today = day(new Date(now).toISOString());
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1 - offset) * 86400000).toISOString().slice(0, 10);
    return { date, count: counts.get(date) ?? 0 };
  });
}

/** Threads in the organizer inbox: who wrote, the last message, and whether it waits for a reply. */
export function threads(event) {
  const names = new Map(people(event).filter((row) => row.id).map((row) => [row.id, row.name]));
  return (event.threads ?? []).map((thread) => {
    const last = thread.messages.at(-1) ?? null;
    return { ...thread, name: names.get(thread.builder_id) ?? 'Builder', last, waiting: Boolean(last && !last.from_organizers) };
  }).filter((thread) => thread.messages.length)
    .sort((a, b) => Number(b.waiting) - Number(a.waiting) || time(b.last?.created_at) - time(a.last?.created_at));
}

/** The numbers the overview leads with. */
export function stats(event) {
  const rows = people(event);
  const registered = rows.filter((row) => row.status === 'registered');
  const unconfirmed = rows.filter((row) => row.status === 'unconfirmed');
  const submissions = event.submissions ?? [];
  return {
    waitlist: (event.waitlist ?? []).length,
    registered: registered.length,
    unconfirmed: unconfirmed.length,
    profiles: (event.profiles ?? []).length,
    checkedIn: (event.check_ins ?? []).length,
    teams: (event.teams ?? []).length,
    withoutTeam: registered.filter((row) => !row.team).length,
    submitted: submissions.filter((item) => item.status === 'submitted').length,
    drafts: submissions.filter((item) => item.status === 'draft').length,
    waiting: threads(event).filter((thread) => thread.waiting).length,
    newInquiries: (event.inquiries ?? []).filter((item) => item.status === 'new').length,
    inquiries: (event.inquiries ?? []).length,
    media: registered.filter((row) => row.media === false).length,
  };
}

const complete = (score) => !score.conflict && CRITERIA.every((item) => Number.isInteger(score[item.id]));
export const scoreTotal = (score) => (complete(score) ? CRITERIA.reduce((sum, item) => sum + score[item.id], 0) : null);
const average = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

/**
 * The leaderboard: every submitted project ranked by its average total across the judges who
 * scored it in full. Conflicts and unfinished scores do not count. Ties share a rank.
 */
export function leaderboard(event) {
  const judges = index(event.crew, 'id');
  const teams = index(event.teams, 'id');
  const rows = (event.submissions ?? []).filter((item) => item.status === 'submitted').map((project) => {
    const scores = (event.scores ?? []).filter((score) => score.submission_id === project.id).map((score) => ({
      ...score, judge: judges.get(score.judge_id)?.name ?? 'Judge', revoked: Boolean(judges.get(score.judge_id)?.revoked_at), total: scoreTotal(score),
    })).sort((a, b) => a.judge.localeCompare(b.judge));
    const counted = scores.filter((score) => score.total !== null);
    return {
      id: project.id, name: project.name, track: project.track, team: teams.get(project.team_id)?.name ?? null,
      scores, judged: counted.length, conflicts: scores.filter((score) => score.conflict).length,
      average: average(counted.map((score) => score.total)),
      criteria: Object.fromEntries(CRITERIA.map((item) => [item.id, average(counted.map((score) => score[item.id]))])),
    };
  });
  rows.sort((a, b) => (b.average ?? -1) - (a.average ?? -1) || b.judged - a.judged || a.name.localeCompare(b.name));
  let rank = 0;
  rows.forEach((row, position) => {
    if (row.average === null) { row.rank = null; return; }
    if (position === 0 || row.average !== rows[position - 1].average) rank = position + 1;
    row.rank = rank;
    row.finalist = rank <= FINALISTS;
  });
  return rows;
}

/** Each active judge's progress through the submitted projects. */
export function judgeProgress(event) {
  const submitted = (event.submissions ?? []).filter((item) => item.status === 'submitted').map((item) => item.id);
  return (event.crew ?? []).filter((member) => member.role === 'judge' && !member.revoked_at).map((judge) => {
    const mine = (event.scores ?? []).filter((score) => score.judge_id === judge.id && submitted.includes(score.submission_id));
    return { id: judge.id, name: judge.name, scored: mine.filter((score) => complete(score)).length, conflicts: mine.filter((score) => score.conflict).length, of: submitted.length };
  });
}

/**
 * A CSV file people can open in Excel or Google Sheets: a byte-order mark so Vietnamese names
 * survive, quotes where needed, and cells that start like a formula neutralised.
 */
export function toCsv(rows, columns) {
  const cell = (value) => {
    let text = Array.isArray(value) ? value.join('; ') : value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.map(([label]) => cell(label)).join(','), ...rows.map((row) => columns.map(([, read]) => cell(read(row))).join(','))];
  return `﻿${lines.join('\r\n')}\r\n`;
}

export const REGISTRATION_COLUMNS = [
  ['Name', (row) => row.name], ['Email', (row) => row.email], ['Phone', (row) => row.phone], ['Status', (row) => STATUS_LABEL[row.status]],
  ['Role', (row) => roleLabel(row.role)], ['Tracks', (row) => row.tracks.map(trackLabel)], ['Team', (row) => row.team?.name ?? ''],
  ['Experience', (row) => EXPERIENCE[row.experience] ?? ''], ['Dietary needs', (row) => row.dietary], ['Access needs', (row) => row.access],
  ['Photos and video', (row) => (row.media === null ? '' : row.media ? 'Agrees' : 'Keep out of media')], ['Pass code', (row) => row.pass],
  ['Checked in', (row) => row.checkedInAt ?? ''], ['Joined', (row) => row.joinedAt ?? ''],
];

/** "3 min ago", "2 h ago", "Yesterday", or a date, in Vietnam time. */
export function ago(value, now) {
  if (!value) return '';
  const seconds = Math.max(0, Math.round((now - time(value)) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 172800) return 'Yesterday';
  return when(value);
}

export const when = (value) => (value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
