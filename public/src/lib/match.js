// Teammate matching: a transparent score with the reasons behind it. Complementary roles and
// skills count for more than similarity, because teams need range.
import { ROLES } from '../data/people.js';
import { TRACKS } from '../data/event.js';

const roleLabel = (id) => ROLES.find((role) => role.id === id)?.label ?? id;
const trackTitle = (id) => TRACKS.find((track) => track.id === id)?.title ?? id;
const overlap = (a = [], b = []) => a.filter((item) => b.includes(item));
const lower = (list = []) => list.map((item) => item.toLowerCase());

export function matchScore(me, other, team = null) {
  const reasons = [];
  let score = 0;
  const add = (points, reason) => { score += points; if (reason) reasons.push({ points, reason }); };

  if (me.role && other.role) {
    if (other.role !== me.role) add(30, `Complements your role: ${roleLabel(other.role)}`);
    else add(8, `Same role as you: ${roleLabel(other.role)}`);
  }
  if (team?.openRoles?.includes(other.role)) add(20, 'Fills an open role on your team');

  const tracks = overlap(me.tracks, other.tracks);
  if (tracks.length) add(15 + 5 * (tracks.length - 1), `Also interested in ${tracks.map(trackTitle).join(' and ')}`);

  const mine = lower(me.skills);
  const brings = other.skills.filter((skill) => !mine.includes(skill.toLowerCase()));
  const shared = other.skills.filter((skill) => mine.includes(skill.toLowerCase()));
  if (brings.length) add(3 * Math.min(brings.length, 4), `Brings ${brings.slice(0, 3).join(', ')}`);
  if (shared.length) add(2 * Math.min(shared.length, 3), `Shares ${shared.slice(0, 2).join(' and ')}`);

  const want = me.lookingFor;
  const offer = other.lookingFor;
  if (want === 'cofounder' && offer === 'cofounder') add(15, 'Also looking for a co-founder');
  else if (want === 'team' && offer === 'members') add(12, 'Has a team that needs members');
  else if (want === 'members' && offer === 'team') add(12, 'Looking for a team to join');
  else if (want === 'team' && offer === 'team') add(6, 'Also looking for a team');

  const languages = overlap(me.languages, other.languages);
  if (languages.length) add(5, `Speaks ${languages.join(' and ')}`);
  if (overlap(me.formats, other.formats).length) add(4, 'Available for the same format');

  return {
    score: Math.max(0, Math.min(99, Math.round(score))),
    reasons: reasons.sort((a, b) => b.points - a.points).slice(0, 3).map((item) => item.reason),
  };
}

export function rankMatches(me, profiles, team = null) {
  return profiles
    .map((profile) => ({ profile, ...matchScore(me, profile, team) }))
    .sort((a, b) => b.score - a.score || a.profile.name.localeCompare(b.profile.name));
}
