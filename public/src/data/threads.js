// Conversations every new installation starts with.
import { EVENT, FORMATS } from './event.js';

const posted = Date.parse('2026-10-30T09:00:00+07:00');

export function seedThreads() {
  return [
    {
      id: 'announcements',
      kind: 'announcements',
      title: 'Organizers',
      subtitle: 'Announcements',
      readOnly: true,
      unread: 3,
      messages: [
        { id: 'a1', from: 'organizers', at: posted, text: `${EVENT.name} · ${EVENT.edition} is in planning. Dates, venue, funding and prizes are proposals until we confirm them here.` },
        { id: 'a2', from: 'organizers', at: posted + 60000, text: `Proposed formats: Option A on ${FORMATS.A.dateLabel} (one day), or Option B on ${FORMATS.B.dateLabel} (two daytime sessions). Proposed venue: ${EVENT.venue.name}, ${EVENT.venue.city}.` },
        { id: 'a3', from: 'organizers', at: posted + 120000, text: 'Registration is not open. Join the waitlist and pre-register in the app so your details are ready. They stay on your device until the official registration page exists.' },
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
