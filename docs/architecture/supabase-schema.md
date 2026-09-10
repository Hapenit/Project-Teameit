# Teameit — Supabase Database Schema v1.0

This is the next implementation artifact. It locks the **database foundation** for:

**Authentication → Tenant → Onboarding → Teams → Roles → Permissions → CRM → Integrations → Audit**

I recommend implementing these tables first before building WhatsApp, Instagram, campaigns, or automation.

## 1. Database architecture

```text
auth.users  [Supabase Auth]
     │
     ▼
users
     │
     ▼
tenant_members
     │
     ├──────────► tenants
     │                │
     │                ├── tenant_onboarding
     │                ├── teams
     │                ├── roles
     │                ├── contacts
     │                ├── leads
     │                └── integrations
     │
     └──────────► roles
```

---

# 2. Core tables

## `users`

Application profile linked 1:1 to `auth.users`.

```sql
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
```

**Important:** no password column.

---

## `tenants`

```sql
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
```

---

## `tenant_members`

This is the key table connecting users and businesses.

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,
user_id uuid not null references users(id) on delete cascade,
role_id uuid,
status text default 'active',
joined_at timestamptz default now(),
created_at timestamptz default now(),
updated_at timestamptz default now(),

unique (tenant_id, user_id)
```

---

# 3. Roles and permissions

## `roles`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid references tenants(id) on delete cascade,
name text not null,
description text,
is_system boolean default false,
created_at timestamptz default now(),
updated_at timestamptz default now()
```

System roles can include:

```text
Owner
Admin
Manager
Marketing Manager
Sales Manager
Agent
Analyst
```

---

## `permissions`

```sql
id uuid primary key default gen_random_uuid(),
module text not null,
action text not null,
description text,
unique(module, action)
```

Examples:

```text
contacts.view
contacts.create
contacts.edit
contacts.delete

campaigns.view
campaigns.create
campaigns.edit
campaigns.publish

automations.view
automations.create
automations.edit
automations.publish

integrations.view
integrations.connect
integrations.disconnect
```

---

## `role_permissions`

```sql
id uuid primary key default gen_random_uuid(),
role_id uuid not null references roles(id) on delete cascade,
permission_id uuid not null references permissions(id) on delete cascade,
unique(role_id, permission_id)
```

---

# 4. Tenant onboarding

## `tenant_onboarding`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null unique references tenants(id) on delete cascade,

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
```

---

# 5. Tenant invitations

## `tenant_invitations`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,

email text not null,
role_id uuid references roles(id),
team_id uuid,

invited_by uuid references users(id),

token_hash text not null,
expires_at timestamptz not null,
accepted_at timestamptz,

status text default 'pending',

created_at timestamptz default now(),
updated_at timestamptz default now()
```

The actual invitation token should **not** be stored in plain text.

---

# 6. Teams

## `teams`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,
name text not null,
description text,
status text default 'active',
created_at timestamptz default now(),
updated_at timestamptz default now()
```

## `team_members`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,
team_id uuid not null references teams(id) on delete cascade,
user_id uuid not null references users(id) on delete cascade,

created_at timestamptz default now(),

unique(team_id, user_id)
```

---

# 7. CRM — contacts

## `contacts`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,

first_name text,
last_name text,
display_name text,

email text,
phone text,

company text,
job_title text,

country text,
city text,

source text,
owner_user_id uuid references users(id),

status text default 'active',

notes text,

created_at timestamptz default now(),
updated_at timestamptz default now()
```

---

# 8. Contact identities

This allows one customer to connect across channels.

## `contact_identities`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,
contact_id uuid not null references contacts(id) on delete cascade,

provider text not null,
provider_account_id uuid,
external_id text not null,
external_username text,

metadata jsonb default '{}',

created_at timestamptz default now(),
updated_at timestamptz default now(),

unique(provider, provider_account_id, external_id)
```

Example:

```text
Mohammed
│
├── WhatsApp ID
├── Instagram ID
├── Facebook ID
├── Email
└── Phone
```

