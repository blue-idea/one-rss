-- 用户订阅源与文章数据模型
-- Task 14: 书架列表、分类与未读计数展示

-- feeds: RSS 订阅源目录
create table if not exists public.feeds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  url text not null unique,
  logo text,
  category text not null, -- 分类：设计/科技/文化/建筑/商业
  is_featured boolean default false,
  is_public boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feeds_category_idx on public.feeds (category);
create index if not exists feeds_is_featured_idx on public.feeds (is_featured);

-- subscriptions: 用户订阅关系
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feed_id uuid not null references public.feeds(id) on delete cascade,
  unread_count integer default 0,
  last_read_at timestamptz,
  subscribed_at timestamptz not null default now(),
  unique(user_id, feed_id)
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
create index if not exists subscriptions_feed_idx on public.subscriptions (feed_id);

-- articles: 文章内容
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references public.feeds(id) on delete cascade,
  title text not null,
  url text not null unique,
  author text,
  published_at timestamptz,
  summary text,
  content text,
  reading_time_minutes integer, -- 预计阅读时长(分钟)
  is_read boolean default false,
  is_favorited boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists articles_feed_idx on public.articles (feed_id);
create index if not exists articles_published_idx on public.articles (published_at desc);

-- 样本数据
insert into public.feeds (id, name, description, url, logo, category, is_featured, is_public) values
  ('11111111-1111-1111-1111-111111111111', 'Wallpaper*', '设计美学杂志', 'https://wallpaper.com', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvhLCab4T6VKp3d1HHeUdcZuCOEYkXg4uZMuZ_ozua9ztYfAkHAqUDqEkkklSaC11hNLnY9iorx2WXNKVOiya3swzjywG22BuVkUSSdkvn5sEEprbxsc3rPZJWwdG_9oA9hRHjyRR3JYar92YEfzMzCnZ7WCtzCH69LrD0JvqF8Llp8eAtlvtp2LnjPD8raV0LMCKLUIX8FF1wTuV-7ybONB5yeL0vSGavw_opORGn1m39879h11cMRwKGld8pX8oACkGCc3HM37IH', '设计', true, true),
  ('22222222-2222-2222-2222-222222222222', 'The Verge', '科技、科学和文化新闻', 'https://theverge.com', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoVIR3FYI2p6sXeQTAI6q5TgAkheuzsL8qK_GO_jlsgeXQ2ZbM8fFHNUNd_yLEcoDRF0z5uqaJqXgiwuTmIyA18jjMBmLGKbr2RL0L273fdN3uhtAye_2HtPF57_ggsSuHLUggPipUANGdyR11Cf8mTNUOAX-LWdOd1ZbTbmeM90hKMDhNmrNh42PlMbwO4hivEe-S32J2GUl5nZuiNw5cqnWQoOD4tN0KNktKjLaVBKODutE5eez4SjSyWLyTmGTEOro6LeD_w_nv', '科技', true, true),
  ('33333333-3333-3333-3333-333333333333', 'National Geographic', '自然与文化探索', 'https://nationalgeographic.com', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDA17fSUHKVCk1AkVj6jHJPs_Z0yZxN9x8RlPdyoyHom2JDLbsr_dJ2tXDUv7aHcUAIsoiPsNSKPUvvCmfKNHBsAswpwP3bDLO4keqBS9f6SkloZLh-Gh5jRh9cxhvTSPRRF4QxCgmqYDQLtHCGsL5GhfBtM3KPQcaArlh5Ti2a7vTS4bCovQGclIeox2cFF2Jog8HAceG5oj8eZ6hajdYWiIJygk7oXJuE8umYrsw3jdr-C7C9mUNYP12hlwg6XPY4xNjf947rHjKU', '文化', true, true),
  ('44444444-4444-4444-4444-444444444444', 'Architectural Digest', '建筑与室内设计', 'https://architecturaldigest.com', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNNXuL6lSSbJnv8Hay9RUKjrnLGOFcGsXk9XWXUEnySdp9yI-l0P1CpdmmJG9vh0Z1M5slABJaPzuLRRg5UYO-4fVZlpLmnBo-OtZeGkJW5U9HiX98rXBV52-RSRD6fxv0o7Ne2hm9p2WrWSFGlBoMkzg4s_8oJVlwHCMK-GNIYE2GEDrF3iKzIvd1AMlmFRchc9Pc-8rUQiZYeHDeYkHVqoMJntjj1cO4nWnskoWXjr6TAim7vdKpLibwetFhF7aHQl9JC2xm42B0', '建筑', false, true),
  ('55555555-5555-5555-5555-555555555555', 'Stripe Engineering', '工程技术与支付', 'https://stripe.com/blog/engineering', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlX4BGUHPmwL65u6fGLiDe6O16S8yAUaYx3NjRyu8fHZ6jNAvHjBymixBQ0DPxfQXI_Iq6bCcR8-nhF0nY4kVQdTYDUbkUHRK_Ip_Kc5Sj13ulrStczCxbU8DQR5YUM6RLOOhW6nuwvXQ8h-_6NlKu-wZ9YtM19ShLTQs30_MPXV0mxPSi1j1W0gva6Ctk-fcPL2uGeJIulLgtVkDAt5kLH_-pBX1RrzOb7kq-zJj7hjZXQjpZIsXnRcgaZa7fLQYbGdnF8GUJX1JY', '科技', true, true)
on conflict (url) do nothing;

-- 启用 RLS
alter table public.feeds enable row level security;
alter table public.subscriptions enable row level security;
alter table public.articles enable row level security;

-- feeds 策略：公开可读
create policy "feeds are public" on public.feeds for select using (is_public = true);

-- subscriptions 策略：用户只能查看自己的订阅
create policy "users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);

-- articles 策略：公开可读
create policy "articles are public" on public.articles for select using (true);