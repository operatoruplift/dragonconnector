<div align="center">

<img src="docs/readme/banner.png" alt="Dragon Connector, the participant app for Da Nang / 001, an installable PWA. Every step is a quest. The installable companion for a free, two-day hackathon for mobile apps on Solana in Da Nang on Saturday 12 and Sunday 13 December 2026. It works offline and syncs when it can. 21 quests worth 1,400 XP, a QR check-in pass, live messages and teams, works offline, at dragonconnector.com/app. Status: waitlist open. Beside the copy, three phones running the app: sample teammate profiles, the home screen at level 3 with the date card, and the Dragon Guide answering when the event is." width="100%">

<br><br>

<a href="https://dragonconnector.com/app/"><img src="https://img.shields.io/badge/Open_the_app-D4AF37?style=for-the-badge" alt="Open the app" height="36"></a>&nbsp;&nbsp;
<a href="https://dragonconnector.com/app/#/settings"><img src="https://img.shields.io/badge/Try_Preview_mode-242424?style=for-the-badge" alt="Try Preview mode" height="36"></a>&nbsp;&nbsp;
<a href="https://dragonconnector.com"><img src="https://img.shields.io/badge/Visit_the_event_site-3A3A36?style=for-the-badge" alt="Visit the event site" height="36"></a>

<br><br>

<a href="https://dragonconnector.com/app/"><img src="https://img.shields.io/website?url=https%3A%2F%2Fdragonconnector.com%2Fapp%2F&label=app&up_message=live&down_message=down&up_color=34d399&labelColor=0B0B0B&style=flat-square" alt="App status"></a>
<img src="https://img.shields.io/badge/event-Saturday_12_and_Sunday_13_December_2026-D4AF37?style=flat-square&labelColor=0B0B0B" alt="Event: Saturday 12 and Sunday 13 December 2026">
<img src="https://img.shields.io/badge/PWA-installable%2C_works_offline-EBC76E?style=flat-square&labelColor=0B0B0B" alt="PWA: installable, works offline">
<img src="https://img.shields.io/badge/backend-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white&labelColor=0B0B0B" alt="Backend: Supabase">
<img src="https://img.shields.io/badge/build-none%2C_no_npm_dependencies-9A7624?style=flat-square&labelColor=0B0B0B" alt="No build step and no npm dependencies">
<img src="https://img.shields.io/badge/tests-75_node%3Atest_%2B_SQL-339933?style=flat-square&logo=nodedotjs&logoColor=white&labelColor=0B0B0B" alt="75 node:test tests and SQL tests">
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-6F6163?style=flat-square&labelColor=0B0B0B" alt="License: MIT"></a>

<h3>Every step from the waitlist to your demo is a quest.</h3>

<b>Join</b> &nbsp;→&nbsp; <b>Register</b> &nbsp;→&nbsp; <b>Check in</b> &nbsp;→&nbsp; <b>Team up</b> &nbsp;→&nbsp; <b>Submit</b>

<br>

<a href="#how-it-works">How it works</a> &nbsp;·&nbsp;
<a href="#honest-by-design">Honest by design</a> &nbsp;·&nbsp;
<a href="#status">Status</a> &nbsp;·&nbsp;
<a href="#run-it-locally">Run it locally</a> &nbsp;·&nbsp;
<a href="#live-services">Live services</a> &nbsp;·&nbsp;
<a href="#hq-run-the-event">HQ</a> &nbsp;·&nbsp;
<a href="#pwa">PWA</a> &nbsp;·&nbsp;
<a href="#deploy">Deploy</a>

</div>

<br>

<img src="docs/readme/screens.png" alt="Four phone screens of the app with a fictional builder, An Nguyen. 01, level up: the home screen at level 3, Builder, with 415 XP, 7 of 21 quests and 3 of 10 badges, and the date card: Saturday 12 and Sunday 13 December 2026, free, meals included, two days in Da Nang, 08:30–19:00 on Saturday and 08:30–18:45 on Sunday. 02, find your crew: sample profiles of mobile developers with match scores of 78 and 72 and the reasons, each labelled as a sample profile. 03, ask the Guide: the Dragon Guide answers that Dragon Connector is on Saturday 12 and Sunday 13 December 2026, 08:30–19:00 on Saturday and 08:30–18:45 on Sunday, with a link to the schedule. 04, carry your pass: a QR check-in pass with the code DC-7KQ4-M2XP, marked as a preview until check-in opens on Saturday 12 December, and self check-in with a venue code." width="100%">

<p align="center"><sub>Captured from a local build on 4 November 2026 with a fictional builder, connected to the in-memory Supabase from <code>tests/fake-supabase.mjs</code>. Nothing was sent to the live project.</sub></p>

**This is the participant app for Dragon Connector · Da Nang / 001, a free two-day hackathon for mobile apps on Solana in Da Nang, Vietnam, on Saturday 12 and Sunday 13 December 2026: an installable, gamified web app that works offline.** Every step of the journey is a quest that earns XP, from the waitlist to registration, onboarding, check-in, finding teammates, messaging and submitting a project. Live services run on Supabase: the waitlist, accounts, builder profiles, messages, teams, submissions and check-in. The waitlist is open and registration opens soon. Teams have up to 4 people, meals are included, projects are judged from public GitHub repositories, and every prize is paid in VND or goods, never in crypto. Dragon Connector is an independent event; it is not run or endorsed by Solana Mobile. The app says so wherever it matters, and every form says where its data goes.

Its facts match the event site at [dragonconnector.com](https://dragonconnector.com) (source: `operatoruplift/da-nang-hackathon-proposal`, a private repository) as of 4 November 2026, and it wears the event's identity, Dragon Connector Brand System v1.0, with the edition line **DA NANG / 001** and the tagline **BUILD. SHIP. CONNECT.** Built by Matt ([RVAClassic](https://x.com/rvaclassic), [Operator Uplift](https://operatoruplift.com)), the event's organizer, on 30 October 2026, and connected to Supabase on 31 October.

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
    <td><b>1. Waitlist, then registration</b></td>
    <td>One step to get in. While registration is closed it is the waitlist: name, email, role and track. When the organizers open registration, the step becomes Register: five steps (contact, builder profile, event details, agreements and review), filled in from the waitlist entry, validated as you go and saved as you type.</td>
    <td>+50<br>+150</td>
  </tr>
  <tr valign="top">
    <td><b>2. Onboarding</b></td>
    <td>A first-run welcome and a coach-mark tour of the app. You can replay it from Home or Settings.</td>
    <td>+50</td>
  </tr>
  <tr valign="top">
    <td><b>3. Check-in</b></td>
    <td>A personal QR pass that opens the check-in desk in HQ when crew scan it, plus self check-in with the venue code at the event.</td>
    <td>+200</td>
  </tr>
  <tr valign="top">
    <td><b>4. Teammates and co-founders</b></td>
    <td>Real builders who chose to show their profile, ranked by how well they complement you, with the reasons. Filters, search, intros, live teams and invitations.</td>
    <td>+100</td>
  </tr>
  <tr valign="top">
    <td><b>5. Messages</b></td>
    <td>Organizer announcements, live direct messages, team chat, a private channel to the organizers, and the Dragon Guide. The Guide answers questions from the event data and keeps the caveats.</td>
    <td>+75</td>
  </tr>
  <tr valign="top">
    <td><b>6. Submission</b></td>
    <td>Project details, links and confirmations. Drafts save as you type.</td>
    <td>+250</td>
  </tr>
</table>

Registering also counts for the waitlist quest, so builders who arrive after registration opens are not a quest short. The other 14 quests reward the rest of the app, such as building your profile, asking the Guide a question or reading every guide. **Explore** holds guides, docs (a summary of the official rules, the code of conduct, privacy and the FAQ), the sponsor tiers, the two-day schedule with saved sessions, quests and personal tasks, the requirements checklist, an illustrative venue map, and the prize categories with the judging rubric. **More** also links the [@dragonconnector](https://x.com/dragonconnector) accounts on Instagram, TikTok, Facebook and X.

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
    <td>Settings unlocks registration, check-in and submission on the device for demos, and fills the Sponsors page with labelled placeholder brands that show where each sponsor package appears. A Preview badge shows while it is on. The preview check-in code is <code>DRAGON-001</code>. Preview registrations, check-ins and submissions are never sent to the organizers; a preview registration waits on the device until registration opens and the builder confirms it.</td>
  </tr>
  <tr valign="top">
    <td><b>Sample profiles</b></td>
    <td>Twelve fictional profiles stay below the real builders, each labelled "Sample profile", so matching can be tried before many people have joined. Messages and invitations to them stay on the device and are not answered.</td>
  </tr>
  <tr valign="top">
    <td><b>No sponsors, no prospects</b></td>
    <td><code>SPONSORS</code> in <a href="public/src/data/event.js"><code>public/src/data/event.js</code></a> is empty. Add only organizations that have agreed in writing to be named, each with the <code>package</code> (tier) it agreed to: the Sponsors page gives each of the four tiers its own placement, from the "Presented by" banner for the Dragon sponsor to the in-kind partners row. Placeholder brands for Preview mode live in <code>EXAMPLE_SPONSORS</code> and never mix with real sponsors. The app never lists prospects.</td>
  </tr>
  <tr valign="top">
    <td><b>Prizes, plainly</b></td>
    <td>The app lists the prize categories (grand, track and named prizes) and says nothing is funded until sponsors commit. Every prize is paid in VND by bank transfer or in goods, never in crypto, and prizes over VND 20 million carry 10% personal income tax, which the payer withholds.</td>
  </tr>
  <tr valign="top">
    <td><b>Independent</b></td>
    <td>The app says Dragon Connector is an independent event, not run or endorsed by Solana Mobile, and no track or prize carries that name.</td>
  </tr>
  <tr valign="top">
    <td><b>Counted, not tracked</b></td>
    <td>Vercel Web Analytics counts page views without cookies and only on the live address (<a href="public/src/lib/analytics.js"><code>public/src/lib/analytics.js</code></a>). The privacy doc says so.</td>
  </tr>
</table>

The tests enforce these rules: no prospect names, no "apply now", no screen claiming registration is open while it is closed, no "Solana Mobile" track, fast-track or crypto prize, every sample profile labelled, teams capped at 4, and all user input escaped.

<br>

## Status

<table>
  <tr valign="top">
    <td width="17%" align="center"><img src="https://img.shields.io/badge/LIVE-34d399?style=for-the-badge" alt="Live"></td>
    <td>The app at <a href="https://dragonconnector.com/app/">dragonconnector.com/app</a>. The event site's Vercel project serves that path from this app's project, <code>dragonconnectorapp</code>, which deploys <code>main</code> with the tests as the build step. Its first address, dragonconnectorapp.vercel.app, sends visitors to the new one.</td>
    <td width="22%"><a href="#deploy">Deploy</a></td>
  </tr>
  <tr valign="top">
    <td align="center"><img src="https://img.shields.io/badge/LIVE-34d399?style=for-the-badge" alt="Live"></td>
    <td>The live services: the waitlist, anonymous accounts, builder profiles, messages, teams, submissions and check-in, in the Supabase project <code>ondistgfpmodesjrharp</code>, hosted in the United States (Ohio), behind row-level security. Accounts need anonymous sign-ins switched on in the Supabase dashboard. Until they are, the app says "Accounts are not switched on yet", the waitlist still works, and everything else stays on the device.</td>
    <td><a href="#live-services">Live services</a></td>
  </tr>
  <tr valign="top">
    <td align="center"><img src="https://img.shields.io/badge/LIVE-34d399?style=for-the-badge" alt="Live"></td>
    <td>HQ, the private dashboard for organizers, judges and check-in crew, at <a href="https://dragonconnector.com/app/hq/">dragonconnector.com/app/hq</a>. Staff sign in with personal access codes; organizers create them in HQ.</td>
    <td><a href="#hq-run-the-event">HQ</a></td>
  </tr>
  <tr valign="top">
    <td align="center"><img src="https://img.shields.io/badge/DATE_SET-D4AF37?style=for-the-badge" alt="Date set"></td>
    <td>The event itself. Dragon Connector · Da Nang / 001 is on Saturday 12 and Sunday 13 December 2026, in the daytime only: 08:30–19:00 on Saturday and 08:30–18:45 on Sunday, with 13 hours 15 minutes of building. Code freezes at 16:00 on Sunday, submissions close at 16:30 and the finalist demos start at 16:45. The planned venue is Swinburne University Vietnam, with the booking being confirmed. Sponsor tiers and prizes are on the event site.</td>
    <td><a href="https://dragonconnector.com">The event site</a></td>
  </tr>
  <tr valign="top">
    <td align="center"><img src="https://img.shields.io/badge/CLOSED-9A7624?style=for-the-badge" alt="Closed"></td>
    <td>Registration, check-in and submission. Registration opens soon. Check-in opens on Saturday 12 December, and submissions on Sunday 13 December. The organizers open each one with a switch in HQ. Until then, Preview mode unlocks all three on one device behind a Preview badge, and nothing done in Preview reaches the organizers.</td>
    <td><a href="#honest-by-design">Honest by design</a></td>
  </tr>
</table>

<br>

## Run it locally

<table>
  <tr valign="top">
    <td width="33%"><b>Prerequisites</b><br><sub>Node 20 or newer for the tests, and Python 3 for <code>npm start</code> (or any static file server pointed at <code>public/</code>). There are no dependencies to install.</sub></td>
    <td width="33%"><b>Read first</b><br><sub><a href="#honest-by-design">Honest by design</a> before changing any wording, and <a href="#live-services">Live services</a> before touching data: a local copy talks to the live project.</sub></td>
    <td width="33%"><b>What the checks prove</b><br><sub>75 <code>node:test</code> cases: the quest engine, matching, validation, the Guide and escaping, the event's schedule, tiers and prize policy, every link and screen, the PWA files, the live services against an in-memory Supabase, and HQ. <code>npm run test:db</code> runs the migrations and HQ's SQL tests on a throwaway PostgreSQL.</sub></td>
  </tr>
</table>

> **A local copy uses real data.** The app talks to the live Supabase project from any address. Saving something, messaging someone or opening Teammates on `localhost` creates a real anonymous account, and what you save lands in the real tables, so test with care and clear up with **Delete my data** in Settings.

### 1. Serve the app

```bash
npm start   # Python serves public/ at http://127.0.0.1:8428
```

It is a static site with no build step and no dependencies, so after `npm start` you open http://127.0.0.1:8428, and HQ at http://127.0.0.1:8428/hq/ (it talks to the live project too). Any static file server pointed at `public/` works. The service worker needs `localhost` or HTTPS. To try the closed steps, open Settings and turn on Preview mode; the check-in code is then `DRAGON-001`.

### 2. Run the tests

```bash
npm test    # node --test tests/*.test.mjs, the same command Vercel runs as its build step
```

The tests cover the quest engine, the store, matching, validation, the Dragon Guide and HTML escaping. They also check that:

- the schedule is two days, Saturday 12 and Sunday 13 December 2026, daytime only, with 795 build minutes, code freeze at 16:00 on Sunday, submissions closing at 16:30 and demos at 16:45, and the sponsor tiers and prize policy match the event site;
- the event is independent: no "Solana Mobile" track, no fast-track prize and no crypto payouts, and teams stop at 4;
- every in-app link leads somewhere, and the PWA manifest and icons are valid;
- every screen renders for a new and a busy builder, in every connection state, without turning anything another builder wrote into markup.

The live services are tested against an in-memory Supabase ([`tests/fake-supabase.mjs`](tests/fake-supabase.mjs)): accounts, syncing, offline and reconnecting, messages, teams, check-in and deleting data. Static checks make sure every table has row-level security, every function pins its search path, every HQ function checks its session first, and every table, column, function and argument the app and HQ use exists in [`supabase/migrations`](supabase/migrations). The app ships only the public anon key, and the security policy allows only this project. HQ's own tests ([`tests/hq.test.mjs`](tests/hq.test.mjs)) cover its numbers, the leaderboard, CSV exports, the score sheet and every page for each role.

### 3. Test the database

```bash
npm run test:db   # needs PostgreSQL 15 or newer installed locally; never touches the live project
```

[`scripts/test-database.sh`](scripts/test-database.sh) starts a throwaway PostgreSQL, adds a stand-in for the parts of Supabase the migrations use ([`supabase/tests/supabase.sql`](supabase/tests/supabase.sql)), applies every migration in order and runs [`supabase/tests/hq.test.sql`](supabase/tests/hq.test.sql): signing in, sessions ending, what each role can and cannot reach, scoring, the check-in desk, replies, announcements, switches, crew codes, and that builders gain nothing.

<br>

## Configure the event

### Change event facts

Edit [`public/src/data/event.js`](public/src/data/event.js):

- **The dates and programme:** `EVENT` and `FORMATS` (one format, `A`, with a day for each date).
- **Tracks, judging and prizes:** `TRACKS`, `JUDGING` and `PRIZES`.
- **Sponsor tiers:** `PACKAGES`, with the same tiers and amounts as the event site.
- **FAQ:** `FAQS`.
- **Opening a step:** the organizers' switches in the database decide (see [HQ](#hq-run-the-event)). `GATES` holds the fallback the app uses before it has heard from the server.
- **An external registration page:** `INTEGRATIONS.registrationUrl`, if registration moves elsewhere. Once registration is open, the registration screen links to it.

Then run `npm run precache` and `npm test`. The content tests check the schedules still add up.

Some tests pin today's state on purpose: the fallback `GATES.registration.open` is `false`, `INTEGRATIONS.registrationUrl` is `null` and `SPONSORS` is empty. Changing one fails `npm test`, and so the Vercel build, until the tests that pin it change in the same commit: `tests/content.test.mjs` in every case, and `tests/engine.test.mjs` when the Dragon Guide's answers about registration or sponsors change. Opening registration in the database needs no code change.

<br>

## Live services

The project is `ondistgfpmodesjrharp` (https://ondistgfpmodesjrharp.supabase.co), hosted in the United States (Ohio). `INTEGRATIONS.supabase` in [`public/src/data/event.js`](public/src/data/event.js) holds its URL and anon key. The anon key is public by design: row-level security decides what it can reach. Never put a service_role or secret key in the app; a test fails if one appears. To use another project, change `INTEGRATIONS.supabase` and the `connect-src` of the security policy in [`vercel.json`](vercel.json) together (the tests require both to name the same project), then apply the migrations there.

Builders use anonymous accounts, so an account is a browser: there is no password, and clearing the browser's data loses access to it. The device keeps the source of truth for what a builder types (profile, registration, submission and waitlist entry) and syncs a copy. The server is the source of truth for check-in, conversations and teams, and it holds teams to 4 people, counting pending invitations. The client library ([`public/src/vendor/supabase.js`](public/src/vendor/supabase.js), supabase-js 2.118.0) loads after the first render, so the app never waits for it.

### One-time settings in the Supabase dashboard

- **Allow anonymous sign-ins:** Authentication → Sign In / Providers. Until this is on, the waitlist still works but accounts cannot be created. The app says "Accounts are not switched on yet" and keeps everything else on the device.
- **Rate limit for anonymous sign-ins:** Authentication → Rate Limits. Raise it before the event. The default allows about 30 new accounts per hour from one IP address, and a venue's Wi-Fi often shares one.
- Consider CAPTCHA protection (Authentication → Attack Protection) if the app is promoted widely.

## HQ: run the event

HQ is the private dashboard at [dragonconnector.com/app/hq](https://dragonconnector.com/app/hq/), in [`public/hq/`](public/hq). It has no Supabase account of its own. Each staff member signs in with a personal access code, and every `hq_` function in [`supabase/migrations/20261105114515_hq.sql`](supabase/migrations/20261105114515_hq.sql) checks the session and the role before it reads or changes anything. Codes and session tokens are kept only as SHA-256 hashes; a session lasts 14 days from its last use, and a new code or revoking someone ends their sessions.

| Role | What HQ shows them |
|---|---|
| Organizer | **Overview**: the headline numbers, the switches, sign-ups per day and who is coming by track, role and experience. **People**: registrations, builder profiles and the waitlist, with search, filters and CSV exports, including the dietary and access list for catering. **Teams**, **Projects**, and **Judging**: the leaderboard, each judge's progress and a results CSV. The **check-in desk**, the **inbox** (replies reach the builder's app as "Organizers"), **announcements** (now or scheduled), **sponsor enquiries** as a pipeline, the **crew** (add people, new codes, revoke) and the **event switches** with the venue code |
| Judge | The submitted projects and a scoring sheet: the four published criteria at 25 points each, a conflict-of-interest option and notes only organizers see. Scores save while an organizer has judging open |
| Check-in crew | The check-in desk only: look up a pass and check its builder in. They see the name, team, photo consent and access needs, never the email or dietary needs |

A builder's pass carries a QR code with the desk's link (`https://dragonconnector.com/app/hq/#/door/DC-7KQ4-M2XP`), so any phone camera opens HQ on that pass, and the code under it can be typed instead. HQ shows only the organizer channel, never builders' direct messages or team chats, and builders' own access to the database is unchanged. HQ is not part of the offline app: the service worker never caches it, and it always loads fresh.

**The first organizer** is created once in the Supabase SQL editor; the code it returns is shown only then. Everyone else is added in HQ, under Crew.

```sql
select private.hq_create_staff('Matt Sim', 'organizer');
```

<details>
<summary><b>The same jobs in the Supabase dashboard</b></summary>
<br>

The Table Editor and the SQL editor bypass row-level security, so organizers can always fall back on them.

- **Post an announcement.** A future `published_at` schedules it.

  ```sql
  insert into announcements (body) values ('Doors open at 08:30.');
  ```

- **Open a step:**

  ```sql
  update event_settings set registration_open = true where id;  -- also check_in_open, submissions_open, judging_open
  ```

- **Set the venue code for self check-in.** It is never readable from the app. Each account gets ten tries per ten minutes.

  ```sql
  update event_secrets set check_in_code = 'GOLD-7' where id;
  ```

- **Check someone in by pass code:**

  ```sql
  insert into check_ins (user_id) select user_id from registrations where pass_code = 'DC-7KQ4-M2XP';
  ```

</details>

### Change the database

Add a new file to [`supabase/migrations/`](supabase/migrations); never edit one that has been applied. Run `npm run test:db`, apply it to the project, then run `npm test`. The database tests check that every table has row-level security and that every table, column, function and argument the app uses exists.

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

The Vercel project `dragonconnectorapp` deploys `main` to https://dragonconnectorapp.vercel.app, and the event site's project serves it to the public at https://dragonconnector.com/app/ through a rewrite in that site's `vercel.json`. Every path in the app is relative, so it works under `/app/` as it is: the service worker's scope is the folder it is served from, and the manifest's `id`, `start_url` and `scope` are `./`. Visits to the old address move to the new one before the app starts ([`public/src/moved.js`](public/src/moved.js)), keeping the screen in the address. It serves `public/` as a static site; [`vercel.json`](vercel.json) runs the tests as the build step and sets a strict Content Security Policy: everything loads from the app's own origin, connections go only to it and the Supabase project, nothing can frame it, and camera, microphone and geolocation are switched off. The page also asks search engines not to index it (`noindex,nofollow`), and carries a link-preview image (`public/og.png`, rendered by the event site's `site-src/render_previews.cjs`). Web Analytics has to be switched on in the Vercel project (Analytics → Enable) before `/_vercel/insights/script.js` exists; until then the app's request for it fails quietly.

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
| `public/hq/` | HQ, the staff dashboard: `main.js` (sign-in, roles and routing), `api.js` (the `hq_` functions), `model.js` (numbers, the leaderboard and exports, all pure), `charts.js`, one module per page in `views/`, and `hq.css` on top of the app's styles |
| `public/sw.js`, `public/precache.js` | The service worker and its generated file list (HQ is left out) |
| `supabase/migrations/` | The database: tables, row-level security policies and functions, in the order they were applied |
| `supabase/tests/` | SQL tests for HQ, and a stand-in for Supabase so the migrations run on a plain PostgreSQL |
| `scripts/` | `build-precache.mjs` (the cache list), `render-assets.cjs` (icons and install screenshots) and `test-database.sh` (the migrations and SQL tests on a throwaway PostgreSQL) |
| `tests/` | The 75 `node:test` cases, `fake-supabase.mjs`, an in-memory stand-in for the parts of supabase-js the app uses, and `hq-fixture.mjs`, a sample event for HQ's tests |
| `docs/readme/` | The images in this README |

</details>

<br>

<p align="center"><sub>The code is MIT licensed, copyright 2026 Operator Uplift (see <a href="LICENSE">LICENSE</a>). The fonts, Oxanium, Space Grotesk and IBM Plex Mono, keep the SIL Open Font License (<code>public/fonts/OFL-*.txt</code>). The vendored <a href="https://github.com/kazuhikoarase/qrcode-generator">qrcode-generator</a> by Kazuhiko Arase and <a href="https://github.com/supabase/supabase-js">supabase-js</a> keep their MIT licenses (<code>public/src/vendor/</code>). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.</sub></p>

<p align="center"><sub>Built by <a href="https://rvaclassic.xyz">Matt Sim</a>, founder of <a href="https://operatoruplift.com">Operator Uplift</a>. More builds at <a href="https://github.com/operatoruplift">github.com/operatoruplift</a>. Want one built for your product? <a href="https://cal.com/rvaclassic/15min">Book a 15-minute call</a>.</sub></p>
