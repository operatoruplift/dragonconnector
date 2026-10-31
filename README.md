# Dragon Connector app

**DA NANG / 001 · BUILD. SHIP. CONNECT.** An installable, gamified participant app for Dragon Connector, a proposed Solana Mobile and AI hackathon in Da Nang. Every step of the journey is a quest that earns XP: from the waitlist to registration, onboarding, check-in, finding teammates, messaging and submitting a project.

The event is in planning. Dates, the venue, funding and prizes are proposals, and registration is not open. The app says so wherever it matters. Its facts come from the proposal at [dragonconnector.vercel.app](https://dragonconnector.vercel.app) (source: `operatoruplift/da-nang-hackathon-proposal`).

## What is in it

**The journey** (Home shows it as a path, with the next step in gold):

1. **Waitlist:** name, email, role and track.
2. **Pre-registration:** five steps (account, builder profile, event details, agreements and review), validated as you go and saved as you type.
3. **Onboarding:** a first-run welcome and a coach-mark tour of the app. You can replay it from Home or Settings.
4. **Check-in:** a personal QR pass, plus self check-in with the venue code on event day.
5. **Teammates and co-founders:** builders ranked by how well they complement you, with the reasons. Filters, search, intros, team creation and invites.
6. **Messages:** organizer announcements, team chat, direct messages and the Dragon Guide. The Guide answers questions from the event data and keeps the caveats.
7. **Submission:** project details, links and confirmations. Drafts save as you type.

**Explore:** guides, docs (draft rules, code of conduct, privacy, FAQ), sponsors and the partner programme, the schedule for both proposed formats with saved sessions, quests and personal tasks, the requirements checklist, an illustrative venue map, and the planned prize pool with the judging rubric.

**Game layer:** 21 quests worth 1,400 XP, seven levels from Hatchling to Dragon, and ten badges. XP is never stored. It is always the sum of the quests completed, so it cannot drift.

## Honest by design

- **On this device only.** Everything people enter stays in the browser's local storage until real services are connected (see below). The screens say so, and so does the privacy doc.
- **Preview mode** (Settings) unlocks registration, check-in and submission on the device for demos. A Preview badge shows while it is on. The preview check-in code is `DRAGON-001`.
- **Sample profiles.** The teammates directory uses twelve fictional profiles, each labelled "Sample profile". Messages and invitations to them stay on the device and are not answered.
- **No sponsors, no prospects.** `SPONSORS` in `public/src/data/event.js` is empty. Add only organizations that have agreed in writing to be named. The app never lists the proposal's prospects.
- **Planned prizes.** The pool shows the proposal's planned allocations ($800, $1,500 or $3,000 by funding scenario) as planned, not funded.

The tests enforce these rules: no prospect names, no "apply now", no screen claiming registration is open while it is closed, every sample profile labelled, and all user input escaped.

## Run it

It is a static site with no build step and no dependencies.

```bash
npm start
```

Then open http://127.0.0.1:8428. Any static file server pointed at `public/` works. The service worker needs `localhost` or HTTPS.

```bash
npm test
```

The 27 tests cover the quest engine, the store, matching, validation, the Dragon Guide and HTML escaping. They also check that the schedules and prizes match the proposal (405 and 795 build minutes; $800, $1,500 and $3,000), that every in-app link leads somewhere, that the PWA manifest and icons are valid, and that every screen renders for a new and a busy builder.

## Project structure

- `public/index.html` is the page shell; `public/src/main.js` handles routing, the navigation, celebrations, install and offline.
- `public/src/views/` has one module per screen. Each exports `render(state, params, ctx)` plus named `actions`, `forms` and `inputs` that `main.js` wires up.
- `public/src/lib/` holds the logic, which runs without a browser: the store (`store.js`), the quests, levels and badges (`game.js`), matching (`match.js`), validation (`validate.js`), event time in ICT (`time.js`), gates (`gates.js`), the Dragon Guide (`guide.js`), and the escaping `html` template (`html.js`).
- `public/src/data/` holds the content: event facts (`event.js`), sample profiles (`people.js`), guides, docs, requirements and the map (`content.js`), and the starting conversations (`threads.js`).
- `public/styles/app.css` is the Dragon Connector Brand System v1.0: Obsidian, Ivory and Dragon Gold at about 70/20/10, with Oxanium, Space Grotesk and IBM Plex Mono, including Vietnamese subsets.
- `public/sw.js` is the service worker; `public/precache.js` is generated.

## Changing event facts

Edit `public/src/data/event.js`:

- **Dates and programme:** `FORMATS`.
- **Tracks, judging and prizes:** `TRACKS`, `JUDGING` and `PRIZES`.
- **FAQ:** `FAQS`.
- **Opening a step:** `GATES`. Set `registration.open` to `true` when registration opens.

Then run `npm run precache` and `npm test`. The content tests check the schedules still add up.

Some tests pin today's state on purpose: registration closed, every `INTEGRATIONS` value `null` and `SPONSORS` empty. Opening registration, connecting a service or naming a sponsor fails `npm test`, and so the Vercel build, until the tests that pin it change in the same commit: `tests/content.test.mjs` in every case, `tests/engine.test.mjs` for registration or a sponsor (the Dragon Guide's answers change), and `tests/views.test.mjs` for registration.

## Connecting real services

Settings live in `INTEGRATIONS` in `public/src/data/event.js`:

- **`waitlistEndpoint`:** an HTTPS URL that accepts a JSON POST of the entry, `{ name, email, role, track, joinedAt, sent }`, where `joinedAt` is a timestamp in milliseconds and `sent` is `false`. A 2xx response marks the entry as sent. Add its origin to `connect-src` in the `vercel.json` security policy. The waitlist copy and the privacy doc change automatically.
- **`registrationUrl`:** the official registration page. Once registration is open, the registration screen links to it.
- **`checkInCodeSha256`:** the SHA-256 hash of the venue code, so the code itself never appears in the public source. The app trims what people type, converts it to upper case and removes spaces before hashing, so hash the code in that form: `printf 'YOUR-CODE' | sha256sum`, then copy the hex digest.

Accounts, live messaging between builders, real teams and stored submissions need a backend with authentication. Supabase is a natural fit. The store (`lib/store.js`) is the place to sync from.

## PWA

The manifest has standard, maskable and Apple touch icons, shortcuts and install screenshots. The service worker caches every app file on install, so the app, including the check-in pass, opens offline. When a new version is deployed, a "Reload" prompt appears; nothing reloads under someone mid-form.

After changing anything in `public/`, regenerate the cache list. The tests fail if it is out of date.

```bash
npm run precache
```

To re-render the icons and screenshots, run this (it needs Playwright and Chromium):

```bash
npm run assets
```

## Deploying

The Vercel project `dragonconnectorapp` deploys `main` to https://dragonconnectorapp.vercel.app, a public test address until the app moves to its own domain. It serves `public/` as a static site; `vercel.json` runs the tests as the build step and sets a strict Content Security Policy.

## Credits

- **Fonts:** Oxanium, Space Grotesk and IBM Plex Mono, under the SIL Open Font License (`public/fonts/OFL-*.txt`).
- **QR codes:** [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase, MIT License, vendored unmodified (`public/src/vendor/`). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
