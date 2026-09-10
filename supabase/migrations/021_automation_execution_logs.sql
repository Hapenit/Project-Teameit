alter table public.workflow_executions
  add column if not exists error_log text;

create table public.workflow_execution_steps (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.workflow_executions(id) on delete cascade,
  node_id text not null,
  status text not null, -- 'success', 'failed'
  logs jsonb,
  executed_at timestamptz default now()
);

-- RLS
alter table public.workflow_executions enable row level security;
alter table public.workflow_execution_steps enable row level security;

drop policy if exists "Users can view workflow_executions in their tenants" on public.workflow_executions;
create policy "Users can view workflow_executions in their tenants"
  on public.workflow_executions for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = workflow_executions.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view workflow_execution_steps via execution"
  on public.workflow_execution_steps for select
  using (
    exists (
      select 1 from public.workflow_executions e
      join public.tenant_members tm on tm.tenant_id = e.tenant_id
      where e.id = workflow_execution_steps.execution_id
      and tm.user_id = auth.uid()
    )
  );