---

# 9. Tags

## `tags`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,
name text not null,
color text,
created_at timestamptz default now(),

unique(tenant_id, name)
```

## `contact_tags`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,
contact_id uuid not null references contacts(id) on delete cascade,
tag_id uuid not null references tags(id) on delete cascade,

unique(contact_id, tag_id)
```

---

# 10. CRM custom fields

## `custom_fields`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,

entity_type text not null,
name text not null,
field_key text not null,
field_type text not null,

is_required boolean default false,

created_at timestamptz default now(),
updated_at timestamptz default now(),

unique(tenant_id, entity_type, field_key)
```

## `custom_field_values`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,
custom_field_id uuid not null references custom_fields(id) on delete cascade,

entity_id uuid not null,

value_text text,
value_number numeric,
value_boolean boolean,
value_date date,
value_datetime timestamptz,
value_json jsonb,

created_at timestamptz default now(),
updated_at timestamptz default now()
```

---

# 11. Leads

## `pipelines`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,

name text not null,
description text,
is_default boolean default false,

created_at timestamptz default now(),
updated_at timestamptz default now()
```

## `pipeline_stages`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,
pipeline_id uuid not null references pipelines(id) on delete cascade,

name text not null,
position integer not null,
probability numeric,

created_at timestamptz default now(),
updated_at timestamptz default now()
```

## `leads`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,

contact_id uuid references contacts(id) on delete set null,

pipeline_id uuid references pipelines(id),
stage_id uuid references pipeline_stages(id),

owner_user_id uuid references users(id),

source text,
campaign_id uuid,

value numeric,
currency text,

priority text default 'normal',
status text default 'open',

expected_close_date date,

created_at timestamptz default now(),
updated_at timestamptz default now()
```

---

# 12. Lead activities

## `lead_activities`

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null references tenants(id) on delete cascade,

lead_id uuid not null references leads(id) on delete cascade,
user_id uuid references users(id),

activity_type text not null,
title text,
description text,

scheduled_at timestamptz,
completed_at timestamptz,

created_at timestamptz default now()
```

---

# 13. Integrations

## `integrations`

This is the provider catalog.

```sql
id uuid primary key default gen_random_uuid(),

provider text not null,
name text not null,
category text not null,
description text,

created_at timestamptz default now(),

unique(provider)
```

Examples:

```text
meta
google
youtube
email
sms
```

---

# 14. Integration accounts

This represents a tenant's connected business account.

## `integration_accounts`

```sql
id uuid primary key default gen_random_uuid(),

tenant_id uuid not null references tenants(id) on delete cascade,
integration_id uuid not null references integrations(id),

external_account_id text,
account_name text,
account_type text,

status text default 'connected',

metadata jsonb default '{}',

connected_by uuid references users(id),
connected_at timestamptz,
last_synced_at timestamptz,

created_at timestamptz default now(),
updated_at timestamptz default now()
```

Examples:

```text
Tenant
 ├── Meta Business Account
 ├── Google Ads Account
 ├── YouTube Channel
 └── Email Provider
```

---

# 15. Integration credentials

## `integration_credentials`

```sql
id uuid primary key default gen_random_uuid(),

tenant_id uuid not null references tenants(id) on delete cascade,
integration_account_id uuid not null references integration_accounts(id) on delete cascade,

credential_type text not null,
encrypted_value text not null,

expires_at timestamptz,

created_at timestamptz default now(),
updated_at timestamptz default now()
```

Credentials must remain backend-only.

---

# 16. Integration permissions

## `integration_permissions`

```sql
id uuid primary key default gen_random_uuid(),

tenant_id uuid not null references tenants(id) on delete cascade,
integration_account_id uuid not null references integration_accounts(id) on delete cascade,

permission text not null,
status text not null,

created_at timestamptz default now(),
updated_at timestamptz default now()
```

---

# 17. Webhooks

## `webhook_events`

