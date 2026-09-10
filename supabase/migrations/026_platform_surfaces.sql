-- Platform surfaces: tenant settings, notifications, reports, audit logs and billing state.
create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_tenant_user_idx on public.notifications(tenant_id, user_id, created_at desc);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid not null references public.users(id),
  name text not null,
  report_type text not null,
  parameters jsonb not null default '{}'::jsonb,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_id uuid references public.users(id),
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_tenant_created_idx on public.audit_logs(tenant_id, created_at desc);
create table public.billing_accounts (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'unconfigured',
  updated_at timestamptz not null default now()
);

alter table public.tenant_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.billing_accounts enable row level security;

create policy "tenant members can read settings" on public.tenant_settings for select using (
  exists (select 1 from public.tenant_members m where m.tenant_id = tenant_settings.tenant_id and m.user_id = auth.uid())
);
create policy "tenant members can read notifications" on public.notifications for select using (
  exists (select 1 from public.tenant_members m where m.tenant_id = notifications.tenant_id and m.user_id = auth.uid())
);
create policy "tenant members can read reports" on public.reports for select using (
  exists (select 1 from public.tenant_members m where m.tenant_id = reports.tenant_id and m.user_id = auth.uid())
);
create policy "tenant members can read audit logs" on public.audit_logs for select using (
  exists (select 1 from public.tenant_members m where m.tenant_id = audit_logs.tenant_id and m.user_id = auth.uid())
);
create policy "tenant members can read billing" on public.billing_accounts for select using (
  exists (select 1 from public.tenant_members m where m.tenant_id = billing_accounts.tenant_id and m.user_id = auth.uid())
);
