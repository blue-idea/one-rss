-- 阅读进度追踪
-- Task 16: 实现阅读进度与系统分享

-- reading_progress: 用户阅读进度记录
create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  progress integer not null check (progress >= 0 and progress <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, article_id)
);

create index if not exists reading_progress_user_idx on public.reading_progress (user_id);
create index if not exists reading_progress_article_idx on public.reading_progress (article_id);

-- 启用 RLS
alter table public.reading_progress enable row level security;

-- reading_progress 策略：用户只能查看和更新自己的阅读进度
create policy "users can view own reading progress" on public.reading_progress for select using (auth.uid() = user_id);
create policy "users can insert own reading progress" on public.reading_progress for insert with check (auth.uid() = user_id);
create policy "users can update own reading progress" on public.reading_progress for update using (auth.uid() = user_id);