```sql
id uuid primary key default gen_random_uuid(),

tenant_id uuid references tenants(id) on delete cascade,

provider text not null,
integration_account_id uuid references integration_accounts(id) on delete set null,

external_event_id text,
event_type text,

payload jsonb not null,

signature_valid boolean default false,

processing_status text default 'received',

received_at timestamptz default now(),
processed_at timestamptz,

error_message text,

created_at timestamptz default now()
```

Important unique constraint:

```text
provider + external_event_id
```

where the provider supplies a reliable event ID.

This provides idempotency.

---

# 18. Conversations

## `conversations`

```sql
id uuid primary key default gen_random_uuid(),

tenant_id uuid not null references tenants(id) on delete cascade,
contact_id uuid references contacts(id) on delete set null,

channel text not null,
external_conversation_id text,

status text default 'open',

assigned_user_id uuid references users(id),
assigned_team_id uuid references teams(id),

subject text,

last_message_at timestamptz,

created_at timestamptz default now(),
updated_at timestamptz default now()
```

---

# 19. Messages

## `messages`

```sql
id uuid primary key default gen_random_uuid(),

tenant_id uuid not null references tenants(id) on delete cascade,

conversation_id uuid not null references conversations(id) on delete cascade,
contact_id uuid references contacts(id) on delete set null,

sender_type text not null,
sender_user_id uuid references users(id),

channel text not null,

external_message_id text,

message_type text not null,

body text,

status text default 'pending',

sent_at timestamptz,
delivered_at timestamptz,
read_at timestamptz,
failed_at timestamptz,

failure_reason text,

metadata jsonb default '{}',

created_at timestamptz default now()
```

---

# 20. Message attachments

## `message_attachments`

```sql
id uuid primary key default gen_random_uuid(),

tenant_id uuid not null references tenants(id) on delete cascade,

message_id uuid not null references messages(id) on delete cascade,

file_name text,
file_type text,
mime_type text,
storage_path text,
external_url text,
file_size bigint,

metadata jsonb default '{}',

created_at timestamptz default now()
```

---

# 21. Audit logs

## `audit_logs`

```sql
id uuid primary key default gen_random_uuid(),

tenant_id uuid references tenants(id) on delete cascade,
user_id uuid references users(id) on delete set null,

action text not null,

entity_type text,
entity_id uuid,

before_data jsonb,
after_data jsonb,

ip_address inet,
user_agent text,

created_at timestamptz default now()
```

---

# 22. Essential indexes

These should be created early.

```sql
create index idx_tenant_members_tenant
on tenant_members(tenant_id);

create index idx_tenant_members_user
on tenant_members(user_id);

create index idx_contacts_tenant
on contacts(tenant_id);

create index idx_contacts_owner
on contacts(tenant_id, owner_user_id);

create index idx_leads_tenant
on leads(tenant_id);

create index idx_leads_stage
on leads(tenant_id, stage_id);

create index idx_conversations_tenant
on conversations(tenant_id);

create index idx_conversations_contact
on conversations(tenant_id, contact_id);

create index idx_messages_conversation
on messages(conversation_id);

create index idx_messages_tenant_created
on messages(tenant_id, created_at desc);

create index idx_integrations_tenant
on integration_accounts(tenant_id);

create index idx_webhook_events_provider
on webhook_events(provider, external_event_id);

create index idx_audit_logs_tenant_created
on audit_logs(tenant_id, created_at desc);
```

---

# 23. RLS Strategy

Enable RLS on every tenant-owned table.

Conceptually:

```text
auth.uid()
    ↓
tenant_members
    ↓
authorized tenant_id
    ↓
table.tenant_id
```

Example policy concept:

```sql
create policy "tenant members can view contacts"
on contacts
for select
to authenticated
using (
  exists (
    select 1
    from tenant_members tm
    where tm.tenant_id = contacts.tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
  )
);
```

The same model should be applied to all tenant-owned resources.

---

# 24. Critical RLS Rule

