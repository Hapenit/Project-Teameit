-- Migration 023: RLS policies for tables missing tenant isolation
-- These tables were created with RLS enabled but had no policies defined,
-- meaning queries from authenticated users would return 0 rows (silent failure).

-- ============================================================
-- CAMPAIGNS
-- ============================================================
drop policy if exists "Users can view campaigns in their tenants" on public.campaigns;
create policy "Users can view campaigns in their tenants"
  on public.campaigns for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = campaigns.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- CAMPAIGN JOBS
-- ============================================================
-- Enable RLS first (not enabled in original migration)
alter table public.campaign_jobs enable row level security;

drop policy if exists "Users can view campaign jobs in their tenants" on public.campaign_jobs;
create policy "Users can view campaign jobs in their tenants"
  on public.campaign_jobs for select
  using (
    exists (
      select 1 from public.campaigns
      join public.tenant_members on tenant_members.tenant_id = campaigns.tenant_id
      where campaigns.id = campaign_jobs.campaign_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- POSTS (Publishing)
-- ============================================================
-- Enable RLS first
alter table public.posts enable row level security;

drop policy if exists "Users can view posts in their tenants" on public.posts;
create policy "Users can view posts in their tenants"
  on public.posts for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = posts.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- WORKFLOWS (Automations)
-- ============================================================
alter table public.workflows enable row level security;

drop policy if exists "Users can view workflows in their tenants" on public.workflows;
drop policy if exists "Users can view workflows in their tenants" on public.workflows;
create policy "Users can view workflows in their tenants"
  on public.workflows for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = workflows.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- WORKFLOW EXECUTIONS
-- ============================================================
alter table public.workflow_executions enable row level security;

drop policy if exists "Users can view workflow executions in their tenants" on public.workflow_executions;
drop policy if exists "Users can view workflow executions in their tenants" on public.workflow_executions;
create policy "Users can view workflow executions in their tenants"
  on public.workflow_executions for select
  using (
    exists (
      select 1 from public.workflows
      join public.tenant_members on tenant_members.tenant_id = workflows.tenant_id
      where workflows.id = workflow_executions.workflow_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- AD METRICS
-- ============================================================
alter table public.ad_metrics enable row level security;

drop policy if exists "Users can view ad_metrics in their tenants" on public.ad_metrics;
create policy "Users can view ad metrics in their tenants"
  on public.ad_metrics for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = ad_metrics.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- MEDIA LIBRARY
-- ============================================================
alter table public.media_assets enable row level security;

drop policy if exists "Users can view media in their tenants" on public.media_assets;
create policy "Users can view media assets in their tenants"
  on public.media_assets for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = media_assets.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- PIPELINES & STAGES
-- ============================================================
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;

drop policy if exists "Users can view pipelines in their tenants" on public.pipelines;
create policy "Users can view pipelines in their tenants"
  on public.pipelines for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = pipelines.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view pipeline stages in their tenants"
  on public.pipeline_stages for select
  using (
    exists (
      select 1 from public.pipelines
      join public.tenant_members on tenant_members.tenant_id = pipelines.tenant_id
      where pipelines.id = pipeline_stages.pipeline_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- CONTACT NOTES & TASKS
-- ============================================================
alter table public.contact_notes enable row level security;
alter table public.contact_tasks enable row level security;

create policy "Users can view contact notes in their tenants"
  on public.contact_notes for select
  using (
    exists (
      select 1 from public.contacts
      join public.tenant_members on tenant_members.tenant_id = contacts.tenant_id
      where contacts.id = contact_notes.contact_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view contact tasks in their tenants"
  on public.contact_tasks for select
  using (
    exists (
      select 1 from public.contacts
      join public.tenant_members on tenant_members.tenant_id = contacts.tenant_id
      where contacts.id = contact_tasks.contact_id
      and tenant_members.user_id = auth.uid()
    )
  );
