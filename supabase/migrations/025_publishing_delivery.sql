alter table public.posts add column if not exists external_ids jsonb not null default '{}'::jsonb;
alter table public.posts add column if not exists last_error text;
comment on table public.posts is 'Social posts are published through configured provider integrations; missing credentials produce failed posts, never fake success.';
