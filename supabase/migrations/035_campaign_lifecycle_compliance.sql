alter table public.campaigns add column if not exists paused_at timestamptz;
alter table public.campaigns add column if not exists cancelled_at timestamptz;
alter table public.campaigns add column if not exists cloned_from uuid references public.campaigns(id);
alter table public.campaigns add column if not exists compliance jsonb not null default '{}'::jsonb;
alter table public.campaign_jobs add column if not exists dedupe_key text;
create unique index if not exists campaign_jobs_dedupe_idx on public.campaign_jobs(campaign_id, dedupe_key) where dedupe_key is not null;
create table if not exists public.sms_compliance_profiles (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  region text not null, principal_entity_id text, sender_id text, template_id text, consent_text text,
  registration_status text not null default 'unverified', metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(tenant_id, region)
);
alter table public.sms_compliance_profiles enable row level security;
create policy "Users can manage SMS compliance in their tenants" on public.sms_compliance_profiles for all
using (exists (select 1 from public.tenant_members tm where tm.tenant_id=sms_compliance_profiles.tenant_id and tm.user_id=auth.uid()))
with check (exists (select 1 from public.tenant_members tm where tm.tenant_id=sms_compliance_profiles.tenant_id and tm.user_id=auth.uid()));
