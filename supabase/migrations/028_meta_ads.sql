create table if not exists public.meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  external_id text not null,
  account_id text not null,
  name text not null,
  status text not null default 'unknown',
  currency text,
  timezone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, external_id)
);
create index if not exists meta_ad_accounts_tenant_idx on public.meta_ad_accounts(tenant_id);
alter table public.meta_ad_accounts enable row level security;
create policy "Users can view Meta ad accounts in their tenants" on public.meta_ad_accounts for select using (
  exists (select 1 from public.tenant_members tm where tm.tenant_id = meta_ad_accounts.tenant_id and tm.user_id = auth.uid())
);
create policy "Users can manage Meta ad accounts in their tenants" on public.meta_ad_accounts for all using (
  exists (select 1 from public.tenant_members tm where tm.tenant_id = meta_ad_accounts.tenant_id and tm.user_id = auth.uid())
);
-- Service-role syncs write through RLS; clients never receive access tokens.
comment on table public.meta_ad_accounts is 'Tenant-scoped Meta Marketing API accounts discovered from OAuth; credentials remain server-side.';
