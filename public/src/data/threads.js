// Conversations every new installation starts with. Once the app reaches the event service, the
// organizers' published announcements replace these copies.
import { EVENT, FORMATS } from './event.js';

const posted = Date.parse('2026-10-30T09:00:00+07:00');

export function seedThreads() {
  return [
    {
      id: 'announcements',
      kind: 'announcements',
      title: 'Announcements',
      subtitle: 'From the organizers',
      readOnly: true,
      unread: 3,
      messages: [
        { id: 'a1', from: 'organizers', at: posted, text: `${EVENT.name} · ${EVENT.edition} is a free, two-day hackathon for mobile apps on Solana, on ${FORMATS.A.dateLabel} in ${EVENT.venue.city}. Both days are daytime only, with breakfast and lunch each day and dinner on Saturday. Teams of up to 4.` },
        { id: 'a2', from: 'organizers', at: posted + 60000, text: `Planned venue: ${EVENT.venue.name}, ${EVENT.venue.city}, confirmed when registration opens. Code freezes at ${FORMATS.A.codeFreeze} on Sunday, submissions close at ${FORMATS.A.submissionsClose} and the finalist demos start at ${FORMATS.A.demos}. ${EVENT.prizePolicy}` },
        { id: 'a3', from: 'organizers', at: posted + 120000, text: 'Registration is not open. Join the waitlist and pre-register in the app so your details are ready.' },
      ],
    },
    {
      id: 'guide',
      kind: 'guide',
      title: 'Dragon Guide',
      subtitle: 'Ask anything about the event',
      unread: 1,
      messages: [
        { id: 'g1', from: 'guide', at: posted, text: 'Xin chào! I am the Dragon Guide. Ask me about the dates, the venue, registration, teams, judging, prizes or anything else in the app.' },
      ],
    },
  ];
}
