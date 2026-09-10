create table public.ad_metrics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null, -- 'google', 'facebook'
  date date not null,
  spend numeric(10,2) not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  conversions integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, provider, date)
);

-- RLS Policies
alter table public.ad_metrics enable row level security;

create policy "Users can view ad_metrics in their tenants"
  on public.ad_metrics for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = ad_metrics.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can modify ad_metrics in their tenants"
  on public.ad_metrics for all
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = ad_metrics.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );
