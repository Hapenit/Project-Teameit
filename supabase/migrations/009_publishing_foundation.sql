create table public.posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  platforms jsonb not null, -- Array of target platforms e.g. ['facebook', 'instagram', 'linkedin']
  status text default 'draft', -- 'draft', 'scheduled', 'published', 'failed'
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  media_type text not null, -- 'image', 'video'
  media_url text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.posts enable row level security;
alter table public.post_media enable row level security;

create policy "Users can view posts in their tenants"
  on public.posts for select
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = posts.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can view post media in their tenants"
  on public.post_media for select
  using (
    exists (
      select 1 from public.posts
      join public.tenant_members on tenant_members.tenant_id = posts.tenant_id
      where posts.id = post_media.post_id
      and tenant_members.user_id = auth.uid()
    )
  );
