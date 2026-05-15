-- ClearSign: align public.contracts with the app (run once in Supabase SQL Editor).
-- Fixes PGRST204 missing column errors when contracts was created without every column.

alter table public.contracts add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.contracts add column if not exists title text;
alter table public.contracts add column if not exists party text;
alter table public.contracts add column if not exists mime_type text;
alter table public.contracts add column if not exists raw_text text;
alter table public.contracts add column if not exists analysis jsonb;
alter table public.contracts add column if not exists created_at timestamptz default now();

update public.contracts
set party = coalesce(nullif(trim(party), ''), 'Unknown')
where party is null;

update public.contracts
set raw_text = coalesce(raw_text, '')
where raw_text is null;

update public.contracts
set analysis = coalesce(analysis, '{}'::jsonb)
where analysis is null;

-- Allow inserts without a DB `party` column (party also stored in analysis._clearsign)
do $$
begin
  alter table public.contracts alter column party drop not null;
exception
  when undefined_column then null;
  when undefined_object then null;
end $$;
