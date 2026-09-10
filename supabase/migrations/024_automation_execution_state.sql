-- Durable state for delayed and retryable workflow executions.
alter table public.workflow_executions
  add column if not exists next_node_id text,
  add column if not exists resume_at timestamptz,
  add column if not exists retry_count integer not null default 0,
  add column if not exists max_retries integer not null default 3,
  add column if not exists execution_context jsonb not null default '{}'::jsonb;

create index if not exists idx_workflow_executions_due
  on public.workflow_executions(status, resume_at)
  where status = 'suspended';
