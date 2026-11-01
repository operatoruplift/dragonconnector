// Event facts, taken from the Dragon Connector proposal (operatoruplift/da-nang-hackathon-proposal,
// dist/proposal.json, revised 1 November 2026). Everything here is a proposal until the organizers
// confirm it; keep the caveats with the facts when you change them.

export const EVENT = {
  name: 'Dragon Connector',
  edition: 'Da Nang / 001',
  tagline: 'Build. Ship. Connect.',
  promise: 'Where builders connect.',
  status: 'Event in planning',
  summary: 'A proposed mobile and AI hackathon in Da Nang, Vietnam.',
  timezone: 'Asia/Ho_Chi_Minh',
  timezoneLabel: 'ICT · UTC+7',
  proposalUrl: 'https://dragonconnector.vercel.app',
  contentUpdated: '1 November 2026',
  organizer: 'Matt Sim, Lead Executive Producer & Organizer',
  venue: {
    name: 'Swinburne University Vietnam',
    city: 'Da Nang',
    status: 'Proposed venue. The booking, room, address, capacity and access are not confirmed.',
  },
};

// Fallbacks for which steps are open. Once the app reaches the event service, the organizers'
// switches in the event_settings table decide (see lib/gates.js). Preview mode unlocks the closed
// steps on this device for demonstration only.
export const GATES = {
  registration: { open: false, note: 'Registration is not open. Pre-register now so your details are ready when it opens.' },
  checkIn: { note: 'Check-in opens at the venue on event day.' },
  submissions: { note: 'Submissions open on event day and close at code freeze.' },
};

// Live services. Without supabase, the app keeps everything on the device and says so.
export const INTEGRATIONS = {
  registrationUrl: null, // an external registration page, if registration moves elsewhere
  // The Supabase project behind accounts, the waitlist, messages, teams, submissions and check-in.
  // The anon key is public by design: row-level security (supabase/migrations) decides what it
  // can reach. Never put a service_role or secret key here.
  supabase: {
    url: 'https://ondistgfpmodesjrharp.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZGlzdGdmcG1vZGVzanJoYXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTIxNDEsImV4cCI6MjA3MjgyODE0MX0.QY_Bok1Uyb1y1QPANEOLmRT_GclQciajia8Hw7MQxuM',
    region: 'the United States (Ohio)',
  },
};

export const PREVIEW_CHECK_IN_CODE = 'DRAGON-001';

const session = (format, day, start, end, title, type, detail = '') => ({ id: `${format}${day}-${start.replace(':', '')}`, start, end, title, type, detail });

