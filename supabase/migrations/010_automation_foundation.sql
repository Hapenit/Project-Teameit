create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  status text default 'draft', -- 'draft', 'active', 'paused'
  trigger_type text not null, -- 'incoming_message', 'new_contact', 'tag_added', 'schedule'
  graph_json jsonb not null default '{}'::jsonb, -- Stores the React Flow nodes and edges
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  trigger_event jsonb not null, -- The payload that triggered it
  status text default 'running', -- 'running', 'completed', 'failed'
  execution_log jsonb default '[]'::jsonb, -- Array of node execution results
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- RLS Policies
alter table public.workflows enable row level security;
alter table public.workflow_executions enable row level security;

create policy "Users can view workflows in their tenants"
  on public.workflows for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = workflows.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view workflow executions in their tenants"
  on public.workflow_executions for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = workflow_executions.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );
