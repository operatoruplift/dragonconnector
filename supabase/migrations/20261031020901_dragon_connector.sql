-- Dragon Connector participant app (operatoruplift/dragonconnector).
--
-- Every table has row-level security. Builders use anonymous Supabase sessions, so a session is a
-- device; nobody reaches another person's private data. Organizers work in the Supabase dashboard,
-- which bypasses these policies: they read the waitlist and registrations there, post
-- announcements, reply in the organizer channel and open check-in and submissions.

-- Helpers live in a schema the API does not expose; only policies, constraints and triggers use them.

create schema private;
grant usage on schema private to authenticated;

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- True when every item is between 1 and max_length characters (used by CHECK constraints).
create function private.short_items(items text[], max_length int) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(bool_and(char_length(item) between 1 and max_length), true) from unnest(items) as item
$$;

-- Event settings (organizers flip these in the dashboard) ----------------------------------------

create table public.event_settings (
  id boolean primary key default true check (id),
  registration_open boolean not null default false,
  check_in_open boolean not null default false,
  submissions_open boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.event_settings default values;
create trigger event_settings_touch before update on public.event_settings for each row execute function private.touch_updated_at();
alter table public.event_settings enable row level security;
create policy "Anyone can read the event settings" on public.event_settings for select to anon, authenticated using (true);

-- Private: no policies, so no client can read it. Set the venue code here before check-in opens.
create table public.event_secrets (
  id boolean primary key default true check (id),
  check_in_code text
);
insert into public.event_secrets default values;
alter table public.event_secrets enable row level security;

-- Waitlist: written only through join_waitlist(); never readable by clients ----------------------

create table public.waitlist (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  email text not null unique check (email = lower(email) and char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  role text not null check (role in ('mobile', 'solana', 'fullstack', 'ai', 'design', 'product', 'business', 'data')),
  track text check (track in ('mobile', 'ai', 'university')),
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;

-- Joining twice is harmless and reveals nothing about who is already on the list.
create function public.join_waitlist(entry_name text, entry_email text, entry_role text, entry_track text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.waitlist (name, email, role, track)
  values (btrim(entry_name), lower(btrim(entry_email)), entry_role, nullif(entry_track, ''))
  on conflict (email) do nothing;
end $$;

-- Builder profiles ---------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  role text not null check (role in ('mobile', 'solana', 'fullstack', 'ai', 'design', 'product', 'business', 'data')),
  skills text[] not null default '{}' check (cardinality(skills) <= 12 and private.short_items(skills, 40)),
  tracks text[] not null default '{}' check (tracks <@ array['mobile', 'ai', 'university']),
  looking_for text not null check (looking_for in ('team', 'members', 'cofounder', 'solo')),
  languages text[] not null default '{}' check (cardinality(languages) <= 8 and private.short_items(languages, 30)),
  formats text[] not null default '{}' check (formats <@ array['A', 'B']),
  bio text not null default '' check (char_length(bio) <= 280),
  github text check (github is null or (char_length(github) <= 200 and github ~* '^https?://[^[:space:]]+$')),
  discoverable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function private.touch_updated_at();

-- Registrations: private to the builder (organizers see them in the dashboard) --------------------

create table public.registrations (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  phone text check (phone is null or phone ~ '^[+0-9][0-9 -]{6,19}$'),
  format text not null check (format in ('A', 'B', 'either')),
  experience text not null check (experience in ('first', 'some', 'many')),
  dietary text check (dietary is null or char_length(dietary) <= 200),
  access_needs text check (access_needs is null or char_length(access_needs) <= 200),
  agrees_to_conduct boolean not null check (agrees_to_conduct),
  media_consent boolean not null,
  status text not null default 'pre-registered' check (status in ('pre-registered', 'registered')),
  pass_code text not null unique check (pass_code ~ '^DC-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger registrations_touch before update on public.registrations for each row execute function private.touch_updated_at();
alter table public.registrations enable row level security;
create policy "Builders read their own registration" on public.registrations for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Builders register themselves" on public.registrations for insert to authenticated
  with check (user_id = (select auth.uid()) and (status = 'pre-registered' or (select registration_open from public.event_settings)));
create policy "Builders update their own registration" on public.registrations for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (status = 'pre-registered' or (select registration_open from public.event_settings)));

-- Conversations: direct messages, team chats and each builder's channel to the organizers ---------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'team', 'organizers')),
  pair_key text unique, -- direct: the two builders' ids in order; organizers: the builder's id
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid default auth.uid() references auth.users (id) on delete set null,
  from_organizers boolean not null default false,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_sender_idx on public.messages (sender_id, created_at);

create function private.is_member(conversation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conversation_members where conversation_id = conversation and user_id = (select auth.uid()))
$$;

create function private.shares_conversation(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversation_members mine
    join public.conversation_members theirs on theirs.conversation_id = mine.conversation_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = other)
$$;

alter table public.conversations enable row level security;
create policy "Members see their conversations" on public.conversations for select to authenticated using (private.is_member(id));
alter table public.conversation_members enable row level security;
create policy "Members see who is in their conversations" on public.conversation_members for select to authenticated using (private.is_member(conversation_id));
alter table public.messages enable row level security;
create policy "Members read their messages" on public.messages for select to authenticated using (private.is_member(conversation_id));
create policy "Members send messages as themselves" on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and not from_organizers and private.is_member(conversation_id));

create function private.limit_message_rate() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.sender_id is not null and (select count(*) from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'You are sending messages too quickly. Wait a moment and try again.';
  end if;
  return new;
end $$;
create trigger messages_rate_limit before insert on public.messages for each row execute function private.limit_message_rate();

-- Profiles are visible when discoverable, to their owner, and to people sharing a conversation.
alter table public.profiles enable row level security;
create policy "Builders see discoverable profiles, their own and people they talk to" on public.profiles for select to authenticated
  using (discoverable or id = (select auth.uid()) or private.shares_conversation(id));
create policy "Builders create their own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "Builders update their own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Builders delete their own profile" on public.profiles for delete to authenticated using (id = (select auth.uid()));

create function public.organizer_conversation() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  chat uuid;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  insert into public.conversations (kind, pair_key) values ('organizers', 'organizers:' || me)
  on conflict (pair_key) do nothing returning id into chat;
  if chat is null then
    select id into chat from public.conversations where pair_key = 'organizers:' || me;
  else
    insert into public.conversation_members (conversation_id, user_id) values (chat, me);
  end if;
  return chat;
end $$;

create function public.start_direct(other uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  pair text;
  chat uuid;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if other = me then raise exception 'You cannot message yourself.'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'Create your builder profile first.'; end if;
  if not exists (select 1 from public.profiles where id = other and discoverable) then raise exception 'That builder is not available.'; end if;
  pair := 'direct:' || least(me::text, other::text) || ':' || greatest(me::text, other::text);
  select id into chat from public.conversations where pair_key = pair;
  if chat is not null then return chat; end if;
  if (select count(*) from public.conversation_members m join public.conversations c on c.id = m.conversation_id
      where m.user_id = me and c.kind = 'direct' and c.created_at > now() - interval '1 hour') >= 20 then
    raise exception 'You have started a lot of conversations. Try again later.';
  end if;
  insert into public.conversations (kind, pair_key) values ('direct', pair) on conflict (pair_key) do nothing returning id into chat;
  if chat is null then
    select id into chat from public.conversations where pair_key = pair;
  else
    insert into public.conversation_members (conversation_id, user_id) values (chat, me), (chat, other);
  end if;
  return chat;
end $$;

-- Teams ------------------------------------------------------------------------------------------

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 40),
  track text not null check (track in ('mobile', 'ai', 'university')),
  open_roles text[] not null default '{}' check (open_roles <@ array['mobile', 'solana', 'fullstack', 'ai', 'design', 'product', 'business', 'data']),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- Deleting the team chat disbands the team.
  conversation_id uuid not null unique references public.conversations (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('invited', 'joined')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create unique index team_members_one_team on public.team_members (user_id) where status = 'joined';
create index team_members_user_idx on public.team_members (user_id);
create index team_members_invited_by_idx on public.team_members (invited_by, created_at);

create function private.team_status(team uuid) returns text
language sql stable security definer set search_path = '' as $$
  select status from public.team_members where team_id = team and user_id = (select auth.uid())
$$;

alter table public.teams enable row level security;
create policy "Members and invitees see the team" on public.teams for select to authenticated using (private.team_status(id) is not null);
alter table public.team_members enable row level security;
create policy "Members see the roster and invitees their invitation" on public.team_members for select to authenticated
  using (user_id = (select auth.uid()) or private.team_status(team_id) = 'joined');

create function public.create_team(team_name text, team_track text, roles_needed text[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  chat uuid;
  created uuid;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'Create your builder profile first.'; end if;
  if exists (select 1 from public.team_members where user_id = me and status = 'joined') then raise exception 'You are already in a team.'; end if;
  insert into public.conversations (kind) values ('team') returning id into chat;
  insert into public.conversation_members (conversation_id, user_id) values (chat, me);
  insert into public.teams (name, track, open_roles, owner_id, conversation_id)
  values (btrim(team_name), team_track, coalesce(roles_needed, '{}'), me, chat) returning id into created;
  insert into public.team_members (team_id, user_id, status) values (created, me, 'joined');
  return created;
end $$;

create function public.invite_to_team(team uuid, invitee uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not exists (select 1 from public.teams where id = team and owner_id = me) then raise exception 'Only the team creator can invite people.'; end if;
  if invitee = me then raise exception 'You are already in this team.'; end if;
  if not exists (select 1 from public.profiles where id = invitee and discoverable) then raise exception 'That builder is not available.'; end if;
  if (select count(*) from public.team_members where invited_by = me and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'You have sent a lot of invitations. Try again later.';
  end if;
  insert into public.team_members (team_id, user_id, status, invited_by) values (team, invitee, 'invited', me)
  on conflict (team_id, user_id) do nothing;
end $$;

create function public.respond_to_invitation(team uuid, accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not exists (select 1 from public.team_members where team_id = team and user_id = me and status = 'invited') then
    raise exception 'There is no invitation to answer.';
  end if;
  if not accept then
    delete from public.team_members where team_id = team and user_id = me;
    return;
  end if;
  if exists (select 1 from public.team_members where user_id = me and status = 'joined') then
    raise exception 'Leave your current team before joining another.';
  end if;
  update public.team_members set status = 'joined' where team_id = team and user_id = me;
  insert into public.conversation_members (conversation_id, user_id)
  select conversation_id, me from public.teams where id = team
  on conflict do nothing;
end $$;

create function public.leave_team(team uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  team_owner uuid;
  chat uuid;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  select owner_id, conversation_id into team_owner, chat from public.teams where id = team;
  if team_owner is null or not exists (select 1 from public.team_members where team_id = team and user_id = me) then
    raise exception 'You are not in that team.';
  end if;
  if team_owner = me then
    delete from public.conversations where id = chat; -- disbands the team, its members and its chat
  else
    delete from public.team_members where team_id = team and user_id = me;
    delete from public.conversation_members where conversation_id = chat and user_id = me;
  end if;
end $$;

-- Submissions --------------------------------------------------------------------------------------

create table public.submissions (
  owner_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  tagline text check (tagline is null or char_length(tagline) <= 120),
  track text check (track is null or track in ('mobile', 'ai', 'university')),
  description text check (description is null or char_length(description) <= 2000),
  stack text[] not null default '{}' check (cardinality(stack) <= 12 and private.short_items(stack, 40)),
  integration text check (integration is null or char_length(integration) <= 800),
  repo_url text check (repo_url is null or (char_length(repo_url) <= 300 and repo_url ~* '^https?://[^[:space:]]+$')),
  video_url text check (video_url is null or (char_length(video_url) <= 300 and video_url ~* '^https?://[^[:space:]]+$')),
  live_url text check (live_url is null or (char_length(live_url) <= 300 and live_url ~* '^https?://[^[:space:]]+$')),
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  check (status = 'draft' or (tagline is not null and track is not null and description is not null and repo_url is not null and submitted_at is not null))
);
create index submissions_team_idx on public.submissions (team_id);
create trigger submissions_touch before update on public.submissions for each row execute function private.touch_updated_at();
alter table public.submissions enable row level security;
create policy "Builders read their own submission" on public.submissions for select to authenticated using (owner_id = (select auth.uid()));
create policy "Builders save their own submission" on public.submissions for insert to authenticated
  with check (owner_id = (select auth.uid())
    and (status = 'draft' or (select submissions_open from public.event_settings))
    and (team_id is null or private.team_status(team_id) = 'joined'));
create policy "Builders update their own submission" on public.submissions for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid())
    and (status = 'draft' or (select submissions_open from public.event_settings))
    and (team_id is null or private.team_status(team_id) = 'joined'));

-- Check-in ---------------------------------------------------------------------------------------

create table public.check_ins (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  checked_in_at timestamptz not null default now()
);
alter table public.check_ins enable row level security;
create policy "Builders see their own check-in" on public.check_ins for select to authenticated using (user_id = (select auth.uid()));

-- Private: counts attempts so the venue code cannot be guessed by trying many codes.
create table public.check_in_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index check_in_attempts_user_idx on public.check_in_attempts (user_id, attempted_at);
alter table public.check_in_attempts enable row level security;

-- Returns { status: 'checked-in' | 'wrong-code' | 'closed' | 'too-many', checked_in_at }. It reports
-- failures instead of raising them, so failed attempts are still counted.
create function public.check_in(code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  expected text;
  checked timestamptz;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  select checked_in_at into checked from public.check_ins where user_id = me;
  if checked is not null then return jsonb_build_object('status', 'checked-in', 'checked_in_at', checked); end if;
  if not (select check_in_open from public.event_settings) then return jsonb_build_object('status', 'closed'); end if;
  if (select count(*) from public.check_in_attempts where user_id = me and attempted_at > now() - interval '10 minutes') >= 10 then
    return jsonb_build_object('status', 'too-many');
  end if;
  insert into public.check_in_attempts (user_id) values (me);
  select check_in_code into expected from public.event_secrets;
  if expected is null or upper(regexp_replace(coalesce(code, ''), '\s', '', 'g')) <> upper(regexp_replace(expected, '\s', '', 'g')) then
    return jsonb_build_object('status', 'wrong-code');
  end if;
  insert into public.check_ins (user_id) values (me) on conflict (user_id) do nothing;
  select checked_in_at into checked from public.check_ins where user_id = me;
  return jsonb_build_object('status', 'checked-in', 'checked_in_at', checked);
end $$;

-- Announcements (organizers post them from the dashboard) -----------------------------------------

create table public.announcements (
  id bigint generated always as identity primary key,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  published_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
create policy "Anyone can read published announcements" on public.announcements for select to anon, authenticated using (published_at <= now());
insert into public.announcements (body, published_at) values
  ('Dragon Connector · Da Nang / 001 is in planning. Dates, venue, funding and prizes are proposals until we confirm them here.', '2026-10-30 09:00:00+07'),
  ('Proposed formats: Option A on Sunday 13 December 2026 (one day), or Option B on Saturday 12 and Sunday 13 December 2026 (two daytime sessions). Proposed venue: Swinburne University Vietnam, Da Nang.', '2026-10-30 09:01:00+07'),
  ('Registration is not open. Join the waitlist and pre-register in the app so your details are ready.', '2026-10-30 09:02:00+07');

-- Live updates: new messages and announcements. Realtime applies the policies above, so each
-- builder only receives what they can read.
alter publication supabase_realtime add table public.messages, public.announcements;

-- Privileges: clients reach data only through the policies and functions above --------------------

revoke all on public.waitlist, public.event_secrets, public.check_in_attempts from anon, authenticated;
revoke all on public.profiles, public.registrations, public.conversations, public.conversation_members, public.messages,
  public.teams, public.team_members, public.submissions, public.check_ins from anon;
revoke insert, update, delete, truncate, references, trigger on public.event_settings, public.announcements from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.conversations, public.conversation_members,
  public.teams, public.team_members, public.check_ins from authenticated;
revoke update, delete, truncate, references, trigger on public.messages from authenticated;
revoke truncate, references, trigger on public.profiles, public.registrations, public.submissions from authenticated;

revoke execute on function public.join_waitlist(text, text, text, text) from public;
grant execute on function public.join_waitlist(text, text, text, text) to anon, authenticated;
revoke execute on function public.organizer_conversation(), public.start_direct(uuid), public.create_team(text, text, text[]),
  public.invite_to_team(uuid, uuid), public.respond_to_invitation(uuid, boolean), public.leave_team(uuid), public.check_in(text) from public, anon;
grant execute on function public.organizer_conversation(), public.start_direct(uuid), public.create_team(text, text, text[]),
  public.invite_to_team(uuid, uuid), public.respond_to_invitation(uuid, boolean), public.leave_team(uuid), public.check_in(text) to authenticated;
revoke execute on all functions in schema private from public;
grant execute on function private.short_items(text[], int), private.is_member(uuid), private.shares_conversation(uuid), private.team_status(uuid) to authenticated;