export const FORMATS = {
  A: {
    id: 'A',
    label: 'Option A · one day',
    short: 'One day',
    dateLabel: 'Sunday 13 December 2026',
    dates: ['2026-12-13'],
    onboarding: '6–12 December',
    buildLabel: '6h 45m of scheduled building',
    buildMinutes: 405,
    codeFreeze: '17:30–18:00',
    close: '20:30',
    note: 'A compact, single-day programme with two build sprints and evening demos.',
    days: [{
      date: '2026-12-13',
      label: 'Sunday 13 December',
      sessions: [
        session('A', 1, '08:00', '09:00', 'Arrival and readiness', 'arrival', 'Registration, breakfast and technical checks.'),
        session('A', 1, '09:00', '09:45', 'Opening and team formation', 'ceremony', 'Rules, team formation and approved partner remarks only.'),
        session('A', 1, '09:45', '13:00', 'Morning build sprint', 'build', 'Build with mentor support, subject to accepted mentor availability.'),
        session('A', 1, '13:00', '14:00', 'Lunch', 'meal', 'Optional interviews only with staffing and consent.'),
        session('A', 1, '14:00', '17:30', 'Afternoon build and pitch preparation', 'build', 'Proposed dinner pickup 17:00–17:30; meal scope and vendor still to agree.'),
        session('A', 1, '17:30', '18:00', 'Code freeze and upload', 'submission', 'Submit your repository and demo; eligibility review begins.'),
        session('A', 1, '18:00', '18:15', 'Screening and finalist shortlist', 'judging', 'Up to ten finalists are announced.'),
        session('A', 1, '18:15', '19:15', 'Finalist demos', 'demo', 'Up to ten slots: 3-minute demo, 2-minute Q&A, 1-minute transition.'),
        session('A', 1, '19:15', '19:45', 'Deliberation and buffer', 'judging', 'Independent judging and programme buffer.'),
        session('A', 1, '19:45', '20:30', 'Awards and close', 'ceremony', 'Awards only under funded, agreed terms; approved group photo.'),
      ],
    }],
  },
  B: {
    id: 'B',
    label: 'Option B · two days',
    short: 'Two days',
    dateLabel: 'Saturday 12 and Sunday 13 December 2026',
    dates: ['2026-12-12', '2026-12-13'],
    onboarding: '6–11 December',
    buildLabel: '13h 15m of scheduled building',
    buildMinutes: 795,
    codeFreeze: 'Day 2, 16:00–16:30',
    close: '19:00 on day 1, 18:45 on day 2',
    note: 'Two daytime sessions with more time to integrate and test. The venue closes overnight; accommodation and travel are not included.',
    days: [
      {
        date: '2026-12-12',
        label: 'Day 1 · Saturday 12 December',
        sessions: [
          session('B', 1, '08:30', '09:15', 'Check-in and breakfast', 'arrival'),
          session('B', 1, '09:15', '10:00', 'Opening, rules and team formation', 'ceremony'),
          session('B', 1, '10:00', '12:30', 'Build sprint and mentor support', 'build'),
          session('B', 1, '12:30', '13:15', 'Lunch', 'meal'),
          session('B', 1, '13:15', '17:45', 'Build sprint and mentor support', 'build'),
          session('B', 1, '17:45', '18:15', 'Progress checkpoint and next-day briefing', 'checkpoint'),
          session('B', 1, '18:15', '19:00', 'Dinner and venue close', 'meal'),
        ],
      },
      {
        date: '2026-12-13',
        label: 'Day 2 · Sunday 13 December',
        sessions: [
          session('B', 2, '08:30', '09:00', 'Breakfast and technical check', 'arrival'),
          session('B', 2, '09:00', '12:30', 'Build sprint', 'build'),
          session('B', 2, '12:30', '13:15', 'Lunch', 'meal'),
          session('B', 2, '13:15', '16:00', 'Final build and pitch preparation', 'build'),
          session('B', 2, '16:00', '16:30', 'Code freeze and submission upload', 'submission'),
          session('B', 2, '16:30', '16:45', 'Eligibility screening and shortlist of up to ten finalists', 'judging'),
          session('B', 2, '16:45', '17:45', 'Finalist demos', 'demo', 'Up to ten slots: 3-minute demo, 2-minute Q&A, 1-minute transition.'),
          session('B', 2, '17:45', '18:15', 'Judging deliberation', 'judging'),
          session('B', 2, '18:15', '18:45', 'Awards and close', 'ceremony'),
        ],
      },
    ],
  },
};

export const TRACKS = [
  { id: 'mobile', title: 'Solana Mobile', description: 'Practical mobile experiences with a clear user problem and a demonstrable prototype.', output: 'Working mobile demo, repository and integration evidence', eligibility: 'Tooling, device access, exact integration requirements and any partner bounty terms are still to be agreed. Normal dApp Store requirements apply; no publishing fast-track is promised.' },
  { id: 'ai', title: 'AI × Web3', description: 'Useful AI-assisted or AI-powered workflows with credible on-chain or mobile integration.', output: 'Working AI workflow, technical explanation and demo', eligibility: 'Actual tooling, credits, data rights and partner criteria must be confirmed.' },
  { id: 'university', title: 'University Builder', description: 'Student teams turning an idea into an explainable working prototype.', output: 'Prototype, problem statement and concise pitch', eligibility: 'University and team eligibility and scoring rules will be published; no university participation is confirmed.' },
];

export const JUDGING = {
  finalists: 10,
  slotMinutes: 6,
  slot: [{ label: 'Demo', minutes: 3 }, { label: 'Q&A', minutes: 2 }, { label: 'Transition', minutes: 1 }],
  rubric: [
    { label: 'Working mobile / AI prototype', points: 25 },
    { label: 'UI/UX and consumer readiness', points: 25 },
    { label: 'Solana / agreed partner integration', points: 25 },
    { label: 'Pitch and business viability', points: 25 },
  ],
  status: 'Proposed rubric. Evidence standards, track rules, conflicts and tie-breaks will be published before launch. Sponsor bounties may have separate agreed criteria.',
};

export const PRIZES = {
  // The same planned prize allocation applies to both formats.
  scenarios: [
    { tier: 'Lean', usd: 800 },
    { tier: 'Target', usd: 1500 },
    { tier: 'Flagship', usd: 3000 },
  ],
  cashReceivedUsd: 0,
  notes: [
    'These are planned allocations in the proposal budget, not funded or announced awards.',
    'No sponsor cash has been received. The final pool depends on the funding scenario the event can secure.',
    'Prize splits, eligibility, payment responsibility and timing will be published with the rules before launch.',
    'Partner contributions fund the selected scenario. They do not automatically add to the prize pool.',
  ],
};

export const TARGETS = [
  { label: 'Registrations', range: '150–250' },
  { label: 'Active builders', range: '80–120' },
  { label: 'Eligible prototypes', range: '20–30' },
];
export const TARGET_NOTE = 'Planning targets, not guaranteed results. Final capacity depends on the venue, available funds and accepted staffing.';

// Confirmed sponsors only: organizations that have agreed in writing to be named.
// Shape: { name, package, url, logo, blurb, track, challenge, provides }, where package is one of the
// PACKAGES ids and decides where the sponsor appears. Empty until then; prospects are never listed here.
export const SPONSORS = [];

// The five suggested packages from the proposal (dist/proposal.json, sponsor_packages), and where each
// appears on the Sponsors page. Suggestions for discussion: nothing is sold or committed.
export const PACKAGES = [
  { id: 'presenting', name: 'Presenting partner', contribution: 'From $3,000', placement: 'The top banner: “Presented by”, with a logo, a description and a link.', funds: ['The core event: prizes, food, connectivity and print'] },
  { id: 'track', name: 'Track partner', contribution: '$1,000–$2,500', placement: 'A featured card with a logo, the track it names, a description and a link.', funds: ['One track’s prizes and judging'] },
  { id: 'challenge', name: 'Challenge partner', contribution: '$300–$1,000', placement: 'A logo card with its challenge and a link.', funds: ['One challenge prize inside a track'] },
  { id: 'in-kind', name: 'In-kind partner', contribution: 'Goods or services', placement: 'A logo in the partners row, with what it provides.', funds: ['A delivery need: room and AV, catering, connectivity, apparel or media'] },
  { id: 'community', name: 'Community partner', contribution: 'Time and reach', placement: 'A name in the community partners list.', funds: ['Outreach, mentor hours and volunteers'] },
];

// Placeholder brands that Preview mode shows on the Sponsors page, so organizers can show prospective
// sponsors where each package appears. They are labelled as examples and never mixed with real sponsors.
export const EXAMPLE_SPONSORS = [
  { name: 'Your brand', package: 'presenting', blurb: 'A line about your company and why it backs Da Nang’s builders, with a link to your page.' },
  { name: 'Your brand', package: 'track', track: 'Open track', blurb: 'Names the open track and sets its challenge.' },
  { name: 'Your brand', package: 'track', track: 'Mobile track', blurb: 'Names the mobile track and sets its challenge.' },
  { name: 'Your brand', package: 'challenge', challenge: 'Connected tourism' },
  { name: 'Your brand', package: 'challenge', challenge: 'Everyday payments' },
  { name: 'Your brand', package: 'in-kind', provides: 'Venue' },
  { name: 'Your brand', package: 'in-kind', provides: 'Food and drink' },
  { name: 'Your brand', package: 'in-kind', provides: 'Apparel' },
  { name: 'Your community', package: 'community' },
  { name: 'Your university', package: 'community' },
  { name: 'Your media', package: 'community' },
];

export const FAQS = [
  { q: 'Is the event confirmed?', a: 'It is a proposal. Dates, format, the Swinburne booking, funds and delivery support still need agreement.' },
  { q: 'Can people register now?', a: 'Not yet. Registration details will follow a viable delivery decision and published rules. You can join the waitlist and pre-register in this app so your details are ready.' },
  { q: 'Are prizes guaranteed?', a: 'Prize amounts are planning allowances. Funds, eligibility, payment ownership and every sponsor benefit must be agreed before they are announced.' },
  { q: 'Are there sponsors?', a: 'Not yet. Organizations are prospects for discussion; no sponsorship, endorsement, credit or service support is confirmed.' },
  { q: 'Does the two-day format include overnight access?', a: 'No. The venue closes overnight, and accommodation and travel are not included.' },
  { q: 'Is the planned budget a ticket price?', a: 'No. It is the proposed production budget in USD. Admission terms have not been set.' },
];
