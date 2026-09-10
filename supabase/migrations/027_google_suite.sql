-- Google suite connections, OAuth replay protection, and tenant-scoped sync history.
create table public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null,
  state_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.oauth_states enable row level security;
revoke all on public.oauth_states from anon, authenticated;

create table public.google_sync_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running','completed','failed')),
  records_synced integer not null default 0,
  error_message text
);
alter table public.google_sync_runs enable row level security;
create policy "Tenant members view Google sync runs" on public.google_sync_runs for select
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = google_sync_runs.tenant_id and tm.user_id = auth.uid()));

-- Access tokens are server secrets and must never be queryable by browser clients.
drop policy if exists "Users can view credentials in their tenants" on public.integration_credentials;
revoke all on public.integration_credentials from anon, authenticated;

create index if not exists integrations_google_provider_idx on public.integrations(tenant_id, provider, status);
create index if not exists oauth_states_expiry_idx on public.oauth_states(expires_at) where consumed_at is null;
