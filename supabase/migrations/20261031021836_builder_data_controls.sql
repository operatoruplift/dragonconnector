-- Builders can take back what they shared: their waitlist entry (when they joined from the app with
-- a session) and, in one step, everything else.

alter table public.waitlist add column user_id uuid references auth.users (id) on delete set null;
create index waitlist_user_idx on public.waitlist (user_id);

create or replace function public.join_waitlist(entry_name text, entry_email text, entry_role text, entry_track text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.waitlist (name, email, role, track, user_id)
  values (btrim(entry_name), lower(btrim(entry_email)), entry_role, nullif(entry_track, ''), (select auth.uid()))
  on conflict (email) do nothing;
end $$;

create function public.leave_waitlist() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Sign in first.'; end if;
  delete from public.waitlist where user_id = (select auth.uid());
end $$;

-- Removes this builder's profile, registration, submission, check-in, messages and memberships.
-- Teams they created are disbanded; other people's messages stay with them.
create function public.delete_my_data() returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Sign in first.'; end if;
  delete from public.conversations where id in (select conversation_id from public.teams where owner_id = me);
  delete from public.team_members where user_id = me;
  delete from public.messages where sender_id = me;
  delete from public.conversation_members where user_id = me;
  delete from public.conversations c where c.kind <> 'team' and not exists (select 1 from public.conversation_members m where m.conversation_id = c.id);
  delete from public.submissions where owner_id = me;
  delete from public.registrations where user_id = me;
  delete from public.check_ins where user_id = me;
  delete from public.check_in_attempts where user_id = me;
  delete from public.waitlist where user_id = me;
  delete from public.profiles where id = me;
end $$;

revoke execute on function public.leave_waitlist(), public.delete_my_data() from public, anon;
grant execute on function public.leave_waitlist(), public.delete_my_data() to authenticated;
