-- Publishing adapters persist truthful delivery state.
alter table public.posts
  drop constraint if exists posts_status_check;

alter table public.posts
  add constraint posts_status_check
  check (status in ('draft', 'scheduled', 'published', 'failed'));

-- Until provider adapters exist, new API-created posts must remain drafts.
comment on column public.posts.status is
  'draft, scheduled, published, or failed according to provider delivery state';
