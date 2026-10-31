-- The app talks to the REST API only. Removing the unused GraphQL API keeps the schema out of a
-- second public interface (the data was already protected by row-level security either way).
drop extension if exists pg_graphql;

-- Covers the teams.owner_id foreign key (owner checks and account deletion).
create index if not exists teams_owner_idx on public.teams (owner_id);
