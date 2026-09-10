create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  phone text,
  timezone text default 'UTC',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  website text,
  business_email text,
  business_phone text,
  country text,
  state text,
  city text,
  industry text,
  business_type text,
  timezone text default 'UTC',
  currency text default 'USD',
  language text default 'en',
  status text default 'trial',
  onboarding_status text default 'not_started',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid, -- Will reference roles table
  status text default 'active',
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, user_id)
);

create index idx_tenant_members_tenant on public.tenant_members(tenant_id);
create index idx_tenant_members_user on public.tenant_members(user_id);
