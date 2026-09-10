create table public.tenant_onboarding (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  current_step integer default 1,
  status text default 'not_started',
  business_setup_completed boolean default false,
  preferences_setup_completed boolean default false,
  team_setup_completed boolean default false,
  crm_setup_completed boolean default false,
  integration_setup_completed boolean default false,
  notification_setup_completed boolean default false,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role_id uuid references public.roles(id),
  team_id uuid references public.teams(id),
  invited_by uuid references public.users(id),
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
