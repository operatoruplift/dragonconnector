<div align="center">

<img src="docs/readme/banner.png" alt="Dragon Connector, the participant app for Da Nang / 001, an installable PWA. Every step is a quest. An installable companion for a proposed Solana Mobile and AI hackathon in Da Nang. It works offline and syncs to an anonymous account when it can. 21 quests worth 1,400 XP, a QR check-in pass, live messages and teams, works offline, at dragonconnectorapp.vercel.app. Status: event in planning. Beside the copy, three phones running the app: the quest log at 390 of 1,400 XP, the home screen at level 3, Builder, and Messages, with the organizers' announcements and the Dragon Guide." width="100%">

<br><br>

<a href="https://dragonconnectorapp.vercel.app"><img src="https://img.shields.io/badge/Open_the_app-D4AF37?style=for-the-badge" alt="Open the app" height="36"></a>&nbsp;&nbsp;
<a href="https://dragonconnectorapp.vercel.app/#/settings"><img src="https://img.shields.io/badge/Try_Preview_mode-242424?style=for-the-badge" alt="Try Preview mode" height="36"></a>&nbsp;&nbsp;
<a href="https://dragonconnector.vercel.app"><img src="https://img.shields.io/badge/Read_the_proposal-3A3A36?style=for-the-badge" alt="Read the event proposal" height="36"></a>

<br><br>

<a href="https://dragonconnectorapp.vercel.app"><img src="https://img.shields.io/website?url=https%3A%2F%2Fdragonconnectorapp.vercel.app&label=app&up_message=live&down_message=down&up_color=34d399&labelColor=0B0B0B&style=flat-square" alt="App status"></a>
<img src="https://img.shields.io/badge/event-in_planning-D4AF37?style=flat-square&labelColor=0B0B0B" alt="Event: in planning">
<img src="https://img.shields.io/badge/PWA-installable%2C_works_offline-EBC76E?style=flat-square&labelColor=0B0B0B" alt="PWA: installable, works offline">
<img src="https://img.shields.io/badge/backend-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white&labelColor=0B0B0B" alt="Backend: Supabase">
<img src="https://img.shields.io/badge/build-none%2C_no_npm_dependencies-9A7624?style=flat-square&labelColor=0B0B0B" alt="No build step and no npm dependencies">
<img src="https://img.shields.io/badge/tests-51_node%3Atest-339933?style=flat-square&logo=nodedotjs&logoColor=white&labelColor=0B0B0B" alt="51 node:test tests">
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-6F6163?style=flat-square&labelColor=0B0B0B" alt="License: MIT"></a>

<h3>Every step from the waitlist to your demo is a quest.</h3>

<b>Join</b> &nbsp;→&nbsp; <b>Pre-register</b> &nbsp;→&nbsp; <b>Check in</b> &nbsp;→&nbsp; <b>Team up</b> &nbsp;→&nbsp; <b>Submit</b>

<br>

<a href="#how-it-works">How it works</a> &nbsp;·&nbsp;
<a href="#honest-by-design">Honest by design</a> &nbsp;·&nbsp;
<a href="#status">Status</a> &nbsp;·&nbsp;
<a href="#run-it-locally">Run it locally</a> &nbsp;·&nbsp;
<a href="#live-services">Live services</a> &nbsp;·&nbsp;
<a href="#pwa">PWA</a> &nbsp;·&nbsp;
<a href="#deploy">Deploy</a>

</div>

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/screens-dark.png">
  <img src="docs/readme/screens-light.png" alt="Four phone screens of the app with a demo builder, Alex Tran. 01, follow the path: seven steps from the waitlist to your demo, with the next one in gold; the waitlist, pre-registration and tour are done, and check-in opens on event day. 02, pre-register: five steps, checked as you go, saved on your device and to your account; the saved pre-registration lists Alex's details and says they are saved on this device and to the Dragon Connector account. 03, carry your pass: a QR pass that opens offline, with the code DC-7KQ4-M2XP and a note that check-in opens at the venue on event day; self check-in opens on event day. 04, find your crew: builders who chose to be found, ranked with the reasons, and samples are labelled; no builders have shown their profile yet, and Aiko S., a product designer, matches at 72 and Khoa N., a Solana developer, at 69, both labelled as sample profiles." width="100%">
