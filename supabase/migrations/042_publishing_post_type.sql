alter table public.posts add column if not exists post_type text not null default 'feed' check (post_type in ('feed', 'story', 'reel'));
