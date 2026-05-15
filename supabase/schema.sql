-- ClearSign schema — run in Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'solo', 'pro')),
  analyses_used integer not null default 0,
  usage_month text not null default to_char (timezone ('utc', now()), 'YYYY-MM'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade,
  title text,
  party text,
  mime_type text,
  raw_text text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists contracts_user_id_idx on public.contracts (user_id);

-- Existing DBs: add any missing columns the app expects (idempotent)
alter table public.contracts add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.contracts add column if not exists title text;
alter table public.contracts add column if not exists party text;
alter table public.contracts add column if not exists mime_type text;
alter table public.contracts add column if not exists raw_text text;
alter table public.contracts add column if not exists analysis jsonb;
alter table public.contracts add column if not exists created_at timestamptz default now();

update public.contracts set party = coalesce(nullif(trim(party), ''), 'Unknown') where party is null;
update public.contracts set raw_text = coalesce(raw_text, '') where raw_text is null;
update public.contracts set analysis = coalesce(analysis, '{}'::jsonb) where analysis is null;

do $$
begin
  alter table public.contracts alter column party drop not null;
exception
  when undefined_column then null;
  when undefined_object then null;
end $$;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid (),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_contract_id_idx on public.chat_messages (contract_id);

alter table public.profiles enable row level security;
alter table public.contracts enable row level security;
alter table public.chat_messages enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid () = id);

create policy "profiles_update_own" on public.profiles
for update
using (auth.uid () = id)
with check (auth.uid () = id);

create policy "contracts_select_accessible" on public.contracts for select
using (
  user_id is null
  or auth.uid () = user_id
);

create policy "chat_select_accessible" on public.chat_messages for select using (
  exists (
    select 1
    from public.contracts c
    where
      c.id = chat_messages.contract_id
      and (
        c.user_id is null
        or c.user_id = auth.uid ()
      )
  )
);

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
    values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user ();
