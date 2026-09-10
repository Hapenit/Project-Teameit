-- Tenant-scoped WhatsApp Cloud API state and delivery receipts.
alter table public.webhook_events add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
create index if not exists idx_webhook_events_tenant on public.webhook_events(tenant_id, provider, created_at desc);
alter table public.integration_credentials
  add column if not exists provider_account_status text,
  add column if not exists last_verified_at timestamptz;

create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  waba_id text not null,
  template_id text,
  name text not null,
  language text not null,
  category text,
  status text not null default 'PENDING',
  components jsonb not null default '[]'::jsonb,
  rejected_reason text,
  synced_at timestamptz not null default now(),
  unique (tenant_id, waba_id, name, language)
);

create table if not exists public.whatsapp_delivery_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  external_message_id text not null,
  recipient_id text,
  status text not null,
  errors jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, external_message_id, status)
);

create index if not exists idx_whatsapp_delivery_tenant on public.whatsapp_delivery_events(tenant_id, occurred_at desc);
alter table public.whatsapp_templates enable row level security;
alter table public.whatsapp_delivery_events enable row level security;

create policy "Users can view WhatsApp templates in their tenants"
  on public.whatsapp_templates for select using (exists (
    select 1 from public.tenant_members tm where tm.tenant_id = whatsapp_templates.tenant_id and tm.user_id = auth.uid()
  ));
create policy "Users can view WhatsApp delivery events in their tenants"
  on public.whatsapp_delivery_events for select using (exists (
    select 1 from public.tenant_members tm where tm.tenant_id = whatsapp_delivery_events.tenant_id and tm.user_id = auth.uid()
  ));
