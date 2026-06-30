-- Quotely production data schema
-- Run this in Supabase SQL Editor after Supabase Auth is configured.

create table if not exists public.quotely_quotations (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  quotation_number text not null,
  status text not null default 'Draft',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.quotely_service_templates (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  description text not null default '',
  price numeric(14, 2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.quotely_business_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.quotely_profile_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_image text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists quotely_quotations_user_updated_idx
  on public.quotely_quotations (user_id, updated_at desc);

create index if not exists quotely_quotations_user_status_idx
  on public.quotely_quotations (user_id, status);

create unique index if not exists quotely_quotations_user_number_idx
  on public.quotely_quotations (user_id, quotation_number);

create index if not exists quotely_service_templates_user_updated_idx
  on public.quotely_service_templates (user_id, updated_at desc);

alter table public.quotely_quotations enable row level security;
alter table public.quotely_service_templates enable row level security;
alter table public.quotely_business_settings enable row level security;
alter table public.quotely_profile_settings enable row level security;

grant select, insert, update, delete on public.quotely_quotations to authenticated;
grant select, insert, update, delete on public.quotely_service_templates to authenticated;
grant select, insert, update, delete on public.quotely_business_settings to authenticated;
grant select, insert, update, delete on public.quotely_profile_settings to authenticated;

drop policy if exists "Users manage their own quotations" on public.quotely_quotations;
create policy "Users manage their own quotations"
  on public.quotely_quotations
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own service templates" on public.quotely_service_templates;
create policy "Users manage their own service templates"
  on public.quotely_service_templates
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own business settings" on public.quotely_business_settings;
create policy "Users manage their own business settings"
  on public.quotely_business_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own profile settings" on public.quotely_profile_settings;
create policy "Users manage their own profile settings"
  on public.quotely_profile_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
