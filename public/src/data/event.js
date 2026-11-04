// Event facts, taken from the Dragon Connector website (operatoruplift/da-nang-hackathon-proposal,
// site-src/event.json and site-src/i18n/en.json, updated 4 November 2026). The venue booking and the
// sponsors are still to be confirmed; keep those caveats with the facts when you change them.

export const EVENT = {
  name: 'Dragon Connector',
  edition: 'Da Nang / 001',
  tagline: 'Build. Ship. Connect.',
  promise: 'Where builders connect.',
  status: 'Registration opens soon',
  summary: 'A free, one-day hackathon for mobile apps on Solana in Da Nang, Vietnam.',
  date: '2026-12-19',
  dateLabel: 'Saturday 19 December 2026',
  independence: 'Dragon Connector is an independent event. It is not run or endorsed by Solana Mobile.',
  prizePolicy: 'Every prize is paid in VND or goods, never in crypto. Prizes over VND 20 million carry 10% personal income tax, which the payer withholds.',
  teamMax: 4,
  timezone: 'Asia/Ho_Chi_Minh',
  timezoneLabel: 'ICT · UTC+7',
  siteUrl: 'https://dragonconnector.vercel.app',
  handle: '@dragonconnector',
  social: [
    { name: 'Instagram', url: 'https://www.instagram.com/dragonconnector/' },
    { name: 'TikTok', url: 'https://www.tiktok.com/@dragonconnector' },
    { name: 'Facebook', url: 'https://www.facebook.com/dragonconnector' },
    { name: 'X', url: 'https://x.com/dragonconnector' },
  ],
  rulesUrl: 'https://dragonconnector.vercel.app/rules/',
  sponsorsUrl: 'https://dragonconnector.vercel.app/sponsors/',
  contentUpdated: '4 November 2026',
  organizer: 'Matt Sim, Lead Executive Producer & Organizer',
  venue: {
    name: 'Swinburne University Vietnam',
    city: 'Da Nang',
    status: 'Planned venue. The booking is being confirmed and is announced with registration.',
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
    label: 'One day',
    short: 'One day',
    dateLabel: EVENT.dateLabel,
    dates: [EVENT.date],
    onboarding: 'the week before',
    buildLabel: '6 hours of building',
    buildMinutes: 360,
    codeFreeze: '16:30',
    close: '20:00',
    note: 'One day, from idea to demo. Code freezes at 16:30 so the judges see every project before the finalist demos at 18:00.',
    days: [{
      date: EVENT.date,
      label: 'Saturday 19 December',
      sessions: [
        session('A', 1, '08:00', '09:00', 'Check-in and breakfast', 'arrival', 'Show your pass, find a table and set up.'),
        session('A', 1, '09:00', '09:30', 'Opening', 'ceremony', 'Rules, tracks and short briefs from the sponsors.'),
        session('A', 1, '09:30', '12:00', 'Building starts', 'build', 'Solo builders can match into teams in the first half hour.'),
        session('A', 1, '12:00', '13:00', 'Lunch', 'meal', 'Included for every participant.'),
        session('A', 1, '13:00', '16:30', 'Building continues', 'build', 'Mentors and sponsors hold office hours at their tables.'),
        session('A', 1, '16:30', '17:45', 'Code freeze and judging round', 'submission', 'Code freezes at 16:30: submit your public GitHub repository and demo link. Judges then visit every team.'),
        session('A', 1, '17:45', '18:00', 'Finalists announced', 'judging', 'Up to 10 teams go through to the stage.'),
        session('A', 1, '18:00', '19:00', 'Finalist demos', 'demo', 'Three minutes of demo and two minutes of questions per team.'),
        session('A', 1, '19:00', '19:30', 'Judges deliberate', 'judging', 'Try the other projects at the community showcase.'),
        session('A', 1, '19:30', '20:00', 'Awards and close', 'ceremony', 'Winners announced, group photo, and home by 20:00.'),
      ],
    }],
  },
};

// Up to three tracks run on the day. Track sponsors name them; a presenting sponsor can set its own
// theme. The ids are fixed because the database stores them.
export const TRACKS = [
  { id: 'mobile', title: 'Consumer mobile', description: 'Apps people open every day: social, games, collectibles, habits and payments with friends.', output: 'A working app on a phone, a public repository and a demo', eligibility: 'Open to every team. A track sponsor may rename the track and set its challenge before registration opens.' },
  { id: 'ai', title: 'AI on mobile', description: 'Assistants and agents on the phone that take real actions for the person holding it.', output: 'A working assistant or agent, a public repository and a demo', eligibility: 'Open to every team. API credits are offered only if a sponsor provides them.' },
  { id: 'university', title: 'First-time builders', description: 'For students and teams at their first hackathon, judged on what they learned and shipped.', output: 'A prototype, a public repository and a short pitch', eligibility: 'For teams where most members are students or at their first hackathon.' },
];

