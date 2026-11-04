// Guides, docs, the requirements checklist and the venue map. Body blocks are plain data
// ({ p }, { h }, { list }, { links }) that the views escape and render.
import { EVENT, FAQS, FORMATS, INTEGRATIONS, JUDGING } from './event.js';

export const GUIDES = [
  {
    slug: 'first-steps',
    title: 'Your first steps',
    minutes: 2,
    summary: 'How the app works, from the waitlist to your demo.',
    body: [
      { p: `${EVENT.name} · ${EVENT.edition} is a free, one-day hackathon for mobile apps on Solana, on ${FORMATS.A.dateLabel} in Da Nang. This app turns every stage into a quest: each step you complete earns XP and moves you up a level.` },
      { h: 'The journey' },
      { list: ['Join the waitlist to show your interest.', 'Build your profile so teammates can find you.', 'Pre-register now, then complete registration when the official page opens.', 'Check in at the venue on event day.', 'Find teammates, message them and form a team.', 'Submit your project before code freeze.'] },
      { h: 'What is confirmed' },
      { p: `The date is ${FORMATS.A.dateLabel}. The venue is confirmed when registration opens, and prizes are announced as sponsors commit. ${EVENT.independence} The privacy doc explains where your details are kept.` },
    ],
  },
  {
    slug: 'solana-mobile',
    title: 'Building for the Consumer mobile track',
    minutes: 3,
    summary: 'Set up for mobile, connect a wallet and plan a demo that works on a phone.',
    body: [
      { p: 'The Consumer mobile track is for apps people open every day, with a clear user problem and a prototype you can demonstrate on a phone.' },
      { h: 'Get set up before the event' },
      { list: [
        'Read the Solana Mobile developer docs and choose your stack: native Android with Kotlin, React Native, or another supported framework.',
        'Use Mobile Wallet Adapter so your app can ask a wallet app on the phone to connect and sign. Test it on an Android device or emulator with a wallet installed.',
        'Build and demo on devnet unless your track rules say otherwise.',
        'Keep your repository public: judges only score projects they can open.',
      ] },
      { h: 'Good to know' },
      { list: [
        'A track sponsor may rename the track and set its challenge before registration opens.',
        'You do not need a Seeker phone. Any Android phone or emulator works.',
        `${EVENT.independence}`,
      ] },
      { links: [{ label: 'Solana Mobile developer docs', url: 'https://docs.solanamobile.com' }, { label: 'Solana developer docs', url: 'https://solana.com/docs' }] },
    ],
  },
  {
    slug: 'ai-web3',
    title: 'AI on mobile: ideas that ship',
    minutes: 2,
    summary: 'Scope an assistant or agent you can finish in a day, with a real action at its end.',
    body: [
      { p: 'The AI on mobile track is for assistants and agents on the phone that take real actions for the person holding it.' },
      { h: 'Scope it for the build time' },
      { list: [
        'Pick one user and one job to be done. A narrow workflow that works beats a broad one that does not.',
        'Make the action real: a payment, a booking, a message sent or a record on Solana, not just a chat reply.',
        'Plan a demo path that does not depend on network luck. Cache any model output the live demo needs.',
      ] },
      { h: 'Before you rely on a tool' },
      { list: [
        'API credits are offered only if a sponsor provides them. Bring your own keys and budget for usage.',
        'Check that you have the right to use your data. Judges may ask.',
      ] },
    ],
  },
  {
    slug: 'teams',
    title: 'Forming a great team',
    minutes: 2,
    summary: 'Find complementary skills and agree how you will work in the first half hour.',
    body: [
      { list: [
        'Teams have up to 4 people. Aim for complementary skills: someone to build the core, someone to shape the experience and someone to tell the story.',
        'In the first 30 minutes, agree on the idea, the roles and how you will make decisions.',
        'Write down what "done" means for the demo, then cut scope until it fits the build time.',
        'Be generous with first-timers. The First-time builders track exists for them.',
      ] },
      { p: 'Teammates ranks people whose skills complement yours. A match score is a starting point, not a verdict.' },
    ],
  },
  {
    slug: 'judging',
    title: 'How judging works',
    minutes: 2,
    summary: 'The 100-point criteria, the judging round after code freeze and the finalist demos.',
    body: [
      { p: 'Judges score each eligible project out of 100:' },
      { list: JUDGING.rubric.map((item) => `${item.points} points: ${item.label}`) },
      { p: `Code freezes at ${FORMATS.A.codeFreeze}. Judges then visit every team, and up to ${JUDGING.finalists} finalists go through to the demos at 18:00. Each finalist has a ${JUDGING.slotMinutes}-minute slot: ${JUDGING.slot.map((part) => `${part.minutes} minute${part.minutes > 1 ? 's' : ''} of ${part.label === 'Transition' ? 'handover' : part.label === 'Q&A' ? 'questions' : 'demo'}`).join(', ')}.` },
      { p: JUDGING.status },
      { p: 'A submission does not guarantee a stage slot.' },
    ],
  },
  {
    slug: 'demo',
    title: 'Your three-minute demo',
    minutes: 2,
    summary: 'A simple structure and the habits that keep a live demo safe.',
    body: [
      { list: ['0:00–0:30: the problem, in one sentence, for one user.', '0:30–2:30: the product working. Live beats slides.', '2:30–3:00: what comes next, and what you need.'] },
      { h: 'Make it robust' },
      { list: ['Rehearse on the device you will present with.', 'Record a backup video in case the network fails.', 'Have your repository link and a one-line description ready for the judges.'] },
    ],
  },
  {
    slug: 'submitting',
    title: 'Submitting your project',
    minutes: 2,
    summary: 'What to prepare and when code freeze is.',
    body: [
      { p: `Submit before code freeze at ${FORMATS.A.codeFreeze} on ${FORMATS.A.dateLabel} (${EVENT.timezoneLabel}). Late submissions are not judged.` },
      { list: ['Project name and a one-line tagline', 'Your track', 'A clear description: the problem, who it is for and what works today', 'A public GitHub repository link, with the libraries and templates you used listed in the README', 'A demo video link, if you have one', 'Your team members (up to 4)'] },
      { p: 'You can draft your submission in the app at any time. Final submission opens on event day.' },
    ],
  },
];

