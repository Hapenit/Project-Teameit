create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null, -- 'whatsapp', 'instagram', 'facebook', 'google'
  status text default 'pending', -- 'active', 'error', 'pending'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, provider)
);

create table public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  external_account_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table for idempotent webhook processing
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  external_id text unique not null, -- Used for idempotency
  payload jsonb not null,
  status text default 'pending', -- 'pending', 'processed', 'failed'
  error_log text,
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- RLS Policies
alter table public.integrations enable row level security;
alter table public.integration_credentials enable row level security;
-- Webhooks are processed entirely by the backend, so we disable client access
alter table public.webhook_events enable row level security;

create policy "Users can view integrations in their tenants"
  on public.integrations for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = integrations.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view credentials in their tenants"
  on public.integration_credentials for select
  using (
    exists (
      select 1 from public.integrations
      join public.tenant_members on tenant_members.tenant_id = integrations.tenant_id
      where integrations.id = integration_credentials.integration_id
      and tenant_members.user_id = auth.uid()
    )
  );
