-- Community posts
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  category text default 'General',
  image_url text,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.community_posts enable row level security;

create policy "posts_select_all" on public.community_posts
  for select using (true);

create policy "posts_insert_own" on public.community_posts
  for insert with check (auth.uid() = user_id);

create policy "posts_update_own" on public.community_posts
  for update using (auth.uid() = user_id);

create policy "posts_delete_own" on public.community_posts
  for delete using (auth.uid() = user_id);

create index idx_community_posts_user on public.community_posts(user_id);
create index idx_community_posts_category on public.community_posts(category);
create index idx_community_posts_created on public.community_posts(created_at desc);

-- Post likes
create table if not exists public.community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table public.community_likes enable row level security;

create policy "likes_select_all" on public.community_likes
  for select using (true);

create policy "likes_insert_own" on public.community_likes
  for insert with check (auth.uid() = user_id);

create policy "likes_delete_own" on public.community_likes
  for delete using (auth.uid() = user_id);

create index idx_community_likes_post on public.community_likes(post_id);

-- Post comments
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table public.community_comments enable row level security;

create policy "comments_select_all" on public.community_comments
  for select using (true);

create policy "comments_insert_own" on public.community_comments
  for insert with check (auth.uid() = user_id);

create policy "comments_delete_own" on public.community_comments
  for delete using (auth.uid() = user_id);

create index idx_community_comments_post on public.community_comments(post_id);

-- Post bookmarks
create table if not exists public.community_bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table public.community_bookmarks enable row level security;

create policy "bookmarks_select_own" on public.community_bookmarks
  for select using (auth.uid() = user_id);

create policy "bookmarks_insert_own" on public.community_bookmarks
  for insert with check (auth.uid() = user_id);

create policy "bookmarks_delete_own" on public.community_bookmarks
  for delete using (auth.uid() = user_id);

-- Updated_at triggers
create trigger community_posts_updated_at
  before update on public.community_posts
  for each row
  execute function update_updated_at_column();
