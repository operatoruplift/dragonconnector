-- Reopening an existing direct chat should work even if the other builder has since hidden their
-- profile, so look for the conversation before checking who is discoverable.
create or replace function public.start_direct(other uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  pair text;
  chat uuid;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if other = me then raise exception 'You cannot message yourself.'; end if;
  pair := 'direct:' || least(me::text, other::text) || ':' || greatest(me::text, other::text);
  select id into chat from public.conversations where pair_key = pair;
  if chat is not null then return chat; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'Create your builder profile first.'; end if;
  if not exists (select 1 from public.profiles where id = other and discoverable) then raise exception 'That builder is not available.'; end if;
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
