// The Dragon Guide answers questions from the event data with simple keyword matching, so it can
// only ever repeat what the app already knows, caveats included. Specific topics come first.
import { EVENT, FORMATS, GATES, JUDGING, SPONSORS, TRACKS } from '../data/event.js';


export const TOPICS = [
  { id: 'hello', words: ['hello', 'hi', 'hey', 'xin chào', 'xin chao', 'chào'], answer: () => ({ text: `Xin chào! Ask me about the dates, the venue, registration, teams, judging, prizes, check-in or submissions.` }) },
  { id: 'register', words: ['register', 'registration', 'sign up', 'signup', 'ticket', 'apply'], answer: () => ({ text: GATES.registration.open ? 'Registration is open. Head to Pre-register to complete it.' : 'Registration is not open yet. Join the waitlist and pre-register in the app so your details are ready when it opens.', links: [{ label: 'Waitlist', route: 'waitlist' }, { label: 'Pre-register', route: 'register' }] }) },
  { id: 'submit', words: ['submit', 'submission', 'deadline', 'code freeze', 'upload', 'demo'], answer: () => ({ text: `Code freezes at ${FORMATS.A.codeFreeze} on Sunday 13 December, and submissions close at ${FORMATS.A.submissionsClose}. Submit a public GitHub repository and a demo link in the app; judges only score projects they can open. You can draft your submission now.`, links: [{ label: 'Submission', route: 'submit' }, { label: 'Demo guide', route: 'guides/demo' }] }) },
  { id: 'checkin', words: ['check in', 'check-in', 'checkin', 'pass', 'qr', 'arrive', 'arrival'], answer: () => ({ text: `When you arrive, show your check-in pass at the check-in desk, or enter the venue code in the app. ${GATES.checkIn.note}`, links: [{ label: 'Check-in pass', route: 'checkin' }] }) },
  { id: 'judging', words: ['judge', 'judging', 'rubric', 'score', 'finalist', 'criteria'], answer: () => ({ text: `Projects are scored out of 100: ${JUDGING.rubric.map((item) => `${item.points} for ${item.label.toLowerCase()}`).join(', ')}. Up to ${JUDGING.finalists} finalists get a ${JUDGING.slotMinutes}-minute slot. The rubric is in the official rules.`, links: [{ label: 'How judging works', route: 'guides/judging' }] }) },
  { id: 'prizes', words: ['prize', 'money', 'reward', 'win', 'pool', 'cash', 'bounty'], answer: () => ({ text: `Prizes come from the sponsors: a grand prize from the Dragon sponsor, track prizes and named prizes, announced as sponsors commit. ${EVENT.prizePolicy}`, links: [{ label: 'Prize pool', route: 'prizes' }] }) },
  { id: 'sponsors', words: ['sponsor', 'partner', 'company', 'companies', 'support'], answer: () => ({ text: SPONSORS.length ? `Confirmed sponsors: ${SPONSORS.map((sponsor) => sponsor.name).join(', ')}.` : 'No sponsor is confirmed yet. Organizations appear in the app only after they agree in writing to be named.', links: [{ label: 'Sponsors', route: 'sponsors' }] }) },
  { id: 'team', words: ['team', 'teammate', 'cofounder', 'co-founder', 'founder', 'group', 'match'], answer: () => ({ text: 'Open Teammates to see builders ranked by how well they complement you, with the reasons. Send an intro, then create a team and invite people to fill your open roles.', links: [{ label: 'Teammates', route: 'team' }] }) },
  { id: 'venue', words: ['venue', 'where', 'location', 'address', 'swinburne', 'campus', 'room'], answer: () => ({ text: `The planned venue is ${EVENT.venue.name} in ${EVENT.venue.city}. ${EVENT.venue.status}`, links: [{ label: 'Venue map', route: 'map' }] }) },
  { id: 'food', words: ['food', 'meal', 'lunch', 'dinner', 'breakfast', 'catering', 'eat'], answer: () => ({ text: 'Breakfast and lunch are included on both days, and dinner on Saturday. Tell us about dietary needs when you pre-register.', links: [{ label: 'Schedule', route: 'schedule' }] }) },
  { id: 'overnight', words: ['overnight', 'sleep', 'accommodation', 'hotel', 'stay', 'travel', 'evening', 'night'], answer: () => ({ text: `Dragon Connector is daytime only: the venue closes at ${FORMATS.A.close}, and there is no overnight building on site. Accommodation and travel are not included. Working off site in the evening is optional.` }) },
  { id: 'cost', words: ['cost', 'price', 'fee', 'free', 'pay'], answer: () => ({ text: 'Dragon Connector is free to attend, and meals are included: breakfast and lunch on both days, and dinner on Saturday.' }) },
  { id: 'bring', words: ['bring', 'requirement', 'laptop', 'need', 'prepare', 'setup', 'set up'], answer: () => ({ text: 'Bring a laptop, charger and phone, and set up GitHub, a devnet wallet and your development tools before the event. The Requirements checklist has the full list.', links: [{ label: 'Requirements', route: 'requirements' }] }) },
  { id: 'xp', words: ['xp', 'level', 'quest', 'badge', 'points', 'game'], answer: () => ({ text: 'Every quest earns XP, and XP raises your level from Hatchling to Dragon. Badges mark milestones. The full list is in Quests & tasks.', links: [{ label: 'Quests & tasks', route: 'quests' }] }) },
  { id: 'tracks', words: ['track', 'solana', 'mobile', 'ai', 'web3', 'university', 'student'], answer: () => ({ text: `Up to three tracks: ${TRACKS.map((track) => track.title).join(', ')}. Track sponsors may rename them. Each guide explains how to prepare.`, links: [{ label: 'Guides', route: 'guides' }] }) },
  { id: 'schedule', words: ['schedule', 'agenda', 'programme', 'program', 'time', 'session'], answer: () => ({ text: `Two days, ${FORMATS.A.hours}, with ${FORMATS.A.buildLabel}. Code freezes at ${FORMATS.A.codeFreeze} on Sunday, submissions close at ${FORMATS.A.submissionsClose} and the finalist demos start at ${FORMATS.A.demos}. Save sessions to your plan in Schedule.`, links: [{ label: 'Schedule', route: 'schedule' }] }) },
  { id: 'dates', words: ['date', 'when', 'day', 'december', 'month', 'start', 'saturday', 'sunday', 'weekend'], answer: () => ({ text: `${EVENT.name} is on ${FORMATS.A.dateLabel}: ${FORMATS.A.hours}. All times are ${EVENT.timezoneLabel}.`, links: [{ label: 'Schedule', route: 'schedule' }] }) },
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
