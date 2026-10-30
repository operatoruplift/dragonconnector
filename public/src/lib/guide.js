// The Dragon Guide answers questions from the event data with simple keyword matching, so it can
// only ever repeat what the app already knows, caveats included. Specific topics come first.
import { EVENT, FORMATS, GATES, JUDGING, PRIZES, SPONSORS, TRACKS } from '../data/event.js';

const prizeList = PRIZES.scenarios.map((scenario) => `${scenario.tier} $${scenario.usd.toLocaleString('en-US')}`).join(', ');

export const TOPICS = [
  { id: 'hello', words: ['hello', 'hi', 'hey', 'xin chào', 'xin chao', 'chào'], answer: () => ({ text: `Xin chào! Ask me about the dates, the venue, registration, teams, judging, prizes, check-in or submissions.` }) },
  { id: 'register', words: ['register', 'registration', 'sign up', 'signup', 'ticket', 'apply'], answer: () => ({ text: GATES.registration.open ? 'Registration is open. Head to Pre-register to complete it.' : 'Registration is not open yet. Join the waitlist and pre-register in the app so your details are ready. They stay on your device until the official registration page exists.', links: [{ label: 'Waitlist', route: 'waitlist' }, { label: 'Pre-register', route: 'register' }] }) },
  { id: 'submit', words: ['submit', 'submission', 'deadline', 'code freeze', 'upload', 'demo'], answer: () => ({ text: `Code freeze is proposed for ${FORMATS.A.codeFreeze} on Sunday 13 December in the one-day format, or ${FORMATS.B.codeFreeze} in the two-day format. You need a repository link and a working demo. You can draft your submission now.`, links: [{ label: 'Submission', route: 'submit' }, { label: 'Demo guide', route: 'guides/demo' }] }) },
  { id: 'checkin', words: ['check in', 'check-in', 'checkin', 'pass', 'qr', 'arrive', 'arrival'], answer: () => ({ text: 'On event day, show your check-in pass at the check-in desk, or enter the venue code in the app. Check-in opens at the venue on the day.', links: [{ label: 'Check-in pass', route: 'checkin' }] }) },
  { id: 'judging', words: ['judge', 'judging', 'rubric', 'score', 'finalist', 'criteria'], answer: () => ({ text: `Projects are scored out of 100: ${JUDGING.rubric.map((item) => `${item.points} for ${item.label.toLowerCase()}`).join(', ')}. Up to ${JUDGING.finalists} finalists get a ${JUDGING.slotMinutes}-minute slot. The rubric is proposed and will be published with the rules.`, links: [{ label: 'How judging works', route: 'guides/judging' }] }) },
  { id: 'prizes', words: ['prize', 'money', 'reward', 'win', 'pool', 'cash', 'bounty'], answer: () => ({ text: `The proposal plans a prize pool of ${prizeList}, depending on which funding scenario is secured. These are planned allocations, not funded or announced awards, and no sponsor cash has been received yet.`, links: [{ label: 'Prize pool', route: 'prizes' }] }) },
  { id: 'sponsors', words: ['sponsor', 'partner', 'company', 'companies', 'support'], answer: () => ({ text: SPONSORS.length ? `Confirmed sponsors: ${SPONSORS.map((sponsor) => sponsor.name).join(', ')}.` : 'No sponsor is confirmed yet. Organizations appear in the app only after they agree in writing to be named.', links: [{ label: 'Sponsors', route: 'sponsors' }] }) },
  { id: 'team', words: ['team', 'teammate', 'cofounder', 'co-founder', 'founder', 'group', 'match'], answer: () => ({ text: 'Open Teammates to see builders ranked by how well they complement you, with the reasons. Send an intro, then create a team and invite people to fill your open roles.', links: [{ label: 'Teammates', route: 'team' }] }) },
  { id: 'venue', words: ['venue', 'where', 'location', 'address', 'swinburne', 'campus', 'room'], answer: () => ({ text: `The proposed venue is ${EVENT.venue.name} in ${EVENT.venue.city}. ${EVENT.venue.status}`, links: [{ label: 'Venue map', route: 'map' }] }) },
  { id: 'food', words: ['food', 'meal', 'lunch', 'dinner', 'breakfast', 'catering', 'eat'], answer: () => ({ text: 'Meals appear in the proposed schedule, but the meal scope and vendors are still to be agreed, so free food is not guaranteed.', links: [{ label: 'Schedule', route: 'schedule' }] }) },
  { id: 'overnight', words: ['overnight', 'sleep', 'accommodation', 'hotel', 'stay', 'travel'], answer: () => ({ text: 'The two-day format runs in daytime sessions and the venue closes overnight. Accommodation and travel are not included.' }) },
  { id: 'cost', words: ['cost', 'price', 'fee', 'free', 'pay'], answer: () => ({ text: 'Admission terms have not been set. The budget in the proposal is a production budget, not a ticket price.' }) },
  { id: 'bring', words: ['bring', 'requirement', 'laptop', 'need', 'prepare', 'setup', 'set up'], answer: () => ({ text: 'Bring a laptop, charger and phone, and set up GitHub, a devnet wallet and your development tools before the day. The Requirements checklist has the full list.', links: [{ label: 'Requirements', route: 'requirements' }] }) },
  { id: 'xp', words: ['xp', 'level', 'quest', 'badge', 'points', 'game'], answer: () => ({ text: 'Every quest earns XP, and XP raises your level from Hatchling to Dragon. Badges mark milestones. The full list is in Quests & tasks.', links: [{ label: 'Quests & tasks', route: 'quests' }] }) },
  { id: 'tracks', words: ['track', 'solana', 'mobile', 'ai', 'web3', 'university', 'student'], answer: () => ({ text: `The proposed tracks are ${TRACKS.map((track) => track.title).join(', ')}. Each guide explains how to prepare.`, links: [{ label: 'Guides', route: 'guides' }] }) },
  { id: 'schedule', words: ['schedule', 'agenda', 'programme', 'program', 'time', 'session'], answer: () => ({ text: `The one-day format runs 08:00–${FORMATS.A.close} with ${FORMATS.A.buildLabel}. The two-day format has ${FORMATS.B.buildLabel} and closes ${FORMATS.B.close}. Save sessions to your plan in Schedule.`, links: [{ label: 'Schedule', route: 'schedule' }] }) },
  { id: 'dates', words: ['date', 'when', 'day', 'december', 'month', 'start'], answer: () => ({ text: `The dates are proposed, not confirmed. Option A is ${FORMATS.A.dateLabel} (one day). Option B is ${FORMATS.B.dateLabel} (two daytime sessions). All times are ${EVENT.timezoneLabel}.`, links: [{ label: 'Schedule', route: 'schedule' }] }) },
];

const FALLBACK = { text: 'I can help with the dates, the venue, registration, teams, judging, prizes, check-in, submissions, what to bring and how XP works. Try one of the suggested questions below.', links: [] };

// Whole words and phrases (plurals too), so "ai" does not match "email" and "hi" does not match "this".
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text, word) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(word)}(e?s)?($|[^\\p{L}\\p{N}])`, 'iu').test(text);

export function answer(question) {
  const text = String(question).toLowerCase();
  const topic = TOPICS.find((item) => item.words.some((word) => mentions(text, word)));
  return topic ? { topic: topic.id, links: [], ...topic.answer() } : { topic: 'fallback', ...FALLBACK };
}

export const QUICK_QUESTIONS = ['When is it?', 'Can I register?', 'Where is the venue?', 'What are the prizes?', 'How is judging done?'];