export const DOCS = [
  {
    slug: 'rules',
    title: 'Official rules',
    summary: 'The short version. The full official rules are on the website.',
    body: [
      { p: 'These are the main points of the official rules. The full rules on the website take precedence.' },
      { list: [
        'Entry is free and open to everyone. Participants under 18 need a parent or guardian’s signed consent before check-in.',
        `Teams have 1 to ${EVENT.teamMax} members, and a person can be in one team only.`,
        'Build on the day, from 09:30. Open-source libraries, templates and AI tools are fine if your README lists them.',
        `Submit before code freeze at ${FORMATS.A.codeFreeze} with a public GitHub repository and a demo link. Late or private submissions are not judged.`,
        `Judges score on four criteria worth 25 points each; up to ${JUDGING.finalists} finalists demo on stage.`,
        'Every prize is paid in VND or goods, never in crypto. Prizes over VND 20 million carry 10% personal income tax, which the payer withholds.',
        'You own what you build. The organizer and sponsors may show your project name, description, screenshots, demo and repository link to report on the event.',
        'Everyone follows the code of conduct.',
      ] },
      { links: [{ label: 'Read the official rules', url: EVENT.rulesUrl }] },
    ],
  },
  {
    slug: 'conduct',
    title: 'Code of conduct',
    summary: 'How everyone at Dragon Connector treats each other.',
    body: [
      { p: 'Dragon Connector is for everyone who wants to build. We expect participants, mentors, judges, partners and organizers to help keep it welcoming.' },
      { list: [
        'Be respectful and inclusive. Harassment and discrimination of any kind are not tolerated.',
        'Ask before you photograph or record someone, and respect a no.',
        'Look after each other and the venue.',
        'Raise concerns with any organizer or crew member, at the check-in desk, or by messaging the organizers privately in this app. Reports are handled quickly and discreetly.',
        'If you are in danger, call 113 for the police or 115 for an ambulance first.',
        'Organizers may ask anyone who breaks this code to leave the event.',
      ] },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy and your data',
    summary: 'What this app stores and where.',
    body: INTEGRATIONS.supabase ? [
      { p: 'Dragon Connector keeps what you enter in two places: on this device, so the app works offline, and in your Dragon Connector account, so the organizers can prepare the event and other builders can reach you.' },
      { h: 'Your account' },
      { p: `Your account is anonymous: there is no password or login email. It lives in this browser and is created the first time you save something, message someone or open Teammates. If you clear this browser's data, you lose access to it. Account data is stored by Supabase, hosted in ${INTEGRATIONS.supabase.region}.` },
      { h: 'What goes to your account' },
      { list: [
        'Your waitlist entry (name, email, role and track), when you join the waitlist.',
        'Your builder profile, pre-registration, pass code and project submission.',
        'Your check-in time, and the messages and teams you take part in.',
      ] },
      { h: 'Who can see it' },
      { list: [
        'The organizers can see everything in the event database, including the waitlist, pre-registrations, submissions, check-ins and messages.',
        'Other builders see your profile only if you choose "Show my profile to other builders", or once you message them or join the same team.',
        'Messages are visible to the people in that conversation and to the organizers.',
        'Messages to sample profiles and the Dragon Guide, your tasks, saved sessions and XP stay on this device.',
      ] },
      { h: 'Deleting your data' },
      { p: 'Delete my data in Settings removes your profile, pre-registration, submission, check-in, the messages you sent, your team memberships and your waitlist entry, disbands teams you created, deletes the anonymous account itself and clears this device. A waitlist entry sent before you had an account cannot be traced back to you, so ask the organizers to remove it.' },
      { h: 'Visit counts' },
      { p: 'The app counts page visits with Vercel Web Analytics, which uses no cookies and does not identify you.' },
      { p: 'When registration opens, its own privacy notice will explain what is collected and why. Event reporting shares aggregate numbers only. Identifiable attendance records stay restricted.' },
    ] : [
      { p: 'This app keeps everything you enter on this device only, in your browser\'s storage: your profile, waitlist entry, pre-registration, messages, tasks and submission. Nothing is sent to the organizers or anyone else.' },
      { p: 'Clearing your browser data, or choosing Reset in Settings, deletes it.' },
      { p: 'When registration opens, its own privacy notice will explain what is collected and why.' },
      { p: 'Event reporting shares aggregate numbers only. Identifiable attendance records stay restricted.' },
    ],
  },
  { slug: 'faq', title: 'Frequently asked questions', summary: 'Straight answers about the event.', faqs: FAQS },
  {
    slug: 'about',
    title: `About ${EVENT.name}`,
    summary: 'The name, the organizer and who runs the event.',
    body: [
      { p: 'Da Nang\'s Dragon Bridge joins the two banks of the Han River. Dragon Connector has a similar purpose: connecting builders, ideas, partners and community. "001" marks the first edition.' },
      { p: `Organizer: ${EVENT.organizer}.` },
      { p: EVENT.independence },
      { links: [{ label: 'The event website', url: EVENT.siteUrl }, { label: 'Official rules', url: EVENT.rulesUrl }] },
      { p: `Follow ${EVENT.handle} for track reveals, sponsors and the venue.` },
      { links: EVENT.social.map((item) => ({ label: item.name, url: item.url })) },
    ],
  },
];

export const REQUIREMENTS = [
  { group: 'Bring', items: [
    { id: 'laptop', label: 'Laptop and charger' },
    { id: 'phone', label: 'Your phone (an Android phone helps for the Consumer mobile track)' },
    { id: 'power', label: 'An extension lead, if you have one' },
    { id: 'water', label: 'A refillable water bottle' },
    { id: 'headphones', label: 'Headphones' },
  ] },
  { group: 'Accounts', items: [
    { id: 'github', label: 'A GitHub account' },
    { id: 'wallet', label: 'A Solana wallet set up for devnet' },
    { id: 'keys', label: 'Keys for any AI tools you plan to use (credits are not guaranteed)' },
  ] },
  { group: 'Set-up', items: [
    { id: 'env', label: 'Your development environment, installed and tested (Android Studio or React Native for mobile, Rust and Anchor for programs, Python or Node for AI)' },
    { id: 'guides', label: 'Read the guide for your track' },
  ] },
];

export const SUBMISSION_REQUIREMENTS = [
  'A public GitHub repository link the judges can open',
  'A working demo of your prototype',
  'Submission before code freeze at 16:30',
  'Finalists present at 18:00 in a six-minute slot: 3-minute demo, 2-minute Q&A, 1-minute handover',
];

// An illustrative floor plan built from the stations in the event's crew plan. The real layout
// depends on the confirmed room.
export const MAP_ZONES = [
  { id: 'checkin', label: 'Check-in & wayfinding', lines: ['Check-in'], detail: 'Show your check-in pass here. Ask for directions and help.', x: 20, y: 300, w: 150, h: 70 },
  { id: 'stage', label: 'Main stage', lines: ['Main stage'], detail: 'Opening, finalist demos and awards. AV and stage crew are based here.', x: 200, y: 20, w: 400, h: 90 },
  { id: 'floor', label: 'Build floor', lines: ['Build floor'], detail: 'Team tables. Wi-Fi, power and AV are still to be sized and tested.', x: 200, y: 140, w: 400, h: 230 },
  { id: 'tech', label: 'Technical desk', lines: ['Tech', 'desk'], detail: 'Help with the network, power and demo displays.', x: 20, y: 20, w: 150, h: 120 },
  { id: 'food', label: 'Food & hydration', lines: ['Food &', 'water'], detail: 'Meals within the agreed scope, and water throughout the day.', x: 630, y: 20, w: 150, h: 170 },
  { id: 'media', label: 'Media & judging', lines: ['Media &', 'judging'], detail: 'Consented media capture and judge support.', x: 630, y: 220, w: 150, h: 150 },
];
