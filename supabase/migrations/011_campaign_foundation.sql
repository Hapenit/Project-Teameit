create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  channel text not null, -- 'whatsapp', 'email', 'sms'
  status text default 'draft', -- 'draft', 'scheduled', 'running', 'completed', 'failed'
  target_criteria jsonb default '{}'::jsonb, -- e.g., { "tags": ["vip"] }
  message_payload jsonb not null, -- the content/template to send
  scheduled_for timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.campaign_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text default 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  error_message text,
  external_message_id text, -- ID from the provider (e.g. WhatsApp Message ID)
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.campaigns enable row level security;
alter table public.campaign_jobs enable row level security;

create policy "Users can view campaigns in their tenants"
  on public.campaigns for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = campaigns.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view campaign jobs in their tenants"
  on public.campaign_jobs for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = campaign_jobs.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );
