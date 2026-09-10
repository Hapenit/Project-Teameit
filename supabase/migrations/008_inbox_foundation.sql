create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel text not null, -- 'whatsapp', 'instagram', 'messenger', 'email', 'sms'
  channel_identity_id uuid references public.contact_identities(id) on delete set null,
  status text default 'open', -- 'open', 'resolved', 'snoozed'
  assigned_to uuid references public.users(id) on delete set null,
  unread_count integer default 0,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null, -- 'contact', 'agent', 'bot', 'system'
  sender_id uuid, -- nullable (null if contact, populated if agent)
  content text,
  message_type text default 'text', -- 'text', 'image', 'video', 'document', 'template', 'interactive'
  external_id text, -- ID from the provider (e.g. WhatsApp message ID)
  status text default 'sent', -- 'sending', 'sent', 'delivered', 'read', 'failed'
  created_at timestamptz default now()
);

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_url text not null,
  file_type text not null,
  file_size integer,
  created_at timestamptz default now()
);

-- Indexes for performance on inbox loading
create index idx_conversations_tenant_status on public.conversations(tenant_id, status);
create index idx_messages_conversation_id on public.messages(conversation_id);

-- RPC for safely incrementing unread count
create or replace function public.increment_unread_count(row_id uuid)
returns void as $$
begin
  update public.conversations
  set unread_count = unread_count + 1, last_message_at = now()
  where id = row_id;
end;
$$ language plpgsql;

-- RLS Policies
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;

create policy "Users can view conversations in their tenants"
  on public.conversations for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = conversations.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view messages in their tenants"
  on public.messages for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = messages.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view attachments in their tenants"
  on public.message_attachments for select
  using (
    exists (
      select 1 from public.messages
      join public.tenant_members on tenant_members.tenant_id = messages.tenant_id
      where messages.id = message_attachments.message_id
      and tenant_members.user_id = auth.uid()
    )
  );
