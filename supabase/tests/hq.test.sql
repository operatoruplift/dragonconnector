-- HQ, called the way the dashboard calls it: as the public anon role, with no Supabase account.
-- Run by scripts/test-database.sh on a throwaway database.

create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.ok(passed boolean, what text) returns void language plpgsql as $$
begin
  if passed is not true then raise exception 'not ok: %', what; end if;
end $$;

-- Runs a statement and expects it to fail with the given SQLSTATE (and, optionally, message text).
create function tests.fails(statement text, state text, message text default null) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate <> state or (message is not null and position(message in sqlerrm) = 0) then
      raise exception 'not ok: expected % (%) but got % (%) from %', state, coalesce(message, 'any message'), sqlstate, sqlerrm, statement;
    end if;
    return;
  end;
  raise exception 'not ok: expected % from %', state, statement;
end $$;

-- Builders: An and Binh in a team that submitted a project, Chi registered alone, and Binh writing
-- to the organizers.
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-4000-8000-00000000000a', true), ('00000000-0000-4000-8000-00000000000b', true), ('00000000-0000-4000-8000-00000000000c', true);
insert into public.profiles (id, name, role, looking_for, discoverable) values
  ('00000000-0000-4000-8000-00000000000a', 'An Nguyen', 'design', 'members', true),
  ('00000000-0000-4000-8000-00000000000b', 'Binh Tran', 'mobile', 'team', true),
  ('00000000-0000-4000-8000-00000000000c', 'Chi Le', 'ai', 'solo', false);
insert into public.registrations (user_id, name, email, format, experience, dietary, access_needs, agrees_to_conduct, media_consent, status, pass_code) values
  ('00000000-0000-4000-8000-00000000000a', 'An Nguyen', 'an@example.com', 'A', 'some', 'Vegetarian', null, true, false, 'registered', 'DC-AAAA-1111'),
  ('00000000-0000-4000-8000-00000000000b', 'Binh Tran', 'binh@example.com', 'A', 'first', null, 'Step-free access', true, true, 'registered', 'DC-BBBB-2222'),
  ('00000000-0000-4000-8000-00000000000c', 'Chi Le', 'chi@example.com', 'A', 'many', null, null, true, true, 'pre-registered', 'DC-CCCC-3333');
select public.join_waitlist('Dung Pham', 'Dung@Example.com', 'product', 'ai');

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
select public.create_team('Lantern', 'mobile', array['ai']) as team \gset
select public.invite_to_team(:'team', '00000000-0000-4000-8000-00000000000b');
insert into public.submissions (owner_id, team_id, name, tagline, track, description, repo_url, status, submitted_at)
values ('00000000-0000-4000-8000-00000000000a', :'team', 'Lantern', 'Night markets, mapped', 'mobile', 'A map of night markets.', 'https://github.com/lantern/app', 'draft', null);
set request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
select public.respond_to_invitation(:'team', true);
select public.organizer_conversation() as thread \gset
insert into public.messages (conversation_id, body) values (:'thread', 'Is there parking at the venue?');
reset role;
-- Submissions open on Sunday; the database owner stands in for that here.
update public.submissions set status = 'submitted', submitted_at = now() where owner_id = '00000000-0000-4000-8000-00000000000a';
select public.submit_sponsor_inquiry('Acme', 'Lan Vo', 'lan@acme.example', 'track', 'We would like to sponsor a track.');

-- The first organizer is created in the SQL editor, and the code is shown once.
select private.hq_create_staff('Matt Sim', 'organizer') ->> 'code' as organizer_code \gset
select tests.ok(:'organizer_code' ~ '^HQ(-[A-HJ-NP-Z2-9]{4}){4}$', 'codes look like HQ-XXXX-XXXX-XXXX-XXXX without look-alike characters');
select tests.ok((select code_hash from public.staff) ~ '^[0-9a-f]{64}$', 'only a hash of the code is stored');

set role anon;

-- Signing in
select tests.ok(public.hq_sign_in('HQ-AAAA-BBBB-CCCC-DDDD') ->> 'status' = 'wrong-code', 'a wrong code is refused');
select tests.ok(public.hq_sign_in(lower(replace(substr(:'organizer_code', 4), '-', ' '))) ->> 'status' = 'signed-in', 'codes ignore case, spacing and the HQ- prefix');
select public.hq_sign_in(:'organizer_code') ->> 'session' as organizer \gset
select tests.ok(public.hq_me(:'organizer') ->> 'role' = 'organizer', 'the session knows its staff member');
select tests.fails($$select public.hq_me('not-a-session')$$, '28000', 'Sign in again');
select tests.fails($$select public.hq_event(null)$$, '28000');

-- Nothing about staff is readable directly, and the helpers are out of reach.
select tests.fails($$select * from public.staff$$, '42501');
select tests.fails($$select * from public.staff_sessions$$, '42501');
select tests.fails($$select * from public.scores$$, '42501');
select tests.fails($$select private.new_code()$$, '42501');
select tests.fails($$select private.hq_create_staff('Mallory', 'organizer')$$, '42501');

-- The organizer's view of the event
select public.hq_event(:'organizer') as event \gset
select tests.ok((:'event'::jsonb -> 'settings' ->> 'registration_open')::boolean = false, 'settings are included');
select tests.ok(jsonb_array_length(:'event'::jsonb -> 'registrations') = 3, 'every registration');
select tests.ok(:'event'::jsonb -> 'waitlist' -> 0 ->> 'email' = 'dung@example.com', 'the waitlist');
select tests.ok(jsonb_array_length(:'event'::jsonb -> 'profiles') = 3, 'every profile');
select tests.ok(jsonb_array_length(:'event'::jsonb -> 'teams' -> 0 -> 'members') = 2, 'teams with their members');
select tests.ok(:'event'::jsonb -> 'submissions' -> 0 ->> 'status' = 'submitted', 'submissions');
select tests.ok(:'event'::jsonb -> 'threads' -> 0 ->> 'builder_id' = '00000000-0000-4000-8000-00000000000b', 'the organizer inbox knows who wrote');
select tests.ok(:'event'::jsonb -> 'threads' -> 0 -> 'messages' -> 0 ->> 'body' = 'Is there parking at the venue?', 'and what they wrote');
select tests.ok(:'event'::jsonb -> 'inquiries' -> 0 ->> 'status' = 'new', 'sponsor enquiries start as new');
select tests.ok(jsonb_array_length(:'event'::jsonb -> 'announcements') = 3, 'announcements');
select tests.ok(not (:'event'::jsonb ? 'messages'), 'builders'' own chats are not part of HQ');

-- Crew and judges
select public.hq_add_staff(:'organizer', 'Keith Vaughan', 'judge') ->> 'code' as judge_code \gset
select public.hq_add_staff(:'organizer', 'Door volunteer', 'crew') ->> 'code' as crew_code \gset
select tests.fails(format('select public.hq_add_staff(%L, %L, %L)', :'organizer', 'X', 'judge'), 'P0001', '2 to 60 characters');
select tests.fails(format('select public.hq_add_staff(%L, %L, %L)', :'organizer', 'Eve', 'admin'), 'P0001', 'organizer, judge or crew');
select public.hq_sign_in(:'judge_code') ->> 'session' as judge \gset
select public.hq_sign_in(:'crew_code') ->> 'session' as crew \gset
select tests.fails(format('select public.hq_event(%L)', :'judge'), '42501');
select tests.fails(format('select public.hq_event(%L)', :'crew'), '42501');
select tests.fails(format('select public.hq_add_staff(%L, %L, %L)', :'judge', 'Eve', 'organizer'), '42501');
select tests.fails(format('select public.hq_projects(%L)', :'crew'), '42501');

-- Judging
select public.hq_projects(:'judge') as projects \gset
select tests.ok(jsonb_array_length(:'projects'::jsonb -> 'projects') = 1, 'judges see the submitted project');
select tests.ok(:'projects'::jsonb -> 'projects' -> 0 -> 'members' = '["An Nguyen", "Binh Tran"]'::jsonb, 'with the names of the team');
select tests.ok(not (:'projects'::jsonb -> 'projects' -> 0 ? 'email'), 'and nothing personal beyond names');
select tests.fails(format('select public.hq_score(%L, %L, 20, 18, 22, 19)', :'judge', '00000000-0000-4000-8000-00000000000a'), 'P0001', 'Judging is closed');
select public.hq_set_switch(:'organizer', 'judging_open', true);
select tests.fails(format('select public.hq_score(%L, %L, 26, 18, 22, 19)', :'judge', '00000000-0000-4000-8000-00000000000a'), 'P0001', 'from 0 to 25');
select tests.fails(format('select public.hq_score(%L, %L, 20, 18, 22, 19)', :'judge', '00000000-0000-4000-8000-00000000000c'), 'P0001', 'not been submitted');
select tests.fails(format('select public.hq_score(%L, %L, 20, 18, 22, 19)', :'organizer', '00000000-0000-4000-8000-00000000000a'), '42501');
select public.hq_score(:'judge', '00000000-0000-4000-8000-00000000000a', 20, 18, 22, 19, ' Strong demo ');
select tests.ok(public.hq_projects(:'judge') -> 'projects' -> 0 -> 'score' ->> 'notes' = 'Strong demo', 'a judge sees their own scores');
select public.hq_score(:'judge', '00000000-0000-4000-8000-00000000000a', 21, 18, 22, 19, 'Strong demo');
select tests.ok(jsonb_array_length(public.hq_event(:'organizer') -> 'scores') = 1, 'saving again updates the same score');
select tests.ok(public.hq_event(:'organizer') -> 'scores' -> 0 ->> 'prototype' = '21', 'organizers see every score');
select public.hq_score(:'judge', '00000000-0000-4000-8000-00000000000a', 21, 18, 22, 19, null, true);
select tests.ok(public.hq_event(:'organizer') -> 'scores' -> 0 ->> 'prototype' is null, 'a conflict of interest clears the scores');
select public.hq_set_switch(:'organizer', 'judging_open', false);
select tests.fails(format('select public.hq_set_switch(%L, %L, true)', :'organizer', 'everything_open'), 'P0001', 'not an event switch');

-- The check-in desk: a QR link, a typed code or an old DC001: pass all work.
select public.hq_pass(:'crew', 'https://dragonconnector.com/app/hq/#/door/DC-AAAA-1111') as card \gset
select tests.ok(:'card'::jsonb ->> 'name' = 'An Nguyen' and :'card'::jsonb ->> 'team' = 'Lantern', 'crew see the name and team');
select tests.ok(:'card'::jsonb ->> 'dietary' is null and :'card'::jsonb ->> 'email' is null, 'but not the email or dietary needs');
select tests.ok(public.hq_pass(:'organizer', 'dc-aaaa-1111') ->> 'dietary' = 'Vegetarian', 'organizers do');
select tests.ok(public.hq_pass(:'crew', 'DC001:DC-BBBB-2222') ->> 'access_needs' = 'Step-free access', 'access needs reach the desk');
select tests.ok(public.hq_pass(:'crew', 'DC-ZZZZ-9999') ->> 'status' = 'not-found', 'an unknown pass');
select tests.ok(public.hq_pass(:'crew', 'hello') ->> 'status' = 'unreadable', 'something that is not a pass');
select tests.fails(format('select public.hq_pass(%L, %L)', :'judge', 'DC-AAAA-1111'), '42501');
select tests.ok((public.hq_check_in(:'crew', 'DC-AAAA-1111') ->> 'already')::boolean = false, 'checked in');
select tests.ok((public.hq_check_in(:'crew', 'DC-AAAA-1111') ->> 'already')::boolean = true, 'a second scan says so');
select tests.fails(format('select public.hq_undo_check_in(%L, %L)', :'crew', 'DC-AAAA-1111'), '42501');
select tests.ok(public.hq_undo_check_in(:'organizer', 'DC-AAAA-1111') ->> 'checked_in_at' is null, 'organizers can undo a check-in');
select public.hq_check_in(:'organizer', 'DC-AAAA-1111');

-- Replies reach the builder's private line as the organizers.
select public.hq_reply(:'organizer', :'thread', '  Yes, at the back of the building.  ');
select tests.fails(format('select public.hq_reply(%L, %L, %L)', :'organizer', :'thread', '   '), 'P0001', 'up to 1,000 characters');
select tests.fails(format('select public.hq_reply(%L, %L, %L)', :'organizer', gen_random_uuid(), 'Hi'), 'P0001', 'not in the organizer inbox');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
select tests.ok((select body from public.messages where from_organizers) = 'Yes, at the back of the building.', 'the builder reads the reply');
set request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
select tests.ok(not exists (select 1 from public.messages where from_organizers), 'and nobody else does');
set role anon;

-- Announcements: now or scheduled
select public.hq_announce(:'organizer', 'Doors open at 08:30.') ->> 'id' as announcement \gset
select public.hq_announce(:'organizer', 'Judging starts soon.', now() + interval '1 day');
select tests.ok((select count(*) from public.announcements) = 4, 'builders see published announcements, not scheduled ones');
select public.hq_edit_announcement(:'organizer', :'announcement', 'Doors open at 08:15.', null);
select tests.ok(exists (select 1 from public.announcements where body = 'Doors open at 08:15.'), 'announcements can be corrected');
select public.hq_delete_announcement(:'organizer', :'announcement');
select tests.ok((select count(*) from public.announcements) = 3, 'and deleted');
select tests.fails(format('select public.hq_announce(%L, %L)', :'judge', 'Hi'), '42501');

-- Switches and the venue code
select public.hq_set_switch(:'organizer', 'registration_open', true);
select tests.ok((select registration_open from public.event_settings), 'registration opens for builders');
select tests.ok(public.hq_set_check_in_code(:'organizer', ' dragon 2026 ') = 'DRAGON 2026', 'the venue code is saved');
select tests.fails(format('select public.hq_set_check_in_code(%L, %L)', :'organizer', 'x'), 'P0001', '4 to 40');
reset role;
select tests.ok((select check_in_code from public.event_secrets) = 'DRAGON 2026', 'where self check-in reads it');
set role anon;

-- Sponsors and the waitlist
select public.hq_update_inquiry(:'organizer', (public.hq_event(:'organizer') -> 'inquiries' -> 0 ->> 'id')::bigint, 'talking', 'Call booked for Friday');
select tests.ok(public.hq_event(:'organizer') -> 'inquiries' -> 0 ->> 'status' = 'talking', 'enquiries move through the pipeline');
select tests.fails(format('select public.hq_update_inquiry(%L, 1, %L, null)', :'organizer', 'maybe'), 'P0001', 'from the list');
select public.hq_remove_waitlist(:'organizer', (public.hq_event(:'organizer') -> 'waitlist' -> 0 ->> 'id')::bigint);
select tests.ok(jsonb_array_length(public.hq_event(:'organizer') -> 'waitlist') = 0, 'a waitlist entry can be removed on request');

-- New codes and revoking
select public.hq_new_code(:'organizer', (public.hq_me(:'judge') ->> 'id')::uuid) ->> 'code' as new_judge_code \gset
select tests.fails(format('select public.hq_me(%L)', :'judge'), '28000');
select tests.ok(public.hq_sign_in(:'judge_code') ->> 'status' = 'wrong-code', 'the old code stops working');
select public.hq_sign_in(:'new_judge_code') ->> 'session' as judge \gset
select public.hq_new_code(:'organizer', (public.hq_me(:'organizer') ->> 'id')::uuid) ->> 'code' as organizer_code \gset
select tests.ok(public.hq_me(:'organizer') ->> 'name' = 'Matt Sim', 'organizers renewing their own code stay signed in');
select public.hq_revoke_staff(:'organizer', (public.hq_me(:'judge') ->> 'id')::uuid);
select tests.fails(format('select public.hq_me(%L)', :'judge'), '28000');
select tests.ok(public.hq_sign_in(:'new_judge_code') ->> 'status' = 'wrong-code', 'a revoked code is refused');
select tests.ok(jsonb_array_length(public.hq_event(:'organizer') -> 'scores') = 1, 'their scores stay');
select tests.fails(format('select public.hq_revoke_staff(%L, %L)', :'organizer', public.hq_me(:'organizer') ->> 'id'), 'P0001', 'cannot revoke yourself');

-- Sessions end when they expire or the staff member signs out.
reset role;
update public.staff_sessions set expires_at = now() - interval '1 second'
where staff_id = (select id from public.staff where name = 'Door volunteer');
set role anon;
select tests.fails(format('select public.hq_pass(%L, %L)', :'crew', 'DC-AAAA-1111'), '28000');
select public.hq_sign_out(:'organizer');
select tests.fails(format('select public.hq_event(%L)', :'organizer'), '28000');
reset role;

-- Builders gain nothing: their own access is unchanged.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
select tests.fails($$select * from public.staff$$, '42501');
select tests.ok((select count(*) from public.registrations) = 1, 'a builder still sees only their own registration');
select tests.ok((select count(*) from public.submissions) = 0, 'and only their own submission');
reset role;
