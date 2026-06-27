-- Orvex OSINT Fusion - Supabase/PostgreSQL schema
-- Run this file in the Supabase SQL editor.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'orvex_entity_type') then
    create type public.orvex_entity_type as enum ('domain', 'email', 'company', 'wallet', 'person');
  end if;

  if not exists (select 1 from pg_type where typname = 'orvex_case_status') then
    create type public.orvex_case_status as enum ('open', 'in_review', 'closed', 'archived');
  end if;
end
$$;

alter type public.orvex_entity_type add value if not exists 'email';
alter type public.orvex_entity_type add value if not exists 'person';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'orvex_plan_code') then
    create type public.orvex_plan_code as enum ('free', 'starter', 'pro', 'business');
  end if;

  if not exists (select 1 from pg_type where typname = 'orvex_subscription_status') then
    create type public.orvex_subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid');
  end if;
end
$$;

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  entity_type public.orvex_entity_type not null,
  entity_value text not null,
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  status public.orvex_case_status not null default 'open',
  created_at timestamptz not null default now(),
  constraint cases_entity_value_not_blank check (length(trim(entity_value)) > 0)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  action_type text not null,
  target_entity text not null,
  "timestamp" timestamptz not null default now(),
  ip_address inet,
  constraint audit_logs_action_type_not_blank check (length(trim(action_type)) > 0),
  constraint audit_logs_target_entity_not_blank check (length(trim(target_entity)) > 0)
);

create table if not exists public.intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  content_json jsonb not null default '{}'::jsonb,
  ai_summary text,
  sources_cited jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  constraint intelligence_reports_content_is_object check (jsonb_typeof(content_json) = 'object'),
  constraint intelligence_reports_sources_is_array check (jsonb_typeof(sources_cited) = 'array')
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code public.orvex_plan_code not null default 'free',
  status public.orvex_subscription_status not null default 'incomplete',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_stripe_subscription_unique unique (stripe_subscription_id)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_fingerprint text,
  entity_type public.orvex_entity_type not null,
  entity_value text not null,
  event_type text not null default 'analysis',
  created_at timestamptz not null default now(),
  constraint usage_events_entity_value_not_blank check (length(trim(entity_value)) > 0)
);

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_fingerprint text,
  document_version text not null,
  accepted_terms boolean not null default false,
  accepted_privacy boolean not null default false,
  accepted_lawful_use boolean not null default false,
  ip_address inet,
  user_agent text,
  accepted_at timestamptz not null default now(),
  constraint legal_acceptances_has_subject check (user_id is not null or anonymous_fingerprint is not null)
);

create index if not exists cases_user_id_created_at_idx
  on public.cases (user_id, created_at desc);

create index if not exists cases_entity_type_value_idx
  on public.cases (entity_type, lower(entity_value));

create index if not exists cases_status_risk_idx
  on public.cases (status, risk_score desc);

create index if not exists audit_logs_user_id_timestamp_idx
  on public.audit_logs (user_id, "timestamp" desc);

create index if not exists audit_logs_target_entity_idx
  on public.audit_logs (target_entity);

create index if not exists intelligence_reports_case_id_generated_at_idx
  on public.intelligence_reports (case_id, generated_at desc);

create index if not exists subscriptions_user_status_idx
  on public.subscriptions (user_id, status, updated_at desc);

create index if not exists usage_events_user_created_at_idx
  on public.usage_events (user_id, created_at desc);

create index if not exists usage_events_fingerprint_created_at_idx
  on public.usage_events (anonymous_fingerprint, created_at desc);

create index if not exists legal_acceptances_user_version_idx
  on public.legal_acceptances (user_id, document_version, accepted_at desc);

create index if not exists legal_acceptances_fingerprint_version_idx
  on public.legal_acceptances (anonymous_fingerprint, document_version, accepted_at desc);

alter table public.cases enable row level security;
alter table public.audit_logs enable row level security;
alter table public.intelligence_reports enable row level security;
alter table public.user_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;
alter table public.legal_acceptances enable row level security;

drop policy if exists "Users can read their own cases" on public.cases;
create policy "Users can read their own cases"
  on public.cases
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can create their own cases" on public.cases;
create policy "Users can create their own cases"
  on public.cases
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update their own cases" on public.cases;
create policy "Users can update their own cases"
  on public.cases
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can read their own audit logs" on public.audit_logs;
create policy "Users can read their own audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can create their own audit logs" on public.audit_logs;
create policy "Users can create their own audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can read reports for their own cases" on public.intelligence_reports;
create policy "Users can read reports for their own cases"
  on public.intelligence_reports
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.cases
      where cases.id = intelligence_reports.case_id
        and cases.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create reports for their own cases" on public.intelligence_reports;
create policy "Users can create reports for their own cases"
  on public.intelligence_reports
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.cases
      where cases.id = intelligence_reports.case_id
        and cases.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update reports for their own cases" on public.intelligence_reports;
create policy "Users can update reports for their own cases"
  on public.intelligence_reports
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.cases
      where cases.id = intelligence_reports.case_id
        and cases.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.cases
      where cases.id = intelligence_reports.case_id
        and cases.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read their own profile" on public.user_profiles;
create policy "Users can read their own profile"
  on public.user_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
  on public.user_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.user_profiles;
create policy "Users can insert their own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can read their own subscriptions" on public.subscriptions;
create policy "Users can read their own subscriptions"
  on public.subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can read their own usage events" on public.usage_events;
create policy "Users can read their own usage events"
  on public.usage_events
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can read their own legal acceptances" on public.legal_acceptances;
create policy "Users can read their own legal acceptances"
  on public.legal_acceptances
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert their own legal acceptances" on public.legal_acceptances;
create policy "Users can insert their own legal acceptances"
  on public.legal_acceptances
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on table public.cases is 'OSINT investigation cases created by Orvex users.';
comment on table public.audit_logs is 'Immutable compliance trail for user actions and entity access.';
comment on table public.intelligence_reports is 'Generated intelligence reports linked to investigation cases.';
comment on table public.user_profiles is 'Application profile data for Orvex OSINT Fusion users.';
comment on table public.subscriptions is 'Stripe-backed plan status used by the backend paywall.';
comment on table public.usage_events is 'Server-side analysis usage counter for free trials and rate control.';
comment on table public.legal_acceptances is 'Evidence of privacy, terms, and lawful-use acceptance.';
comment on column public.audit_logs.ip_address is 'Client IP captured by trusted backend/edge function when available.';
