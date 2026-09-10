create table public.contact_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table public.contact_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  title text not null,
  status text not null default 'pending', -- 'pending', 'completed'
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- RLS
alter table public.contact_notes enable row level security;
alter table public.contact_tasks enable row level security;

create policy "Users can view notes in their tenants"
  on public.contact_notes for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = contact_notes.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can insert notes in their tenants"
  on public.contact_notes for insert
  with check (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = contact_notes.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view tasks in their tenants"
  on public.contact_tasks for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = contact_tasks.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can modify tasks in their tenants"
  on public.contact_tasks for all
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = contact_tasks.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );
