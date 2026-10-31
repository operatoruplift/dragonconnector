-- "Delete my data" also removes the anonymous account itself, so nothing is left behind. Only
-- anonymous accounts (the kind this app creates) are deleted; any other account keeps its login.
create or replace function public.delete_my_data() returns void
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
  delete from auth.users where id = me and is_anonymous;
end $$;
