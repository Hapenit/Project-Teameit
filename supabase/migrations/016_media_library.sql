create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.media_assets enable row level security;

create policy "Users can view media in their tenants"
  on public.media_assets for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = media_assets.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can insert media in their tenants"
  on public.media_assets for insert
  with check (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = media_assets.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can delete media in their tenants"
  on public.media_assets for delete
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = media_assets.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );
