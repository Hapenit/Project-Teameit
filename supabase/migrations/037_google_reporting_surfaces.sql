-- Durable, tenant-scoped records for Google reports and resumable uploads.
-- Payloads are provider responses only; no synthetic metrics are inserted.
create table public.google_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null check (provider in ('google_ads','google_analytics','google_search_console','google_adsense','youtube','google_business')),
  report_type text not null,
  parameters jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
create index google_report_snapshots_tenant_fetched_idx
  on public.google_report_snapshots(tenant_id, fetched_at desc);
alter table public.google_report_snapshots enable row level security;
create policy "Tenant members view Google reports" on public.google_report_snapshots
  for select using (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = google_report_snapshots.tenant_id and tm.user_id = auth.uid()
  ));

create table public.youtube_uploads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  upload_url text not null,
  video_id text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'initialized'
    check (status in ('initialized','uploaded','failed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.youtube_uploads enable row level security;
create policy "Tenant members view YouTube uploads" on public.youtube_uploads
  for select using (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = youtube_uploads.tenant_id and tm.user_id = auth.uid()
  ));