export const JUDGING = {
  finalists: 10,
  slotMinutes: 6,
  slot: [{ label: 'Demo', minutes: 3 }, { label: 'Q&A', minutes: 2 }, { label: 'Transition', minutes: 1 }],
  rubric: [
    { label: 'Working prototype', points: 25 },
    { label: 'User experience', points: 25 },
    { label: 'Technical depth', points: 25 },
    { label: 'Pitch and potential', points: 25 },
  ],
  status: 'Judges score every project with a public repository at code freeze, then pick the winners after the finalist demos. Sponsored tracks and prizes may add criteria, published before the event.',
};

export const PRIZES = {
  // Prizes come from the sponsor tiers: a grand prize from the Dragon sponsor, track prizes from
  // track sponsors and named prizes from prize sponsors. Amounts are announced as sponsors commit.
  categories: [
    { id: 'grand', title: 'Grand prize', from: 'The Dragon sponsor' },
    { id: 'track', title: 'Track prizes', from: 'Each track sponsor, for up to 3 tracks' },
    { id: 'named', title: 'Named prizes', from: 'Prize sponsors, such as Best design' },
  ],
  cashReceivedUsd: 0,
  notes: [
    'Prize amounts are announced as sponsors commit in writing; nothing is funded yet.',
    'Every prize is paid in VND by bank transfer, or in goods. Never in crypto or tokens.',
    'Prizes over VND 20 million carry 10% personal income tax, which the payer withholds and declares.',
    'Prizes are shared equally within a team unless the team says otherwise. The official rules have the details.',
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

// The four sponsor tiers from the website (dragonconnector.vercel.app/sponsors), and where each
// appears on the Sponsors page. A tier becomes real only once a sponsor agrees in writing.
export const PACKAGES = [
  { id: 'dragon', name: 'Dragon', contribution: '$3,000 · 1 slot', placement: 'The top banner: “Presented by”, with a logo, a description and a link.', funds: ['The day itself: lunch, venue, connectivity and the grand prize'] },
  { id: 'track', name: 'Track', contribution: '$1,500 · up to 3', placement: 'A featured card with a logo, the track it names, a description and a link.', funds: ['One track’s prizes and judging'] },
  { id: 'prize', name: 'Prize', contribution: '$500 · up to 6', placement: 'A logo card with its prize and a link.', funds: ['One named prize, paid in full to the winners'] },
  { id: 'inkind', name: 'In-kind', contribution: 'Goods or services', placement: 'A logo in the partners row, with what it provides.', funds: ['Venue, food and drink, apparel, devices, connectivity or media'] },
];

// Placeholder brands that Preview mode shows on the Sponsors page, so organizers can show prospective
// sponsors where each tier appears. They are labelled as examples and never mixed with real sponsors.
export const EXAMPLE_SPONSORS = [
  { name: 'Your brand', package: 'dragon', blurb: 'A line about your company and why it backs Da Nang’s builders, with a link to your page.' },
  { name: 'Your brand', package: 'track', track: 'Consumer mobile track', blurb: 'Names the track and sets its challenge.' },
  { name: 'Your brand', package: 'track', track: 'AI on mobile track', blurb: 'Names the track and sets its challenge.' },
  { name: 'Your brand', package: 'prize', challenge: 'Best design' },
  { name: 'Your brand', package: 'prize', challenge: 'Best first-time team' },
  { name: 'Your brand', package: 'inkind', provides: 'Venue' },
  { name: 'Your brand', package: 'inkind', provides: 'Food and drink' },
  { name: 'Your brand', package: 'inkind', provides: 'Apparel' },
];

export const FAQS = [
  { q: 'How much does it cost?', a: 'Nothing. Dragon Connector is free to attend, and lunch is included.' },
  { q: 'When and where is it?', a: `On ${EVENT.dateLabel}, from 08:00 to 20:00 in Da Nang. The planned venue is Swinburne University Vietnam; the venue is confirmed when registration opens.` },
  { q: 'Can people register now?', a: 'Not yet. Join the waitlist and pre-register in this app so your details are ready; registration opens here soon and waitlist members hear first.' },
  { q: 'How big can a team be?', a: 'Up to 4 people. You can also come alone and find teammates here or at the start of the day.' },
  { q: 'Does our code have to be public?', a: 'Yes. Submit a public GitHub repository by code freeze at 16:30. Judges only score projects they can open, and you keep ownership of your code.' },
  { q: 'How are prizes paid?', a: 'In VND by bank transfer, or in goods. Never in crypto. Prizes over VND 20 million carry 10% personal income tax, which the payer withholds.' },
  { q: 'Who can take part?', a: 'Anyone who wants to build, including students and first-timers. Participants under 18 need a parent or guardian’s signed consent.' },
  { q: 'Is this a Solana Mobile event?', a: 'No. Dragon Connector is independent and is not run or endorsed by Solana Mobile.' },
  { q: 'Is it overnight?', a: 'No. It is a single day, from 08:00 to 20:00.' },
];
