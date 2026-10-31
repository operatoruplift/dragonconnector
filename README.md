# Dragon Connector app

**DA NANG / 001 · BUILD. SHIP. CONNECT.** An installable, gamified participant app for Dragon Connector, a proposed Solana Mobile and AI hackathon in Da Nang. Every step of the journey is a quest that earns XP: from the waitlist to registration, onboarding, check-in, finding teammates, messaging and submitting a project. Live services run on Supabase: the waitlist, accounts, builder profiles, messages, teams, submissions and check-in.

The event is in planning. Dates, the venue, funding and prizes are proposals, and registration is not open. The app says so wherever it matters. Its facts come from the proposal at [dragonconnector.vercel.app](https://dragonconnector.vercel.app) (source: `operatoruplift/da-nang-hackathon-proposal`).

## What is in it

**The journey** (Home shows it as a path, with the next step in gold):

1. **Waitlist:** name, email, role and track.
2. **Pre-registration:** five steps (account, builder profile, event details, agreements and review), validated as you go and saved as you type.
3. **Onboarding:** a first-run welcome and a coach-mark tour of the app. You can replay it from Home or Settings.
4. **Check-in:** a personal QR pass, plus self check-in with the venue code on event day.
5. **Teammates and co-founders:** real builders who chose to show their profile, ranked by how well they complement you, with the reasons. Filters, search, intros, live teams and invitations.
6. **Messages:** organizer announcements, live direct messages, team chat, a private channel to the organizers, and the Dragon Guide. The Guide answers questions from the event data and keeps the caveats.
7. **Submission:** project details, links and confirmations. Drafts save as you type.

**Explore:** guides, docs (draft rules, code of conduct, privacy, FAQ), sponsors and the partner programme, the schedule for both proposed formats with saved sessions, quests and personal tasks, the requirements checklist, an illustrative venue map, and the planned prize pool with the judging rubric.

**Game layer:** 21 quests worth 1,400 XP, seven levels from Hatchling to Dragon, and ten badges. XP is never stored. It is always the sum of the quests completed, so it cannot drift.

## Honest by design

- **Plain about data.** Builders get an anonymous account (no password, no login email) the first time they save something, message someone or open Teammates. Browsing creates nothing. What they enter is also kept on the device, so the app works offline and syncs later. Each form says where its data goes, and the privacy doc lists who can see what. **Delete my data** in Settings removes the server copy and clears the device.
- **Consent for older data.** Details saved before accounts were connected were promised to stay on the device. They stay there until the builder chooses **Connect my details**.
- **Profiles are hidden by default.** Other builders see a profile only if its owner ticks "Show my profile to other builders", or once they message each other or join the same team.
- **Preview mode** (Settings) unlocks registration, check-in and submission on the device for demos. A Preview badge shows while it is on. The preview check-in code is `DRAGON-001`. Preview check-ins and submissions are never sent to the organizers.
- **Sample profiles.** Twelve fictional profiles stay below the real builders, each labelled "Sample profile", so matching can be tried before many people have joined. Messages and invitations to them stay on the device and are not answered.
- **No sponsors, no prospects.** `SPONSORS` in `public/src/data/event.js` is empty. Add only organizations that have agreed in writing to be named. The app never lists the proposal's prospects.
- **Planned prizes.** The pool shows the proposal's planned allocations ($800, $1,500 or $3,000 by funding scenario) as planned, not funded.

The tests enforce these rules: no prospect names, no "apply now", no screen claiming registration is open while it is closed, every sample profile labelled, and all user input escaped.

## Run it

It is a static site with no build step and no dependencies. It talks to the live Supabase project from any address, so a local copy uses real data.

```bash
npm start
```

Then open http://127.0.0.1:8428. Any static file server pointed at `public/` works. The service worker needs `localhost` or HTTPS.

```bash
npm test
```

The tests cover the quest engine, the store, matching, validation, the Dragon Guide and HTML escaping. They also check that:

- the schedules and prizes match the proposal (405 and 795 build minutes; $800, $1,500 and $3,000);
- every in-app link leads somewhere, and the PWA manifest and icons are valid;
- every screen renders for a new and a busy builder, in every connection state, without turning anything another builder wrote into markup.

The live services are tested against an in-memory Supabase (`tests/fake-supabase.mjs`): accounts, syncing, offline and reconnecting, messages, teams, check-in and deleting data. Static checks make sure every table has row-level security, every function pins its search path, and every table, column, function and argument the app uses exists in `supabase/migrations`. The app ships only the public anon key, and the security policy allows only this project.

## Project structure

- `public/index.html` is the page shell; `public/src/main.js` handles routing, the navigation, celebrations, install and offline.
- `public/src/views/` has one module per screen. Each exports `render(state, params, ctx)` plus named `actions`, `forms` and `inputs` that `main.js` wires up.
- `public/src/lib/` holds the logic, which runs without a browser: the store (`store.js`), live services (`backend.js`), the quests, levels and badges (`game.js`), matching (`match.js`), validation (`validate.js`), event time in ICT (`time.js`), gates (`gates.js`), the Dragon Guide (`guide.js`), and the escaping `html` template (`html.js`).
- `public/src/data/` holds the content: event facts (`event.js`), sample profiles (`people.js`), guides, docs, requirements and the map (`content.js`), and the starting conversations (`threads.js`).
- `public/styles/app.css` is the Dragon Connector Brand System v1.0: Obsidian, Ivory and Dragon Gold at about 70/20/10, with Oxanium, Space Grotesk and IBM Plex Mono, including Vietnamese subsets.
- `public/sw.js` is the service worker; `public/precache.js` is generated.
- `supabase/migrations/` is the database: tables, row-level security policies and functions, in the order they were applied.

## Changing event facts

Edit `public/src/data/event.js`:

- **Dates and programme:** `FORMATS`.
- **Tracks, judging and prizes:** `TRACKS`, `JUDGING` and `PRIZES`.
- **FAQ:** `FAQS`.
- **Opening a step:** the organizers' switches in the database decide (see below). `GATES` holds the fallback the app uses before it has heard from the server.

Run `npm test` afterwards. The content tests check the schedules still add up.

## Live services (Supabase)

The project is `ondistgfpmodesjrharp` (https://ondistgfpmodesjrharp.supabase.co), hosted in the United States (Ohio). `INTEGRATIONS.supabase` in `public/src/data/event.js` holds its URL and anon key. The anon key is public by design: row-level security decides what it can reach. Never put a service_role or secret key in the app.

Builders use anonymous accounts, so an account is a browser. The device keeps the source of truth for what a builder types (profile, pre-registration, submission and waitlist entry) and syncs a copy. The server is the source of truth for check-in, conversations and teams. The client library (`public/src/vendor/supabase.js`, supabase-js 2.118.0) loads after the first render, so the app never waits for it.

### One-time settings in the Supabase dashboard

- **Allow anonymous sign-ins:** Authentication → Sign In / Providers. Until this is on, the waitlist still works but accounts cannot be created. The app says "Accounts are not switched on yet" and keeps everything else on the device.
- **Rate limit for anonymous sign-ins:** Authentication → Rate Limits. Raise it before event day. The default allows about 30 new accounts per hour from one IP address, and a venue's Wi-Fi often shares one.
- Consider CAPTCHA protection (Authentication → Attack Protection) if the app is promoted widely.

### Running the event from the dashboard

Organizers use the Table Editor or the SQL editor. Both bypass row-level security.

- **Waitlist, pre-registrations, submissions, check-ins:** the `waitlist`, `registrations`, `submissions` and `check_ins` tables. A pass code in `registrations.pass_code` matches the QR code a builder shows at the desk (`DC001:` followed by the pass code).
- **Post an announcement.** It reaches open apps at once. A future `published_at` schedules it.

  ```sql
  insert into announcements (body) values ('Doors open at 08:00.');
  ```

- **Reply to a builder who asked the organizers.** Find the conversation in `conversations` (kind `organizers`, `pair_key` is `organizers:` followed by their account id). Set `from_organizers`, or the app shows the reply as from a former member.

  ```sql
  insert into messages (conversation_id, from_organizers, body) values ('<conversation id>', true, 'Thanks! The venue is not confirmed yet.');
  ```

- **Open a step:**

  ```sql
  update event_settings set registration_open = true;  -- also check_in_open, submissions_open
  ```

- **Set the venue code for self check-in.** It is never readable from the app. Each account gets ten tries per ten minutes.

  ```sql
  update event_secrets set check_in_code = 'GOLD-7';
  ```

- **Check someone in at the desk:**

  ```sql
  insert into check_ins (user_id) select user_id from registrations where pass_code = 'DC-7KQ4-M2XP';
  ```

### Changing the database

Add a new file to `supabase/migrations/`; never edit one that has been applied. Apply it to the project, then run `npm test`. The database tests check that every table has row-level security and that every table, column, function and argument the app uses exists.

The file names match the versions in the project's migration history. That history also lists six unnamed migrations from September 2025, from an earlier prototype in the same project. The first migration here removes what they created.

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

The Vercel project `dragonconnectorapp` deploys `main` to https://dragonconnectorapp.vercel.app, a public test address until the app moves to its own domain. It serves `public/` as a static site; `vercel.json` runs the tests as the build step and sets a strict Content Security Policy that allows connections only to this site and the Supabase project.

## Credits

- **Fonts:** Oxanium, Space Grotesk and IBM Plex Mono, under the SIL Open Font License (`public/fonts/OFL-*.txt`).
- **QR codes:** [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase, MIT License, vendored unmodified (`public/src/vendor/`). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
- **Supabase client:** [supabase-js](https://github.com/supabase/supabase-js) 2.118.0, MIT License, the published UMD build vendored unmodified (`public/src/vendor/`).
