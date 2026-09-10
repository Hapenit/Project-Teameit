create table if not exists public.whatsapp_catalog_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  catalog_id text not null, product_id text not null, retailer_id text,
  name text not null, description text, price numeric, currency text,
  image_url text, availability text, raw jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  unique (tenant_id, catalog_id, product_id)
);
alter table public.whatsapp_catalog_products enable row level security;
create policy "Users can view WhatsApp catalog products in their tenants"
 on public.whatsapp_catalog_products for select using (exists (
  select 1 from public.tenant_members tm where tm.tenant_id = whatsapp_catalog_products.tenant_id and tm.user_id = auth.uid()
));
create index if not exists idx_whatsapp_catalog_tenant on public.whatsapp_catalog_products(tenant_id, catalog_id);
