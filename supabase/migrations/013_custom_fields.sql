-- Add custom_fields jsonb column to contacts table
alter table public.contacts
add column if not exists custom_fields jsonb default '{}'::jsonb;

-- Add a GIN index on custom_fields to allow for fast querying
-- e.g. finding all contacts where custom_fields->>'industry' = 'SaaS'
create index if not exists idx_contacts_custom_fields on public.contacts using gin (custom_fields);
