create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  description text,
  unique(module, action)
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  unique(role_id, permission_id)
);

alter table public.tenant_members
add constraint fk_tenant_members_role_id
foreign key (role_id) references public.roles(id);
