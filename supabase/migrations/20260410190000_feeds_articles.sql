-- Migration: Create feeds, articles, and related tables for Task 11
-- Run after email_otp_challenges migration

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 4.2 feed_categories
create table if not exists public.feed_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  sort integer default 0,
  created_at timestamptz default now()
);

-- 4.5 feeds
create table if not exists public.feeds (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.feed_categories(id) on delete set null,
  title text not null,
  url text unique not null,
  image_url text,
  site_url text,
  language text,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4.7 articles
create table if not exists public.articles (
  id uuid primary key default uuid_generate_v4(),
  feed_id uuid references public.feeds(id) on delete cascade,
  title text not null,
  author text,
  summary text,
  content text,
  source_url text unique not null,
  published_at timestamptz,
  read_time_minutes integer,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_feeds_category on public.feeds(category_id, is_featured desc, created_at desc);
create index if not exists idx_articles_feed_published on public.articles(feed_id, published_at desc);
create index if not exists idx_articles_published on public.articles(published_at desc);

-- 4.3 profiles (extend auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4.6 subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  feed_id uuid references public.feeds(id) on delete cascade,
  is_muted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, feed_id)
);

-- 4.9 bookmarks
create table if not exists public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, article_id)
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS Policies
-- profiles
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- feed_categories (public read)
alter table public.feed_categories enable row level security;
create policy "feed_categories_select_auth" on public.feed_categories for select using (auth.uid() is not null);

-- feeds (public read, authenticated users)
alter table public.feeds enable row level security;
create policy "feeds_select_auth" on public.feeds for select using (auth.uid() is not null);

-- articles (public read, authenticated users)
alter table public.articles enable row level security;
create policy "articles_select_auth" on public.articles for select using (auth.uid() is not null);

-- subscriptions
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "subscriptions_update_own" on public.subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions_delete_own" on public.subscriptions for delete using (auth.uid() = user_id);

-- bookmarks
alter table public.bookmarks enable row level security;
create policy "bookmarks_select_own" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.bookmarks for delete using (auth.uid() = user_id);

-- Seed some initial feed categories
insert into public.feed_categories (name, description, sort) values
  ('科技', 'Technology and innovation', 1),
  ('设计', 'Design and architecture', 2),
  ('商业', 'Business and finance', 3),
  ('文化', 'Culture and society', 4)
on conflict do nothing;