Do not create policies that simply trust a client-supplied tenant ID.

Bad:

```text
tenant_id = request.tenant_id
```

Good:

```text
auth.uid()
 ↓
tenant_members
 ↓
authorized tenant
 ↓
row tenant_id
```

---

# 25. Database Trigger — User Profile

When a Supabase Auth user is created, Teameit can create the application profile.

Conceptually:

```text
auth.users INSERT
       ↓
trigger
       ↓
users INSERT
```

However, the implementation should be carefully designed so that failed profile creation does not create confusing signup states.

---

# 26. Tenant Creation Transaction

When creating a workspace:

```text
POST /tenants
```

Node.js should perform:

```text
BEGIN

Create tenant
      ↓
Create owner membership
      ↓
Create owner role / assign existing system role
      ↓
Create onboarding record
      ↓
Create default pipeline
      ↓
Create default pipeline stages
      ↓
Create default tenant settings

COMMIT
```

If a required step fails:

```text
ROLLBACK
```

---

# 27. Default CRM Data

A new tenant should automatically receive:

### Pipeline

```text
Sales Pipeline
```

### Stages

```text
New
Contacted
Qualified
Proposal
Negotiation
Won
Lost
```

These should be tenant-owned records so the tenant can customize them later.

---

# 28. Database Relationship Map

```text
                         auth.users
                             │
                             ▼
                           users
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
         tenant_members             invitations
                 │
                 ▼
              tenants
                 │
    ┌────────────┼──────────────┐
    │            │              │
    ▼            ▼              ▼
onboarding     teams          roles
    │            │              │
    │            ▼              ▼
    │       team_members   role_permissions
    │
    ├── contacts
    │      ├── identities
    │      ├── tags
    │      └── custom fields
    │
    ├── leads
    │      └── pipelines
    │
    ├── conversations
    │      └── messages
    │
    ├── integrations
    │      ├── accounts
    │      ├── credentials
    │      └── webhooks
    │
    └── audit_logs
```

---

# 29. What developers should implement first

### Database Sprint 1

```text
☐ Supabase project
☐ Auth configuration
☐ users
☐ tenants
☐ tenant_members
☐ roles
☐ permissions
☐ role_permissions
☐ tenant_onboarding
☐ tenant_invitations
☐ teams
☐ team_members
```

### Database Sprint 2

```text
☐ contacts
☐ contact_identities
☐ tags
☐ contact_tags
☐ custom_fields
☐ custom_field_values
☐ pipelines
☐ pipeline_stages
☐ leads
☐ lead_activities
```

### Database Sprint 3

```text
☐ integrations
☐ integration_accounts
☐ integration_credentials
☐ integration_permissions
☐ webhook_events
☐ conversations
☐ messages
☐ message_attachments
☐ audit_logs
```

---

# 30. Do NOT implement yet

Do not start with:

```text
❌ WhatsApp-specific tables everywhere
❌ Instagram-specific CRM tables
❌ Facebook-specific contact tables
❌ Separate customer databases per channel
❌ Separate tenant databases
❌ Password storage
❌ Provider tokens in users table
```

The foundation must remain **channel-independent**.

---

# 31. Next database layer

After this foundation is implemented, the next schema should add the **marketing execution layer**:

```text
Campaigns
    ↓
Campaign Channels
    ↓
Audiences
    ↓
Recipients
    ↓
Campaign Events

Automations
    ↓
Versions
    ↓
Nodes
    ↓
Edges
    ↓
Executions
    ↓
Execution Steps

Publishing
    ↓
Content
    ↓
Content Variants
    ↓
Publishing Jobs
```

That should be the **next database specification**, before writing the provider-specific WhatsApp/Meta/Google implementation.

### Recommended implementation sequence

**Now:** Supabase foundation schema
**Next:** Campaign + Automation + Publishing schema
**Then:** Node.js API contract
**Then:** Integration APIs/webhooks
**Then:** React screens and workflows

This keeps the architecture stable while your development team builds the product module by module.
