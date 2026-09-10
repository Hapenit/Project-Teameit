-- Enable Row Level Security on core tables
alter table public.users enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tenant_onboarding enable row level security;
alter table public.tenant_invitations enable row level security;

-- USERS TABLE
-- Users can read their own profile
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- TENANTS TABLE
-- Users can read tenants they are members of
create policy "Users can view their tenants"
  on public.tenants for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = tenants.id
      and tenant_members.user_id = auth.uid()
    )
  );

-- TENANT MEMBERS TABLE
-- Users can view members of their own tenants
create policy "Users can view members of their tenants"
  on public.tenant_members for select
  using (
    exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = tenant_members.tenant_id
      and tm.user_id = auth.uid()
    )
  );

-- ROLES TABLE
-- Users can view roles for their tenants
create policy "Users can view roles of their tenants"
  on public.roles for select
  using (
    tenant_id is null or
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = roles.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- Note: In this architecture, all insert/update/delete operations for tenants and members
-- are handled exclusively by the backend API using the Supabase Service Role Key.
-- Client-side operations are restricted to read-only for these core administrative tables.
