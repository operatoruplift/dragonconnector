-- This Supabase project previously hosted an unrelated prototype. Its tables were empty and it is
-- no longer needed, so its sign-up trigger, functions and tables are removed. Safe on a fresh
-- project: every statement is guarded.
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.achievements, public.agents, public.event_analytics, public.events,
  public.missions, public.participants, public.user_stats, public.profiles cascade;
drop function if exists public.handle_new_user();
drop function if exists public.initialize_user_stats();
drop function if exists public.update_updated_at_column();
