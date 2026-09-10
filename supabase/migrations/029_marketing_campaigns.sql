-- Production email/SMS campaign capabilities and consent/audit state.
alter table public.contacts
  add column if not exists email_opt_out boolean not null default false,
  add column if not exists sms_opt_out boolean not null default false,
  add column if not exists email_consent_at timestamptz,
  add column if not exists sms_consent_at timestamptz,
  add column if not exists consent_source text;

alter table public.campaigns
  add column if not exists sender_name text,
  add column if not exists sender_email text,
  add column if not exists reply_to text,
  add column if not exists template_id uuid,
  add column if not exists content_html text,
  add column if not exists content_text text,
  add column if not exists unsubscribe_url text,
  add column if not exists provider text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.campaign_jobs
  add column if not exists attempts integer not null default 0,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists clicked_at timestamptz,
  add column if not exists opted_out_at timestamptz;

create table if not exists public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  job_id uuid references public.campaign_jobs(id) on delete cascade,
  event_type text not null,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique(campaign_id, job_id, event_type, external_id)
);

create table if not exists public.campaign_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('email','sms')),
  subject text,
  content_html text,
  content_text text not null,
  variables jsonb not null default '[]'::jsonb,
  provider_template_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campaign_events enable row level security;
alter table public.campaign_templates enable row level security;
create policy "Users can view campaign events in their tenants" on public.campaign_events for select
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = campaign_events.tenant_id and tm.user_id = auth.uid()));
create policy "Users can manage campaign templates in their tenants" on public.campaign_templates for all
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = campaign_templates.tenant_id and tm.user_id = auth.uid()))
  with check (exists (select 1 from public.tenant_members tm where tm.tenant_id = campaign_templates.tenant_id and tm.user_id = auth.uid()));
