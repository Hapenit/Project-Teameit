create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  company text,
  lead_status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- contact_identities maps specific channel IDs (like a WhatsApp number or Instagram ID) to the core contact profile
create table public.contact_identities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null, -- 'whatsapp', 'instagram', 'email', 'sms'
  provider_id text not null, -- The unique ID from the provider (e.g. phone number, IG user ID)
  created_at timestamptz default now(),
  unique(tenant_id, provider, provider_id)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now(),
  unique(tenant_id, name)
);

create table public.contact_tags (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  unique(contact_id, tag_id)
);

-- RLS Policies
alter table public.contacts enable row level security;
alter table public.contact_identities enable row level security;
alter table public.tags enable row level security;
alter table public.contact_tags enable row level security;

create policy "Users can view contacts in their tenants"
  on public.contacts for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = contacts.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view contact identities in their tenants"
  on public.contact_identities for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = contact_identities.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view tags in their tenants"
  on public.tags for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = tags.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view contact tags in their tenants"
  on public.contact_tags for select
  using (
    exists (
      select 1 from public.contacts
      join public.tenant_members on tenant_members.tenant_id = contacts.tenant_id
      where contacts.id = contact_tags.contact_id
      and tenant_members.user_id = auth.uid()
    )
  );
