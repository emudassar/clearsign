-- Run in Supabase SQL editor if you see: column profiles.usage_month does not exist

alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists analyses_used integer not null default 0;
alter table public.profiles add column if not exists usage_month text not null default to_char(timezone('utc', now()), 'YYYY-MM');
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
