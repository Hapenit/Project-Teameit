create table if not exists public.meta_social_comments (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null check (provider in ('instagram','facebook')), external_id text not null,
  parent_external_id text, contact_id uuid references public.contacts(id) on delete set null,
  text text not null default '', status text not null default 'received', payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, provider, external_id)
);
create table if not exists public.meta_keyword_automations (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null check (provider in ('instagram','facebook')), keyword text not null,
  action_type text not null, action_payload jsonb not null default '{}'::jsonb, enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.meta_automation_events (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null, contact_id uuid references public.contacts(id) on delete set null,
  external_id text not null, keyword text not null, action_type text not null, payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_meta_social_comments_tenant_created on public.meta_social_comments(tenant_id, provider, created_at desc);
create index if not exists idx_meta_keyword_automations_tenant_provider on public.meta_keyword_automations(tenant_id, provider, enabled);
create unique index if not exists idx_meta_automation_events_delivery on public.meta_automation_events(tenant_id, provider, external_id, keyword, action_type);
alter table public.meta_social_comments enable row level security;
alter table public.meta_keyword_automations enable row level security;
alter table public.meta_automation_events enable row level security;
create policy "Meta comments tenant access" on public.meta_social_comments for all using (exists (select 1 from public.tenant_members tm where tm.tenant_id = meta_social_comments.tenant_id and tm.user_id = auth.uid()));
create policy "Meta keyword automations tenant access" on public.meta_keyword_automations for all using (exists (select 1 from public.tenant_members tm where tm.tenant_id = meta_keyword_automations.tenant_id and tm.user_id = auth.uid()));
create policy "Meta automation events tenant access" on public.meta_automation_events for select using (exists (select 1 from public.tenant_members tm where tm.tenant_id = meta_automation_events.tenant_id and tm.user_id = auth.uid()));
