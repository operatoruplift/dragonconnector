-- Dragon Connector HQ (dragonconnector.com/app/hq/): the private dashboard for organizers, judges
-- and check-in crew.
--
-- HQ does not use builder accounts. Each staff member has a personal access code. Signing in with
-- it opens an HQ session, and every hq_ function checks that session and the staff member's role
-- before it reads or changes anything. Codes and session tokens are kept only as SHA-256 hashes. A
-- session lasts 14 days from its last use; a new code or revoking a staff member ends their sessions.
--
--   organizer  everything: the event switches, people, teams, projects and results, announcements,
--              the organizer inbox, sponsor enquiries, check-in and the crew
--   judge      the submitted projects, and their own scores while judging is open
--   crew       the check-in desk: look up a pass and check its builder in
--
-- Builders' access is unchanged. The new tables have row-level security and no policies, so only
-- the hq_ functions reach them. The first organizer's code is created in the SQL editor:
--   select private.hq_create_staff('Your name', 'organizer');

-- Staff, their sessions and the judges' scores -----------------------------------------------------

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  role text not null check (role in ('organizer', 'judge', 'crew')),
  code_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.staff enable row level security;

create table public.staff_sessions (
  token_hash text primary key,
  staff_id uuid not null references public.staff (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days'
);
create index staff_sessions_staff_idx on public.staff_sessions (staff_id);
alter table public.staff_sessions enable row level security;

-- One row per judge and project, on the four published criteria (25 points each). A judge with a
-- conflict of interest records it instead of scores.
create table public.scores (
  submission_id uuid not null references public.submissions (owner_id) on delete cascade,
  judge_id uuid not null references public.staff (id) on delete cascade,
  prototype smallint check (prototype between 0 and 25),
  ux smallint check (ux between 0 and 25),
  technical smallint check (technical between 0 and 25),
  pitch smallint check (pitch between 0 and 25),
  notes text check (notes is null or char_length(notes) <= 2000),
  conflict boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (submission_id, judge_id),
  check (not conflict or (prototype is null and ux is null and technical is null and pitch is null))
);
create index scores_judge_idx on public.scores (judge_id);
alter table public.scores enable row level security;

-- Organizers open judging when the projects are in, and close it to freeze the scores.
alter table public.event_settings add column judging_open boolean not null default false;

-- Sponsor enquiries become a small pipeline.
alter table public.sponsor_inquiries add column status text not null default 'new' check (status in ('new', 'contacted', 'talking', 'confirmed', 'declined'));
alter table public.sponsor_inquiries add column notes text check (notes is null or char_length(notes) <= 2000);
alter table public.sponsor_inquiries add column updated_at timestamptz not null default now();

-- Helpers (not exposed to clients) -------------------------------------------------------------------

create function private.sha256_hex(value text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(coalesce(value, ''), 'UTF8')), 'hex')
$$;

-- Codes are compared without case, spaces, dashes or the HQ- prefix, so they can be typed loosely.
create function private.code_hash(code text) returns text
language sql immutable set search_path = '' as $$
  select private.sha256_hex(regexp_replace(upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g')), '^HQ(?=[A-Z0-9]{16}$)', ''))
$$;

-- A new access code: HQ- and 16 characters from an alphabet without look-alikes (80 random bits).
create function private.new_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(16);
  code text := 'HQ';
begin
  for i in 0..15 loop
    if i % 4 = 0 then code := code || '-'; end if;
    code := code || substr(alphabet, get_byte(bytes, i) % 32 + 1, 1);
  end loop;
  return code;
end $$;

create function private.staff_json(member public.staff) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('id', member.id, 'name', member.name, 'role', member.role)
$$;

-- The staff member behind a live HQ session, if their role may do this. Raises 28000 when the
-- session has ended, so HQ asks them to sign in again, and 42501 when the role is not allowed.
create function private.hq_staff(session text, roles text[]) returns public.staff
language plpgsql volatile set search_path = '' as $$
declare
  token text := private.sha256_hex(session);
  member public.staff;
begin
  select s.* into member
  from public.staff_sessions ss join public.staff s on s.id = ss.staff_id
  where ss.token_hash = token and ss.expires_at > now() and s.revoked_at is null;
  if member.id is null then
    raise exception 'Your HQ session has ended. Sign in again with your access code.' using errcode = '28000';
  end if;
  if not (member.role = any (roles)) then
    raise exception 'Your HQ role cannot do that.' using errcode = '42501';
  end if;
  -- Each use keeps the session going for another 14 days (written at most once an hour).
  update public.staff_sessions set last_seen_at = now(), expires_at = now() + interval '14 days'
  where token_hash = token and last_seen_at < now() - interval '1 hour';
  return member;
end $$;

-- Creates a staff member and returns their access code, which is shown once and never stored.
create function private.hq_create_staff(staff_name text, staff_role text) returns jsonb
language plpgsql volatile set search_path = '' as $$
declare
  code text := private.new_code();
  created public.staff;
begin
  insert into public.staff (name, role, code_hash) values (btrim(staff_name), staff_role, private.code_hash(code))
  returning * into created;
  return private.staff_json(created) || jsonb_build_object('code', code);
end $$;

-- What the check-in desk sees for a pass. It reads the pass code out of whatever was scanned or
-- typed: the code itself, the pass's QR link, or an older DC001: pass. Crew see what the desk needs;
-- organizers also see the email and dietary needs.
create function private.pass_card(member public.staff, pass text) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  code text := upper(substring(coalesce(pass, '') from '[Dd][Cc]-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}'));
  found public.registrations;
  checked timestamptz;
begin
  if code is null then return jsonb_build_object('status', 'unreadable'); end if;
  select * into found from public.registrations where pass_code = code;
  if found.user_id is null then return jsonb_build_object('status', 'not-found', 'pass', code); end if;
  select checked_in_at into checked from public.check_ins where user_id = found.user_id;
  return jsonb_build_object(
    'status', 'found', 'pass', code, 'name', found.name, 'registration', found.status, 'checked_in_at', checked,
    'media_consent', found.media_consent, 'access_needs', found.access_needs,
    'team', (select t.name from public.team_members m join public.teams t on t.id = m.team_id where m.user_id = found.user_id and m.status = 'joined'),
    'email', case when member.role = 'organizer' then found.email end,
    'dietary', case when member.role = 'organizer' then found.dietary end);
end $$;

-- Signing in and out ------------------------------------------------------------------------------------

-- Answers { status: 'signed-in', session, staff } or { status: 'wrong-code' }. The session token is
-- returned once and kept only as a hash.
create function public.hq_sign_in(code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  member public.staff;
  token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  select * into member from public.staff where code_hash = private.code_hash(code) and revoked_at is null;
  if member.id is null then return jsonb_build_object('status', 'wrong-code'); end if;
  delete from public.staff_sessions where expires_at < now();
  insert into public.staff_sessions (token_hash, staff_id) values (private.sha256_hex(token), member.id);
  return jsonb_build_object('status', 'signed-in', 'session', token, 'staff', private.staff_json(member));
end $$;

create function public.hq_me(session text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer', 'judge', 'crew']);
begin
  return private.staff_json(me);
end $$;

create function public.hq_sign_out(session text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.staff_sessions where token_hash = private.sha256_hex(session);
end $$;

-- Organizers: the whole event in one read --------------------------------------------------------------

create function public.hq_event(session text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
begin
  return jsonb_build_object(
    'staff', private.staff_json(me),
    'now', now(),
    'settings', (select jsonb_build_object('registration_open', s.registration_open, 'check_in_open', s.check_in_open,
      'submissions_open', s.submissions_open, 'judging_open', s.judging_open, 'updated_at', s.updated_at,
      'check_in_code', (select x.check_in_code from public.event_secrets x)) from public.event_settings s),
    'waitlist', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'name', w.name, 'email', w.email, 'role', w.role,
      'track', w.track, 'user_id', w.user_id, 'created_at', w.created_at) order by w.created_at desc) from public.waitlist w), '[]'::jsonb),
    'registrations', coalesce((select jsonb_agg(jsonb_build_object('user_id', r.user_id, 'name', r.name, 'email', r.email,
      'phone', r.phone, 'experience', r.experience, 'dietary', r.dietary, 'access_needs', r.access_needs,
      'media_consent', r.media_consent, 'status', r.status, 'pass_code', r.pass_code, 'created_at', r.created_at,
      'updated_at', r.updated_at) order by r.created_at desc) from public.registrations r), '[]'::jsonb),
    'profiles', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'role', p.role, 'skills', p.skills,
      'tracks', p.tracks, 'looking_for', p.looking_for, 'languages', p.languages, 'bio', p.bio, 'github', p.github,
      'discoverable', p.discoverable, 'created_at', p.created_at) order by p.created_at desc) from public.profiles p), '[]'::jsonb),
    'check_ins', coalesce((select jsonb_agg(jsonb_build_object('user_id', c.user_id, 'checked_in_at', c.checked_in_at)
      order by c.checked_in_at desc) from public.check_ins c), '[]'::jsonb),
    'teams', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'track', t.track, 'open_roles', t.open_roles,
      'owner_id', t.owner_id, 'created_at', t.created_at,
      'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', m.user_id, 'status', m.status) order by m.created_at), '[]'::jsonb)
        from public.team_members m where m.team_id = t.id)) order by t.created_at desc) from public.teams t), '[]'::jsonb),
    'submissions', coalesce((select jsonb_agg(jsonb_build_object('id', s.owner_id, 'team_id', s.team_id, 'name', s.name,
      'tagline', s.tagline, 'track', s.track, 'description', s.description, 'stack', s.stack, 'integration', s.integration,
      'repo_url', s.repo_url, 'video_url', s.video_url, 'live_url', s.live_url, 'status', s.status,
      'submitted_at', s.submitted_at, 'updated_at', s.updated_at) order by s.updated_at desc) from public.submissions s), '[]'::jsonb),
    'scores', coalesce((select jsonb_agg(jsonb_build_object('submission_id', x.submission_id, 'judge_id', x.judge_id,
      'prototype', x.prototype, 'ux', x.ux, 'technical', x.technical, 'pitch', x.pitch, 'notes', x.notes,
      'conflict', x.conflict, 'updated_at', x.updated_at)) from public.scores x), '[]'::jsonb),
    'crew', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'role', s.role, 'created_at', s.created_at,
      'revoked_at', s.revoked_at,
      'sessions', (select count(*) from public.staff_sessions ss where ss.staff_id = s.id and ss.expires_at > now()),
      'last_seen_at', (select max(ss.last_seen_at) from public.staff_sessions ss where ss.staff_id = s.id)) order by s.created_at) from public.staff s), '[]'::jsonb),
    'inquiries', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'company', i.company, 'name', i.name, 'email', i.email,
      'tier', i.tier, 'message', i.message, 'lang', i.lang, 'page', i.page, 'status', i.status, 'notes', i.notes,
      'created_at', i.created_at, 'updated_at', i.updated_at) order by i.created_at desc) from public.sponsor_inquiries i), '[]'::jsonb),
    'announcements', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'body', a.body, 'published_at', a.published_at)
      order by a.published_at desc) from public.announcements a), '[]'::jsonb),
    -- Only the organizer channel: builders' direct messages and team chats stay out of HQ.
    'threads', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'builder_id', substr(c.pair_key, 12), 'created_at', c.created_at,
      'messages', (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'from_organizers', m.from_organizers, 'body', m.body,
        'created_at', m.created_at) order by m.created_at), '[]'::jsonb) from public.messages m where m.conversation_id = c.id))
      order by c.created_at desc) from public.conversations c where c.kind = 'organizers'), '[]'::jsonb)
  );
end $$;

-- Judges (and organizers): the submitted projects ----------------------------------------------------

create function public.hq_projects(session text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer', 'judge']);
begin
  return jsonb_build_object(
    'staff', private.staff_json(me),
    'judging_open', (select s.judging_open from public.event_settings s),
    'projects', coalesce((select jsonb_agg(jsonb_build_object(
      'id', s.owner_id, 'name', s.name, 'tagline', s.tagline, 'track', s.track, 'description', s.description, 'stack', s.stack,
      'integration', s.integration, 'repo_url', s.repo_url, 'video_url', s.video_url, 'live_url', s.live_url,
      'submitted_at', s.submitted_at, 'team', t.name,
      'members', case when s.team_id is null
        then (select coalesce(jsonb_agg(p.name), '[]'::jsonb) from public.profiles p where p.id = s.owner_id)
        else (select coalesce(jsonb_agg(p.name order by p.name), '[]'::jsonb) from public.team_members m
              join public.profiles p on p.id = m.user_id where m.team_id = s.team_id and m.status = 'joined') end,
      'score', (select jsonb_build_object('prototype', x.prototype, 'ux', x.ux, 'technical', x.technical, 'pitch', x.pitch,
        'notes', x.notes, 'conflict', x.conflict, 'updated_at', x.updated_at)
        from public.scores x where x.submission_id = s.owner_id and x.judge_id = me.id)
    ) order by s.submitted_at, s.name) from public.submissions s left join public.teams t on t.id = s.team_id
    where s.status = 'submitted'), '[]'::jsonb));
end $$;

-- Saves this judge's scores for a project, while judging is open.
create function public.hq_score(session text, project uuid, prototype_points int, ux_points int, technical_points int,
  pitch_points int, judge_notes text default null, has_conflict boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['judge']);
  conflicted boolean := coalesce(has_conflict, false);
begin
  if not (select s.judging_open from public.event_settings s) then raise exception 'Judging is closed. An organizer opens it in HQ.'; end if;
  if not exists (select 1 from public.submissions where owner_id = project and status = 'submitted') then
    raise exception 'That project has not been submitted.';
  end if;
  if conflicted then
    prototype_points := null; ux_points := null; technical_points := null; pitch_points := null;
  elsif exists (select 1 from unnest(array[prototype_points, ux_points, technical_points, pitch_points]) as points where points not between 0 and 25) then
    raise exception 'Each score is a whole number from 0 to 25.';
  end if;
  if char_length(coalesce(judge_notes, '')) > 2000 then raise exception 'Keep your notes under 2,000 characters.'; end if;
  insert into public.scores (submission_id, judge_id, prototype, ux, technical, pitch, notes, conflict, updated_at)
  values (project, me.id, prototype_points, ux_points, technical_points, pitch_points, nullif(btrim(coalesce(judge_notes, '')), ''), conflicted, now())
  on conflict (submission_id, judge_id) do update
    set prototype = excluded.prototype, ux = excluded.ux, technical = excluded.technical, pitch = excluded.pitch,
        notes = excluded.notes, conflict = excluded.conflict, updated_at = excluded.updated_at;
  return jsonb_build_object('prototype', prototype_points, 'ux', ux_points, 'technical', technical_points, 'pitch', pitch_points,
    'notes', nullif(btrim(coalesce(judge_notes, '')), ''), 'conflict', conflicted, 'updated_at', now());
end $$;

-- The check-in desk (organizers and crew) ---------------------------------------------------------------

create function public.hq_pass(session text, pass text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer', 'crew']);
begin
  return private.pass_card(me, pass);
end $$;

create function public.hq_check_in(session text, pass text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer', 'crew']);
  card jsonb := private.pass_card(me, pass);
begin
  if card->>'status' <> 'found' then return card; end if;
  insert into public.check_ins (user_id) select r.user_id from public.registrations r where r.pass_code = card->>'pass'
  on conflict (user_id) do nothing;
  return private.pass_card(me, pass) || jsonb_build_object('already', card->>'checked_in_at' is not null);
end $$;

create function public.hq_undo_check_in(session text, pass text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
  card jsonb := private.pass_card(me, pass);
begin
  if card->>'status' <> 'found' then return card; end if;
  delete from public.check_ins c using public.registrations r where r.pass_code = card->>'pass' and c.user_id = r.user_id;
  return private.pass_card(me, pass);
end $$;

-- Organizers: replies, announcements and switches ---------------------------------------------------

-- A reply in a builder's private line to the organizers. It arrives in their app as "Organizers".
create function public.hq_reply(session text, thread uuid, reply text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
  sent public.messages;
begin
  if not exists (select 1 from public.conversations c where c.id = thread and c.kind = 'organizers') then
    raise exception 'That conversation is not in the organizer inbox.';
  end if;
  if char_length(btrim(coalesce(reply, ''))) not between 1 and 1000 then raise exception 'Write a reply of up to 1,000 characters.'; end if;
  insert into public.messages (conversation_id, sender_id, from_organizers, body) values (thread, null, true, btrim(reply))
  returning * into sent;
  return jsonb_build_object('id', sent.id, 'from_organizers', true, 'body', sent.body, 'created_at', sent.created_at);
end $$;

-- Publishes an announcement now, or schedules it for later.
create function public.hq_announce(session text, message text, publish_at timestamptz default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
  posted public.announcements;
begin
  if char_length(btrim(coalesce(message, ''))) not between 1 and 2000 then raise exception 'Write an announcement of up to 2,000 characters.'; end if;
  insert into public.announcements (body, published_at) values (btrim(message), coalesce(publish_at, now())) returning * into posted;
  return jsonb_build_object('id', posted.id, 'body', posted.body, 'published_at', posted.published_at);
end $$;

create function public.hq_edit_announcement(session text, announcement bigint, message text, publish_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
  changed public.announcements;
begin
  if char_length(btrim(coalesce(message, ''))) not between 1 and 2000 then raise exception 'Write an announcement of up to 2,000 characters.'; end if;
  update public.announcements set body = btrim(message), published_at = coalesce(publish_at, published_at)
  where id = announcement returning * into changed;
  if changed.id is null then raise exception 'That announcement no longer exists.'; end if;
  return jsonb_build_object('id', changed.id, 'body', changed.body, 'published_at', changed.published_at);
end $$;

create function public.hq_delete_announcement(session text, announcement bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
begin
  delete from public.announcements where id = announcement;
end $$;

-- Turns one of the event switches on or off: registration, check-in, submissions or judging.
create function public.hq_set_switch(session text, setting text, turned_on boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
  saved public.event_settings;
begin
  if setting is null or setting not in ('registration_open', 'check_in_open', 'submissions_open', 'judging_open') or turned_on is null then
    raise exception 'That is not an event switch.';
  end if;
  update public.event_settings set
    registration_open = case when setting = 'registration_open' then turned_on else registration_open end,
    check_in_open = case when setting = 'check_in_open' then turned_on else check_in_open end,
    submissions_open = case when setting = 'submissions_open' then turned_on else submissions_open end,
    judging_open = case when setting = 'judging_open' then turned_on else judging_open end
  where id returning * into saved;
  return jsonb_build_object('registration_open', saved.registration_open, 'check_in_open', saved.check_in_open,
    'submissions_open', saved.submissions_open, 'judging_open', saved.judging_open, 'updated_at', saved.updated_at);
end $$;

-- The code builders type at the venue to check themselves in. Empty clears it.
create function public.hq_set_check_in_code(session text, code text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
  cleaned text := nullif(upper(btrim(coalesce(code, ''))), '');
begin
  if cleaned is not null and cleaned !~ '^[A-Z0-9][A-Z0-9 -]{2,38}[A-Z0-9]$' then
    raise exception 'Use 4 to 40 letters, digits, spaces or dashes.';
  end if;
  update public.event_secrets set check_in_code = cleaned where id;
  return cleaned;
end $$;

-- Organizers: sponsors and the waitlist -----------------------------------------------------------------

create function public.hq_update_inquiry(session text, inquiry bigint, inquiry_status text, inquiry_notes text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
  changed public.sponsor_inquiries;
begin
  if inquiry_status not in ('new', 'contacted', 'talking', 'confirmed', 'declined') then raise exception 'Choose a status from the list.'; end if;
  if char_length(coalesce(inquiry_notes, '')) > 2000 then raise exception 'Keep notes under 2,000 characters.'; end if;
  update public.sponsor_inquiries set status = inquiry_status, notes = nullif(btrim(coalesce(inquiry_notes, '')), ''), updated_at = now()
  where id = inquiry returning * into changed;
  if changed.id is null then raise exception 'That enquiry no longer exists.'; end if;
  return jsonb_build_object('id', changed.id, 'status', changed.status, 'notes', changed.notes, 'updated_at', changed.updated_at);
end $$;

-- Removes a waitlist entry, for example when someone asks to be taken off the list.
create function public.hq_remove_waitlist(session text, entry bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
begin
  delete from public.waitlist where id = entry;
end $$;

-- Organizers: the crew ----------------------------------------------------------------------------------

-- Adds an organizer, judge or crew member and returns their access code, shown once.
create function public.hq_add_staff(session text, staff_name text, staff_role text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
begin
  if char_length(btrim(coalesce(staff_name, ''))) not between 2 and 60 then raise exception 'Give a name of 2 to 60 characters.'; end if;
  if staff_role is null or staff_role not in ('organizer', 'judge', 'crew') then raise exception 'Choose organizer, judge or crew.'; end if;
  return private.hq_create_staff(staff_name, staff_role);
end $$;

-- Gives a staff member a new code (restoring them if they were revoked) and ends their other
-- sessions. Organizers renewing their own code stay signed in here.
create function public.hq_new_code(session text, member uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
  code text := private.new_code();
  changed public.staff;
begin
  update public.staff set code_hash = private.code_hash(code), revoked_at = null where id = member returning * into changed;
  if changed.id is null then raise exception 'There is no such crew member.'; end if;
  delete from public.staff_sessions where staff_id = member and token_hash <> private.sha256_hex(session);
  return private.staff_json(changed) || jsonb_build_object('code', code);
end $$;

-- Revokes a staff member: their code stops working and their sessions end. Their scores stay.
create function public.hq_revoke_staff(session text, member uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff := private.hq_staff(session, array['organizer']);
begin
  if member = me.id then raise exception 'You cannot revoke yourself. Ask another organizer.'; end if;
  update public.staff set revoked_at = now() where id = member and revoked_at is null;
  delete from public.staff_sessions where staff_id = member;
end $$;

-- Privileges --------------------------------------------------------------------------------------------

revoke all on public.staff, public.staff_sessions, public.scores from anon, authenticated;
revoke execute on function private.sha256_hex(text), private.code_hash(text), private.new_code(), private.staff_json(public.staff),
  private.hq_staff(text, text[]), private.hq_create_staff(text, text), private.pass_card(public.staff, text) from public, anon, authenticated;

-- HQ has no Supabase account, so its functions are open to the public key; each one checks the HQ
-- session before doing anything.
revoke execute on function public.hq_sign_in(text), public.hq_me(text), public.hq_sign_out(text), public.hq_event(text),
  public.hq_projects(text), public.hq_score(text, uuid, int, int, int, int, text, boolean), public.hq_pass(text, text),
  public.hq_check_in(text, text), public.hq_undo_check_in(text, text), public.hq_reply(text, uuid, text),
  public.hq_announce(text, text, timestamptz), public.hq_edit_announcement(text, bigint, text, timestamptz),
  public.hq_delete_announcement(text, bigint), public.hq_set_switch(text, text, boolean), public.hq_set_check_in_code(text, text),
  public.hq_update_inquiry(text, bigint, text, text), public.hq_remove_waitlist(text, bigint), public.hq_add_staff(text, text, text),
  public.hq_new_code(text, uuid), public.hq_revoke_staff(text, uuid) from public;
grant execute on function public.hq_sign_in(text), public.hq_me(text), public.hq_sign_out(text), public.hq_event(text),
  public.hq_projects(text), public.hq_score(text, uuid, int, int, int, int, text, boolean), public.hq_pass(text, text),
  public.hq_check_in(text, text), public.hq_undo_check_in(text, text), public.hq_reply(text, uuid, text),
  public.hq_announce(text, text, timestamptz), public.hq_edit_announcement(text, bigint, text, timestamptz),
  public.hq_delete_announcement(text, bigint), public.hq_set_switch(text, text, boolean), public.hq_set_check_in_code(text, text),
  public.hq_update_inquiry(text, bigint, text, text), public.hq_remove_waitlist(text, bigint), public.hq_add_staff(text, text, text),
  public.hq_new_code(text, uuid), public.hq_revoke_staff(text, uuid) to anon, authenticated;
