-- Complete tenant-scoped WhatsApp CRUD policies and synchronization metadata.
alter table public.whatsapp_catalog_products
  add column if not exists updated_at timestamptz not null default now();
alter table public.whatsapp_templates
  add column if not exists updated_at timestamptz not null default now();

drop policy if exists "Users can manage WhatsApp templates in their tenants" on public.whatsapp_templates;
create policy "Users can manage WhatsApp templates in their tenants"
  on public.whatsapp_templates for all
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = whatsapp_templates.tenant_id and tm.user_id = auth.uid()))
  with check (exists (select 1 from public.tenant_members tm where tm.tenant_id = whatsapp_templates.tenant_id and tm.user_id = auth.uid()));

drop policy if exists "Users can manage WhatsApp catalog products in their tenants" on public.whatsapp_catalog_products;
create policy "Users can manage WhatsApp catalog products in their tenants"
  on public.whatsapp_catalog_products for all
  using (exists (select 1 from public.tenant_members tm where tm.tenant_id = whatsapp_catalog_products.tenant_id and tm.user_id = auth.uid()))
  with check (exists (select 1 from public.tenant_members tm where tm.tenant_id = whatsapp_catalog_products.tenant_id and tm.user_id = auth.uid()));

create index if not exists idx_whatsapp_templates_tenant_status
  on public.whatsapp_templates(tenant_id, status, updated_at desc);