</picture>

<p align="center"><sub>Captured from a local build on 31 October 2026 with the demo builder from <code>scripts/render-assets.cjs</code>, connected to the in-memory Supabase from <code>tests/fake-supabase.mjs</code>. Nothing was sent to the live project.</sub></p>

**This is the participant app for Dragon Connector · Da Nang / 001, a proposed Solana Mobile and AI hackathon in Da Nang, Vietnam: an installable, gamified web app that works offline.** Every step of the journey is a quest that earns XP, from the waitlist to registration, onboarding, check-in, finding teammates, messaging and submitting a project. Live services run on Supabase: the waitlist, accounts, builder profiles, messages, teams, submissions and check-in. The event is in planning. Dates, the venue, funding and prizes are proposals, and registration is not open. The app says so wherever it matters, and every form says where its data goes.

Its facts come from the proposal at [dragonconnector.vercel.app](https://dragonconnector.vercel.app) (source: `operatoruplift/da-nang-hackathon-proposal`, a private repository), as revised on 29 October 2026, and it wears the event's identity, Dragon Connector Brand System v1.0, with the edition line **DA NANG / 001** and the tagline **BUILD. SHIP. CONNECT.** Built by Matt ([RVAClassic](https://x.com/rvaclassic), [Operator Uplift](https://operatoruplift.com)), Lead Executive Producer and Organizer of the proposed event, on 30 October 2026, and connected to Supabase on 31 October.

<br>

## How it works

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/flow-dark.png">
  <img src="docs/readme/flow-light.png" alt="Builder, the app, Supabase and the organizers. The builder plays the journey: opens the app in a browser or installs it, completes quests from the waitlist to submission, and shows a QR pass at check-in. The app runs on the device: static files with no build step and no npm dependencies, a local copy so it works offline, and event facts copied in from the proposal. Supabase holds the live data: anonymous accounts with no password and no email, row-level security on every table, and check-in, messages and teams. The organizers run the event: they work in the Supabase dashboard, post announcements, answer builders, and open registration, check-in and submissions. Arrows: quests, forms and messages go from the builder to the app; the app syncs with and reads from Supabase; the organizers post and open steps in Supabase. A dashed loop from the app back to the builder: every completed quest earns XP, levels and badges." width="100%">
</picture>

<table>
  <tr valign="top">
    <td width="33%"><b>XP cannot drift</b><br><sub>XP is never stored. It is always the sum of the quests completed, and a quest stays complete once earned. 21 quests worth 1,400 XP lead through seven levels, from Hatchling to Dragon, and ten badges.</sub></td>
    <td width="33%"><b>Matches show their reasons</b><br><sub>Teammates ranks the builders who chose to show their profile by how well they complement you: different roles, shared tracks, new skills and matching goals. Every card lists the top reasons behind its score, and labelled sample profiles sit below the real builders.</sub></td>
    <td width="33%"><b>A guide that cannot invent</b><br><sub>The Dragon Guide answers from the event data with keyword matching, so it can only repeat what the app already knows, caveats included. Five suggested questions start the conversation.</sub></td>
  </tr>
</table>

Home shows the journey as a path, with the next step in gold. Each step is a quest:

<table>
  <tr>
    <th width="22%" align="left">Step</th>
    <th width="66%" align="left">What you do</th>
    <th width="12%" align="left">XP</th>
  </tr>
  <tr valign="top">
    <td><b>1. Waitlist</b></td>
    <td>Name, email, role and track.</td>
    <td>+50</td>
  </tr>
  <tr valign="top">
    <td><b>2. Pre-registration</b></td>
    <td>Five steps (account, builder profile, event details, agreements and review), validated as you go and saved as you type.</td>
    <td>+150</td>
  </tr>
  <tr valign="top">
    <td><b>3. Onboarding</b></td>
    <td>A first-run welcome and a coach-mark tour of the app. You can replay it from Home or Settings.</td>
    <td>+50</td>
  </tr>
  <tr valign="top">
    <td><b>4. Check-in</b></td>
    <td>A personal QR pass, plus self check-in with the venue code on event day.</td>
    <td>+200</td>
  </tr>
  <tr valign="top">
    <td><b>5. Teammates and co-founders</b></td>
    <td>Real builders who chose to show their profile, ranked by how well they complement you, with the reasons. Filters, search, intros, live teams and invitations.</td>
    <td>+100</td>
  </tr>
  <tr valign="top">
    <td><b>6. Messages</b></td>
    <td>Organizer announcements, live direct messages, team chat, a private channel to the organizers, and the Dragon Guide. The Guide answers questions from the event data and keeps the caveats.</td>
    <td>+75</td>
  </tr>
  <tr valign="top">
    <td><b>7. Submission</b></td>
    <td>Project details, links and confirmations. Drafts save as you type.</td>
    <td>+250</td>
  </tr>
</table>

The other 14 quests reward the rest of the app, such as building your profile, asking the Guide a question or reading every guide. **Explore** holds guides, docs (draft rules, code of conduct, privacy, FAQ), sponsors and the partner programme, the schedule for both proposed formats with saved sessions, quests and personal tasks, the requirements checklist, an illustrative venue map, and the planned prize pool with the judging rubric.

<p align="center"><sub>Static HTML · CSS · JavaScript modules with no framework and no build step · Supabase (Postgres with row-level security, anonymous sign-ins, realtime) through supabase-js 2.118.0, vendored · local storage · service worker and web app manifest · qrcode-generator 2.0.4, vendored · Oxanium, Space Grotesk and IBM Plex Mono, self-hosted, the last two with Vietnamese subsets · node:test · Vercel</sub></p>

<br>

## Honest by design

<table>
  <tr>
    <th width="26%" align="left">Rule</th>
    <th width="74%" align="left">What the app does</th>
  </tr>
  <tr valign="top">
    <td><b>Plain about data</b></td>
    <td>Builders get an anonymous account (no password, no login email) the first time they save something, message someone or open Teammates. Browsing creates nothing. What they enter is also kept on the device, so the app works offline and syncs later. Each form says where its data goes, and the privacy doc lists who can see what. <b>Delete my data</b> in Settings removes the server copy, deletes the anonymous account itself and clears the device.</td>
  </tr>
  <tr valign="top">
    <td><b>Consent for older data</b></td>
    <td>Details saved before accounts were connected were promised to stay on the device. They stay there until the builder chooses <b>Connect my details</b>.</td>
  </tr>
  <tr valign="top">
    <td><b>Profiles hidden by default</b></td>
    <td>Other builders see a profile only if its owner ticks "Show my profile to other builders", or once they message each other or join the same team.</td>
  </tr>
  <tr valign="top">
    <td><b>Preview mode</b></td>
    <td>Settings unlocks registration, check-in and submission on the device for demos. A Preview badge shows while it is on. The preview check-in code is <code>DRAGON-001</code>. Preview check-ins and submissions are never sent to the organizers.</td>
  </tr>
  <tr valign="top">
    <td><b>Sample profiles</b></td>
    <td>Twelve fictional profiles stay below the real builders, each labelled "Sample profile", so matching can be tried before many people have joined. Messages and invitations to them stay on the device and are not answered.</td>
  </tr>
  <tr valign="top">
    <td><b>No sponsors, no prospects</b></td>
    <td><code>SPONSORS</code> in <a href="public/src/data/event.js"><code>public/src/data/event.js</code></a> is empty. Add only organizations that have agreed in writing to be named. The app never lists the proposal's prospects.</td>
  </tr>
  <tr valign="top">
    <td><b>Planned prizes</b></td>
    <td>The pool shows the proposal's planned allocations ($800, $1,500 or $3,000 by funding scenario) as planned, not funded.</td>
  </tr>
</table>

The tests enforce these rules: no prospect names, no "apply now", no screen claiming registration is open while it is closed, every sample profile labelled, and all user input escaped.

<br>

## Status

<table>
  <tr valign="top">
    <td width="17%" align="center"><img src="https://img.shields.io/badge/LIVE-34d399?style=for-the-badge" alt="Live"></td>
    <td>The app at <a href="https://dragonconnectorapp.vercel.app">dragonconnectorapp.vercel.app</a>, a public test address until it moves to its own domain. The Vercel project <code>dragonconnectorapp</code> deploys <code>main</code>, with the tests as the build step.</td>
    <td width="22%"><a href="#deploy">Deploy</a></td>
  </tr>
  <tr valign="top">
    <td align="center"><img src="https://img.shields.io/badge/LIVE-34d399?style=for-the-badge" alt="Live"></td>
    <td>The live services: the waitlist, anonymous accounts, builder profiles, messages, teams, submissions and check-in, in the Supabase project <code>ondistgfpmodesjrharp</code>, hosted in the United States (Ohio), behind row-level security. Accounts need anonymous sign-ins switched on in the Supabase dashboard. Until they are, the app says "Accounts are not switched on yet", the waitlist still works, and everything else stays on the device.</td>
    <td><a href="#live-services">Live services</a></td>
  </tr>
  <tr valign="top">
    <td align="center"><img src="https://img.shields.io/badge/PROPOSAL-D4AF37?style=for-the-badge" alt="Proposal"></td>
    <td>The event itself. Dragon Connector · Da Nang / 001 is proposed for Sunday 13 December 2026 (one day) or Saturday 12 and Sunday 13 December 2026 (two daytime sessions) at Swinburne University Vietnam, a proposed venue whose booking is not confirmed. Dates, the venue, funding and prizes are proposals.</td>
    <td><a href="https://dragonconnector.vercel.app">The proposal</a></td>
  </tr>
  <tr valign="top">
    <td align="center"><img src="https://img.shields.io/badge/CLOSED-9A7624?style=for-the-badge" alt="Closed"></td>
    <td>Registration, check-in and submission. Registration is not open, and check-in and submissions open on event day. The organizers open each one with a switch in the database. Until then, Preview mode unlocks all three on one device behind a Preview badge, and nothing done in Preview reaches the organizers.</td>
    <td><a href="#honest-by-design">Honest by design</a></td>
  </tr>
  <tr valign="top">
    <td align="center"><img src="https://img.shields.io/badge/PLANNED-6F6163?style=for-the-badge" alt="Planned"></td>
    <td>Its own domain. Until it moves, the app stays at the test address above, and the page asks search engines not to index it.</td>
    <td><a href="#deploy">Deploy</a></td>
  </tr>
</table>

<br>

## Run it locally

<table>
  <tr valign="top">
    <td width="33%"><b>Prerequisites</b><br><sub>Node 20 or newer for the tests, and Python 3 for <code>npm start</code> (or any static file server pointed at <code>public/</code>). There are no dependencies to install.</sub></td>
    <td width="33%"><b>Read first</b><br><sub><a href="#honest-by-design">Honest by design</a> before changing any wording, and <a href="#live-services">Live services</a> before touching data: a local copy talks to the live project.</sub></td>
    <td width="33%"><b>What the checks prove</b><br><sub>51 <code>node:test</code> cases: the quest engine, matching, validation, the Guide and escaping, the proposal's schedules and prizes, every link and screen, the PWA files, and the live services against an in-memory Supabase.</sub></td>
  </tr>
</table>

> **A local copy uses real data.** The app talks to the live Supabase project from any address. Saving something, messaging someone or opening Teammates on `localhost` creates a real anonymous account, and what you save lands in the real tables, so test with care and clear up with **Delete my data** in Settings.

### 1. Serve the app

```bash
npm start   # Python serves public/ at http://127.0.0.1:8428
```

It is a static site with no build step and no dependencies, so after `npm start` you open http://127.0.0.1:8428. Any static file server pointed at `public/` works. The service worker needs `localhost` or HTTPS. To try the closed steps, open Settings and turn on Preview mode; the check-in code is then `DRAGON-001`.

### 2. Run the tests

```bash
npm test    # node --test tests/*.test.mjs, the same command Vercel runs as its build step
```

The tests cover the quest engine, the store, matching, validation, the Dragon Guide and HTML escaping. They also check that:

- the schedules and prizes match the proposal (405 and 795 build minutes; $800, $1,500 and $3,000);
- every in-app link leads somewhere, and the PWA manifest and icons are valid;
- every screen renders for a new and a busy builder, in every connection state, without turning anything another builder wrote into markup.

The live services are tested against an in-memory Supabase ([`tests/fake-supabase.mjs`](tests/fake-supabase.mjs)): accounts, syncing, offline and reconnecting, messages, teams, check-in and deleting data. Static checks make sure every table has row-level security, every function pins its search path, and every table, column, function and argument the app uses exists in [`supabase/migrations`](supabase/migrations). The app ships only the public anon key, and the security policy allows only this project.

<br>

## Configure the event

### Change event facts

Edit [`public/src/data/event.js`](public/src/data/event.js):

- **Dates and programme:** `FORMATS`.
- **Tracks, judging and prizes:** `TRACKS`, `JUDGING` and `PRIZES`.
- **FAQ:** `FAQS`.
- **Opening a step:** the organizers' switches in the database decide (see [Live services](#live-services), under "Run the event from the dashboard"). `GATES` holds the fallback the app uses before it has heard from the server.
- **An external registration page:** `INTEGRATIONS.registrationUrl`, if registration moves elsewhere. Once registration is open, the registration screen links to it.

Then run `npm run precache` and `npm test`. The content tests check the schedules still add up.

Some tests pin today's state on purpose: the fallback `GATES.registration.open` is `false`, `INTEGRATIONS.registrationUrl` is `null` and `SPONSORS` is empty. Changing one fails `npm test`, and so the Vercel build, until the tests that pin it change in the same commit: `tests/content.test.mjs` in every case, and `tests/engine.test.mjs` when the Dragon Guide's answers about registration or sponsors change. Opening registration in the database needs no code change.

<br>

## Live services

The project is `ondistgfpmodesjrharp` (https://ondistgfpmodesjrharp.supabase.co), hosted in the United States (Ohio). `INTEGRATIONS.supabase` in [`public/src/data/event.js`](public/src/data/event.js) holds its URL and anon key. The anon key is public by design: row-level security decides what it can reach. Never put a service_role or secret key in the app; a test fails if one appears. To use another project, change `INTEGRATIONS.supabase` and the `connect-src` of the security policy in [`vercel.json`](vercel.json) together (the tests require both to name the same project), then apply the migrations there.

Builders use anonymous accounts, so an account is a browser: there is no password, and clearing the browser's data loses access to it. The device keeps the source of truth for what a builder types (profile, pre-registration, submission and waitlist entry) and syncs a copy. The server is the source of truth for check-in, conversations and teams. The client library ([`public/src/vendor/supabase.js`](public/src/vendor/supabase.js), supabase-js 2.118.0) loads after the first render, so the app never waits for it.

### One-time settings in the Supabase dashboard

- **Allow anonymous sign-ins:** Authentication → Sign In / Providers. Until this is on, the waitlist still works but accounts cannot be created. The app says "Accounts are not switched on yet" and keeps everything else on the device.
- **Rate limit for anonymous sign-ins:** Authentication → Rate Limits. Raise it before event day. The default allows about 30 new accounts per hour from one IP address, and a venue's Wi-Fi often shares one.
- Consider CAPTCHA protection (Authentication → Attack Protection) if the app is promoted widely.

<details>
<summary><b>Run the event from the dashboard</b></summary>
<br>

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

</details>

### Change the database

Add a new file to [`supabase/migrations/`](supabase/migrations); never edit one that has been applied. Apply it to the project, then run `npm test`. The database tests check that every table has row-level security and that every table, column, function and argument the app uses exists.

The file names match the versions in the project's migration history. That history also lists six unnamed migrations from September 2025, from an earlier prototype in the same project. The first migration here removes what they created.

<br>

## PWA

The manifest has standard, maskable and Apple touch icons, shortcuts and install screenshots. The service worker caches every app file on install, so the app, including the check-in pass, opens offline. When a new version is deployed, a "Reload" prompt appears; nothing reloads under someone mid-form. To install, use the browser's install option; on iPhone or iPad, open the page in Safari, tap Share, then Add to Home Screen. Settings explains both.

After changing anything in `public/`, regenerate the cache list. The tests fail if it is out of date.

```bash
npm run precache   # rewrites public/precache.js from the files in public/
```

To re-render the icons and screenshots, run this (it needs Playwright and Chromium):

```bash
npm run assets     # icons from the brand SVGs, install screenshots from a demo state, then the precache list
```

<br>

## Deploy

The Vercel project `dragonconnectorapp` deploys `main` to https://dragonconnectorapp.vercel.app, a public test address until the app moves to its own domain. It serves `public/` as a static site; [`vercel.json`](vercel.json) runs the tests as the build step and sets a strict Content Security Policy: everything loads from the app's own origin, connections go only to it and the Supabase project, nothing can frame it, and camera, microphone and geolocation are switched off. The page also asks search engines not to index it (`noindex,nofollow`).

<details>
<summary><b>Repository layout</b></summary>
<br>

| Path | Contents |
|---|---|
| `public/index.html` | The page shell |
| `public/src/main.js` | Routing, the navigation, celebrations, install and offline |
| `public/src/views/` | One module per screen (18 of them), plus shared helpers in `common.js`. Each exports `render(state, params, ctx)` plus named `actions`, `forms` and `inputs` that `main.js` wires up |
| `public/src/lib/` | The logic, which runs without a browser: the store (`store.js`), live services (`backend.js`), the quests, levels and badges (`game.js`), matching (`match.js`), validation (`validate.js`), event time in ICT (`time.js`), gates (`gates.js`), the Dragon Guide (`guide.js`) and the escaping `html` template (`html.js`). `ui.js` (toasts, celebrations and the tour) and `icons.js` serve the views |
| `public/src/data/` | The content: event facts and the Supabase settings (`event.js`), sample profiles (`people.js`), guides, docs, requirements and the map (`content.js`), and the starting conversations (`threads.js`) |
| `public/src/vendor/` | qrcode-generator 2.0.4 and the published UMD build of supabase-js 2.118.0, both unmodified, with their licenses |
| `public/styles/app.css` | Dragon Connector Brand System v1.0: Obsidian `#0B0B0B`, Ivory `#F8F8F6` and Dragon Gold `#D4AF37` at about 70/20/10, with Oxanium, Space Grotesk and IBM Plex Mono, including Vietnamese subsets |
| `public/brand/`, `public/fonts/`, `public/icons/` | Logos, self-hosted fonts with their licenses, app icons and install screenshots |
| `public/sw.js`, `public/precache.js` | The service worker and its generated file list |
| `supabase/migrations/` | The database: tables, row-level security policies and functions, in the order they were applied |
| `scripts/` | `build-precache.mjs` (the cache list) and `render-assets.cjs` (icons and install screenshots) |
| `tests/` | The 51 `node:test` cases, and `fake-supabase.mjs`, an in-memory stand-in for the parts of supabase-js the app uses |
| `docs/readme/` | The images in this README |

</details>

<br>

<p align="center"><sub>The code is MIT licensed, copyright 2026 Operator Uplift (see <a href="LICENSE">LICENSE</a>). The fonts, Oxanium, Space Grotesk and IBM Plex Mono, keep the SIL Open Font License (<code>public/fonts/OFL-*.txt</code>). The vendored <a href="https://github.com/kazuhikoarase/qrcode-generator">qrcode-generator</a> by Kazuhiko Arase and <a href="https://github.com/supabase/supabase-js">supabase-js</a> keep their MIT licenses (<code>public/src/vendor/</code>). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.</sub></p>

<p align="center"><sub>Built by <a href="https://rvaclassic.xyz">Matt Sim</a>, founder of <a href="https://operatoruplift.com">Operator Uplift</a>. More builds at <a href="https://github.com/operatoruplift">github.com/operatoruplift</a>. Want one built for your product? <a href="https://cal.com/rvaclassic/15min">Book a 15-minute call</a>.</sub></p>
