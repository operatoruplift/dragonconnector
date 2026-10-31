// Quests, levels and badges. XP is never stored: it is the sum of the quests a person has
// completed, and a quest stays complete once earned.
import { GUIDES, REQUIREMENTS } from '../data/content.js';

export const LEVELS = [
  { name: 'Hatchling', min: 0 },
  { name: 'Spark', min: 100 },
  { name: 'Builder', min: 250 },
  { name: 'Shipper', min: 500 },
  { name: 'Connector', min: 800 },
  { name: 'Bridge Keeper', min: 1100 },
  { name: 'Dragon', min: 1350 },
];

export const PHASES = ['Get in', 'Find your crew', 'Prepare', 'Event day'];

const sentByMe = (thread) => thread?.messages?.some((message) => message.from === 'me');
const requirementIds = REQUIREMENTS.flatMap((group) => group.items.map((item) => item.id));

export function profileComplete(profile = {}) {
  return Boolean(profile.name?.trim() && profile.role && (profile.skills?.length ?? 0) >= 3 && (profile.tracks?.length ?? 0) >= 1 && profile.lookingFor);
}

export const QUESTS = [
  { id: 'waitlist', phase: 'Get in', title: 'Join the waitlist', xp: 50, route: 'waitlist', done: (s) => Boolean(s.waitlist) },
  { id: 'profile', phase: 'Get in', title: 'Build your builder profile', xp: 100, route: 'profile', hint: 'Name, role, three skills, a track and what you are looking for.', done: (s) => profileComplete(s.profile) },
  { id: 'register', phase: 'Get in', title: 'Pre-register', xp: 150, route: 'register', done: (s) => ['pre-registered', 'registered'].includes(s.registration.status) },
  { id: 'tour', phase: 'Get in', title: 'Take the app tour', xp: 50, route: 'home', done: (s) => s.tourDone },
  { id: 'install', phase: 'Get in', title: 'Install the app', xp: 50, route: 'settings', done: (s) => s.installed },
  { id: 'browse', phase: 'Find your crew', title: 'Explore teammate matches', xp: 20, route: 'team', done: (s) => Boolean(s.visited.team) },
  { id: 'intro', phase: 'Find your crew', title: 'Send an intro to a builder', xp: 75, route: 'team', done: (s) => Object.values(s.threads).some((thread) => ['dm', 'direct'].includes(thread.kind) && sentByMe(thread)) },
  { id: 'team', phase: 'Find your crew', title: 'Create your team', xp: 100, route: 'team', done: (s) => Boolean(s.team) },
  { id: 'guide-chat', phase: 'Find your crew', title: 'Ask the Dragon Guide a question', xp: 25, route: 'inbox/guide', done: (s) => sentByMe(s.threads.guide) },
  { id: 'first-guide', phase: 'Prepare', title: 'Read your first guide', xp: 20, route: 'guides', done: (s) => s.guidesRead.length >= 1 },
  { id: 'all-guides', phase: 'Prepare', title: 'Read every guide', xp: 80, route: 'guides', done: (s) => GUIDES.every((guide) => s.guidesRead.includes(guide.slug)) },
  { id: 'checklist', phase: 'Prepare', title: 'Tick off the requirements checklist', xp: 50, route: 'requirements', done: (s) => requirementIds.every((id) => s.requirementsChecked.includes(id)) },
  { id: 'plan', phase: 'Prepare', title: 'Save three sessions to your plan', xp: 30, route: 'schedule', done: (s) => s.bookmarks.length >= 3 },
  { id: 'map', phase: 'Prepare', title: 'Scout the venue map', xp: 20, route: 'map', done: (s) => Boolean(s.visited.map) },
  { id: 'prizes', phase: 'Prepare', title: 'Learn how prizes are judged', xp: 20, route: 'prizes', done: (s) => Boolean(s.visited.prizes) },
  { id: 'sponsors', phase: 'Prepare', title: 'Meet the partner programme', xp: 20, route: 'sponsors', done: (s) => Boolean(s.visited.sponsors) },
  { id: 'rules', phase: 'Prepare', title: 'Read the draft rules', xp: 20, route: 'docs/rules', done: (s) => Boolean(s.visited['docs/rules']) },
  { id: 'task', phase: 'Prepare', title: 'Complete a task of your own', xp: 20, route: 'quests', done: (s) => s.tasks.some((task) => task.done) },
  { id: 'checkin', phase: 'Event day', title: 'Check in at the venue', xp: 200, route: 'checkin', done: (s) => Boolean(s.checkIn) },
  { id: 'draft', phase: 'Event day', title: 'Start your submission', xp: 50, route: 'submit', done: (s) => s.submission.status !== 'empty' },
  { id: 'submit', phase: 'Event day', title: 'Submit your project', xp: 250, route: 'submit', done: (s) => s.submission.status === 'submitted' },
];

export const MAX_XP = QUESTS.reduce((sum, quest) => sum + quest.xp, 0);

export const BADGES = [
  { id: 'listed', title: 'On the list', detail: 'Joined the waitlist', quests: ['waitlist'] },
  { id: 'pathfinder', title: 'Pathfinder', detail: 'Took the tour and built a profile', quests: ['tour', 'profile'] },
  { id: 'ready', title: 'Pre-registered', detail: 'Completed pre-registration', quests: ['register'] },
  { id: 'pocket', title: 'Pocket dragon', detail: 'Installed the app', quests: ['install'] },
  { id: 'crew', title: 'Crew assembled', detail: 'Sent an intro and created a team', quests: ['intro', 'team'] },
  { id: 'scholar', title: 'Scholar', detail: 'Read every guide', quests: ['all-guides'] },
  { id: 'scout', title: 'Scout', detail: 'Explored the map, prizes, partners and rules', quests: ['map', 'prizes', 'sponsors', 'rules'] },
  { id: 'planner', title: 'Planner', detail: 'Planned sessions and packed the checklist', quests: ['plan', 'checklist'] },
  { id: 'arrived', title: 'Checked in', detail: 'Checked in at the venue', quests: ['checkin'] },
  { id: 'shipped', title: 'Shipped', detail: 'Submitted a project', quests: ['submit'] },
];

export const xpOf = (state) => QUESTS.reduce((sum, quest) => sum + (state.quests[quest.id] ? quest.xp : 0), 0);

export function levelFor(xp) {
  let index = 0;
  LEVELS.forEach((level, i) => { if (xp >= level.min) index = i; });
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next ? (xp - level.min) / (next.min - level.min) : 1;
  return { index, number: index + 1, name: level.name, min: level.min, next, progress: Math.max(0, Math.min(1, progress)) };
}

export const earnedBadges = (state) => BADGES.filter((badge) => badge.quests.every((id) => state.quests[id]));

/** Record newly completed quests on the draft state and describe what changed. */
export function applyProgress(draft, now) {
  const before = levelFor(xpOf(draft)).index;
  const hadBadges = new Set(earnedBadges(draft).map((badge) => badge.id));
  const events = [];
  for (const quest of QUESTS) {
    if (!draft.quests[quest.id] && quest.done(draft)) {
      draft.quests[quest.id] = now;
      events.push({ type: 'quest', quest });
    }
  }
  const after = levelFor(xpOf(draft));
  if (after.index > before) events.push({ type: 'level', level: after });
  for (const badge of earnedBadges(draft)) if (!hadBadges.has(badge.id)) events.push({ type: 'badge', badge });
  return events;
}

export const nextQuest = (state) => QUESTS.find((quest) => !state.quests[quest.id] && quest.phase !== 'Event day') ?? QUESTS.find((quest) => !state.quests[quest.id]) ?? null;
