-- Sponsor enquiries from the website's "Become a sponsor" form (dragonconnector.vercel.app/sponsors).
-- Like the waitlist, the table is never readable by clients: the form writes through
-- submit_sponsor_inquiry(), and the organizers read the table in the Supabase dashboard.

create table public.sponsor_inquiries (
  id bigint generated always as identity primary key,
  company text not null check (char_length(btrim(company)) between 2 and 120),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  email text not null check (email = lower(email) and char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  tier text not null default 'unsure' check (tier in ('dragon', 'track', 'prize', 'inkind', 'unsure')),
  message text check (message is null or char_length(message) <= 2000),
  lang text not null default 'en' check (lang in ('en', 'vi')),
  page text check (page is null or char_length(page) <= 200),
  created_at timestamptz not null default now()
);
alter table public.sponsor_inquiries enable row level security;
revoke all on public.sponsor_inquiries from anon, authenticated;

-- Accepts an enquiry; a burst of more than 20 in ten minutes is refused, so the form cannot flood it.
create function public.submit_sponsor_inquiry(
  inquiry_company text,
  inquiry_name text,
  inquiry_email text,
  inquiry_tier text default 'unsure',
  inquiry_message text default null,
  inquiry_lang text default 'en',
  inquiry_page text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.sponsor_inquiries where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Too many enquiries just now. Please book a call instead.';
  end if;
  insert into public.sponsor_inquiries (company, name, email, tier, message, lang, page)
  values (btrim(inquiry_company), btrim(inquiry_name), lower(btrim(inquiry_email)), coalesce(nullif(inquiry_tier, ''), 'unsure'),
          nullif(btrim(coalesce(inquiry_message, '')), ''), coalesce(nullif(inquiry_lang, ''), 'en'), inquiry_page);
end $$;

revoke execute on function public.submit_sponsor_inquiry(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_sponsor_inquiry(text, text, text, text, text, text, text) to anon, authenticated;
