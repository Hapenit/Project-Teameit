-- Migration 016 creates this table. Normalize its original column names instead
-- of attempting to create a conflicting second definition.
alter table public.media_assets rename column file_name to filename;
alter table public.media_assets rename column file_type to mime_type;
alter table public.media_assets rename column file_size to size_bytes;

alter table public.media_assets enable row level security;

create policy "Users can view and edit media in their tenants"
  on public.media_assets for all
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = media_assets.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- Assuming bucket 'tenant-media' is created manually or via Supabase dashboard
-- Note: Supabase storage policies would normally be defined here, but requires the storage schema
-- Example:
-- insert into storage.buckets (id, name) values ('tenant-media', 'tenant-media');
-- create policy "Tenant access to media" on storage.objects for all using ( bucket_id = 'tenant-media' AND (auth.uid() in (select user_id from public.tenant_members where tenant_id::text = (string_to_array(name, '/'))[1])) );
