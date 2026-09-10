create table public.teams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(team_id, user_id)
);
