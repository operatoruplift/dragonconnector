-- Teams have at most 4 people. Pending invitations hold a seat until they are answered, and the
-- team row is locked while seats are counted, so two invitations at once cannot pass the limit.
create or replace function public.invite_to_team(team uuid, invitee uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Sign in first.'; end if;
  perform 1 from public.teams where id = team and owner_id = me for update;
  if not found then raise exception 'Only the team creator can invite people.'; end if;
  if invitee = me then raise exception 'You are already in this team.'; end if;
  if not exists (select 1 from public.profiles where id = invitee and discoverable) then raise exception 'That builder is not available.'; end if;
  if exists (select 1 from public.team_members where team_id = team and user_id = invitee) then return; end if;
  if (select count(*) from public.team_members where team_id = team) >= 4 then
    raise exception 'Teams have up to 4 people, so this team is full.';
  end if;
  if (select count(*) from public.team_members where invited_by = me and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'You have sent a lot of invitations. Try again later.';
  end if;
  insert into public.team_members (team_id, user_id, status, invited_by) values (team, invitee, 'invited', me)
  on conflict (team_id, user_id) do nothing;
end $$;

create or replace function public.respond_to_invitation(team uuid, accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Sign in first.'; end if;
  perform 1 from public.teams where id = team for update;
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
  if (select count(*) from public.team_members where team_id = team and status = 'joined') >= 4 then
    raise exception 'This team already has 4 people.';
  end if;
  update public.team_members set status = 'joined' where team_id = team and user_id = me;
  insert into public.conversation_members (conversation_id, user_id)
  select conversation_id, me from public.teams where id = team
  on conflict do nothing;
end $$;
