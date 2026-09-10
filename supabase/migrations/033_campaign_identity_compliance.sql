-- Harden campaign delivery, identity deduplication and provider event ingestion.
alter table public.campaigns add constraint campaigns_status_check
  check (status in ('draft','scheduled','running','paused','completed','failed','cancelled'));
alter table public.campaign_jobs add constraint campaign_jobs_status_check
  check (status in ('pending','sent','delivered','read','failed','skipped','cancelled'));

create unique index if not exists contacts_tenant_email_ci
  on public.contacts (tenant_id, lower(email)) where email is not null;
create unique index if not exists contacts_tenant_phone
  on public.contacts (tenant_id, phone) where phone is not null;

alter table public.campaign_events enable row level security;
drop policy if exists "Users can manage campaigns in their tenants" on public.campaigns;
create policy "Users can manage campaigns in their tenants" on public.campaigns for all
  using (exists (select 1 from public.tenant_members tm
    where tm.tenant_id = campaigns.tenant_id and tm.user_id = auth.uid()))
  with check (exists (select 1 from public.tenant_members tm
    where tm.tenant_id = campaigns.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "Users can view campaign jobs by tenant" on public.campaign_jobs;
create policy "Users can view campaign jobs by tenant" on public.campaign_jobs for select
  using (exists (select 1 from public.tenant_members tm
    where tm.tenant_id = campaign_jobs.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "Users can insert campaign events in their tenants" on public.campaign_events;
create policy "Users can insert campaign events in their tenants" on public.campaign_events for insert
  with check (exists (select 1 from public.tenant_members tm
    where tm.tenant_id = campaign_events.tenant_id and tm.user_id = auth.uid()));

create index if not exists campaign_events_external_id_idx
  on public.campaign_events (external_id) where external_id is not null;
