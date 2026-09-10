create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, name)
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null,
  color text default 'gray',
  stage_order integer not null default 0,
  created_at timestamptz default now()
);

-- Add stage reference to contacts
alter table public.contacts
add column if not exists pipeline_stage_id uuid references public.pipeline_stages(id) on delete set null;

-- RLS Policies
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;

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
