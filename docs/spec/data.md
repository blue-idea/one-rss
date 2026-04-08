# 数据库设计（OneRss）

## 1. 目标与范围
本文档定义 OneRss 的 Supabase Postgres 数据模型、关系约束、索引与 RLS（Row-Level Security）策略。  
本设计用于支撑 `docs/spec/requirements.md` 与 `docs/spec/design.md` 的已确认需求。

## 2. 设计原则
- 用户私有数据严格按 `auth.uid()` 隔离。
- 目录与文章属于平台数据，登录用户可读，写入受服务端控制。
- 会员能力由服务端数据判定，前端仅做展示与预校验。
- 所有时间字段统一使用 `timestamptz`（UTC）。
- 主键统一使用 `uuid`，并启用默认生成。

## 3. 实体关系总览

```mermaid
erDiagram
  profiles ||--o| memberships : has
  plans ||--o{ memberships : references
  feeds ||--o{ subscriptions : subscribed_by
  profiles ||--o{ subscriptions : owns
  feeds ||--o{ articles : publishes
  articles ||--o{ article_images : has
  profiles ||--o{ bookmarks : owns
  articles ||--o{ bookmarks : bookmarked
  profiles ||--o{ reading_progress : tracks
  articles ||--o{ reading_progress : tracked
  profiles ||--o| user_preferences : has
  feeds ||--o{ curated_picks : curated_in
```

## 4. 数据表设计

> 说明：`auth.users` 为 Supabase 内置用户表，业务表以其 `id` 作为外键。

### 4.1 `profiles`（用户资料）
- 用途：扩展用户基础信息与状态。
- 关键字段：
  - `id uuid pk`（= `auth.users.id`）
  - `display_name text`
  - `avatar_url text`
  - `role text`（`user` / `admin`）
  - `created_at timestamptz`
  - `updated_at timestamptz`

### 4.2 `plans`（会员套餐）
- 用途：定义月付/年付套餐。
- 关键字段：
  - `id uuid pk`
  - `code text unique`（`monthly` / `yearly`）
  - `name text`
  - `billing_cycle text`（`month` / `year`）
  - `price_cents integer`
  - `currency text`
  - `is_active boolean`
  - `created_at timestamptz`

### 4.3 `memberships`（用户会员状态）
- 用途：记录会员等级与有效期。
- 关键字段：
  - `id uuid pk`
  - `user_id uuid fk -> profiles.id unique`
  - `plan_id uuid fk -> plans.id`
  - `tier text`（`free` / `premium`）
  - `status text`（`active` / `expired` / `canceled` / `pending`）
  - `started_at timestamptz`
  - `expires_at timestamptz`
  - `updated_at timestamptz`

### 4.4 `feeds`（订阅源目录）
- 用途：公开 RSS 源目录与基础元信息。
- 关键字段：
  - `id uuid pk`
  - `title text`
  - `description text`
  - `rss_url text unique`
  - `site_url text`
  - `category text`
  - `language text`
  - `is_featured boolean`
  - `created_at timestamptz`
  - `updated_at timestamptz`

### 4.5 `subscriptions`（用户订阅关系）
- 用途：用户与源的订阅映射。
- 关键字段：
  - `id uuid pk`
  - `user_id uuid fk -> profiles.id`
  - `feed_id uuid fk -> feeds.id`
  - `is_muted boolean`
  - `created_at timestamptz`
  - `updated_at timestamptz`
- 约束：
  - `unique(user_id, feed_id)` 防止重复订阅。

### 4.6 `articles`（文章主表）
- 用途：聚合后的文章内容与时间排序基准。
- 关键字段：
  - `id uuid pk`
  - `feed_id uuid fk -> feeds.id`
  - `title text`
  - `author text`
  - `summary text`
  - `content text`
  - `source_url text unique`
  - `published_at timestamptz`
  - `read_time_minutes integer`
  - `is_featured boolean`（可选展示标记，非精选流权威筛选字段）
  - `created_at timestamptz`

### 4.7 `article_images`（文章图片）
- 用途：离线缓存与阅读渲染所需图片索引。
- 关键字段：
  - `id uuid pk`
  - `article_id uuid fk -> articles.id`
  - `image_url text`
  - `sort integer`
  - `created_at timestamptz`

### 4.8 `bookmarks`（用户收藏）
- 用途：文章收藏状态。
- 关键字段：
  - `id uuid pk`
  - `user_id uuid fk -> profiles.id`
  - `article_id uuid fk -> articles.id`
  - `created_at timestamptz`
- 约束：
  - `unique(user_id, article_id)`

### 4.9 `reading_progress`（阅读进度）
- 用途：记录用户阅读进度与最后阅读时间。
- 关键字段：
  - `id uuid pk`
  - `user_id uuid fk -> profiles.id`
  - `article_id uuid fk -> articles.id`
  - `progress_percent numeric(5,2)`（0-100）
  - `last_position text`（可存段落锚点）
  - `updated_at timestamptz`
- 约束：
  - `unique(user_id, article_id)`

### 4.10 `user_preferences`（用户偏好）
- 用途：主题、字体、翻译语言等个性化设置。
- 关键字段：
  - `id uuid pk`
  - `user_id uuid fk -> profiles.id unique`
  - `theme text`（`light` / `dark` / `deep`）
  - `font_scale numeric(4,2)`
  - `line_height numeric(4,2)`
  - `ui_language text`
  - `translate_language text`
  - `updated_at timestamptz`

### 4.11 `curated_picks`（精选栏目）
- 用途：维护“精选订阅栏目（feed）”集合，供精选推荐流过滤来源。
- 关键字段：
  - `id uuid pk`
  - `feed_id uuid fk -> feeds.id unique`
  - `active boolean`
  - `created_at timestamptz`

## 5. 关键业务约束（数据库层）

1. 普通用户订阅上限 10：通过触发器在 `subscriptions` 插入时校验 `memberships.tier`。  
2. 高级能力（翻译/朗读）依赖会员状态：由应用层 + 接口层校验 `memberships`。  
3. 精选推荐来源：仅从 `curated_picks.active = true` 的订阅栏目聚合文章。  
4. 精选排序：按 `articles.published_at desc`（最新在前）。  
5. 账号唯一归属：所有私有表均必须含 `user_id` 并受 RLS 保护。

## 6. 索引设计

- `subscriptions(user_id)`、`subscriptions(feed_id)`、`subscriptions(user_id, feed_id unique)`
- `articles(feed_id, published_at desc)`
- `articles(published_at desc)`
- `bookmarks(user_id, created_at desc)`
- `reading_progress(user_id, updated_at desc)`
- `curated_picks(active, feed_id)`

## 7. RLS 策略（核心）

## 7.1 启用 RLS
对以下表启用 RLS：
- `profiles`
- `memberships`
- `subscriptions`
- `bookmarks`
- `reading_progress`
- `user_preferences`
- `feeds`
- `articles`
- `article_images`
- `curated_picks`
- `plans`

## 7.2 策略原则
- 用户私有表：仅允许 `auth.uid() = user_id` 访问。
- 公共内容表（feeds/articles/...）：登录用户可 SELECT，写操作仅 service role。
- 套餐表 `plans`：登录用户可 SELECT，写操作仅 admin/service。

## 7.3 SQL 策略草案

```sql
-- profiles
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

-- memberships
alter table public.memberships enable row level security;
create policy "memberships_select_own" on public.memberships
for select using (auth.uid() = user_id);

-- subscriptions
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own" on public.subscriptions
for select using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on public.subscriptions
for insert with check (auth.uid() = user_id);
create policy "subscriptions_update_own" on public.subscriptions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions_delete_own" on public.subscriptions
for delete using (auth.uid() = user_id);

-- bookmarks
alter table public.bookmarks enable row level security;
create policy "bookmarks_select_own" on public.bookmarks
for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.bookmarks
for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.bookmarks
for delete using (auth.uid() = user_id);

-- reading_progress
alter table public.reading_progress enable row level security;
create policy "reading_progress_select_own" on public.reading_progress
for select using (auth.uid() = user_id);
create policy "reading_progress_insert_own" on public.reading_progress
for insert with check (auth.uid() = user_id);
create policy "reading_progress_update_own" on public.reading_progress
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_preferences
alter table public.user_preferences enable row level security;
create policy "user_preferences_select_own" on public.user_preferences
for select using (auth.uid() = user_id);
create policy "user_preferences_upsert_own" on public.user_preferences
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- public readable tables for authenticated users
alter table public.feeds enable row level security;
create policy "feeds_select_auth" on public.feeds
for select using (auth.role() = 'authenticated');

alter table public.articles enable row level security;
create policy "articles_select_auth" on public.articles
for select using (auth.role() = 'authenticated');

alter table public.article_images enable row level security;
create policy "article_images_select_auth" on public.article_images
for select using (auth.role() = 'authenticated');

alter table public.curated_picks enable row level security;
create policy "curated_picks_select_auth" on public.curated_picks
for select using (auth.role() = 'authenticated');

alter table public.plans enable row level security;
create policy "plans_select_auth" on public.plans
for select using (auth.role() = 'authenticated');
```

## 8. 订阅上限约束（触发器草案）

```sql
create or replace function public.check_subscription_limit()
returns trigger
language plpgsql
as $$
declare
  user_tier text;
  sub_count integer;
begin
  select coalesce(m.tier, 'free') into user_tier
  from public.memberships m
  where m.user_id = new.user_id
  limit 1;

  if user_tier <> 'premium' then
    select count(*) into sub_count
    from public.subscriptions s
    where s.user_id = new.user_id;

    if sub_count >= 10 then
      raise exception 'Subscription limit reached for free user';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_subscription_limit on public.subscriptions;
create trigger trg_check_subscription_limit
before insert on public.subscriptions
for each row execute function public.check_subscription_limit();
```

## 9. 数据迁移与初始化建议
- 使用版本化 SQL migration 管理 schema 变更。
- 初始化数据：
  - `plans`：月付、年付两条记录。
  - `feeds`：导入首批公开目录源。
  - `curated_picks`：初始化精选订阅栏目数据（`feed_id` + `active`）。
- 为历史文章补全 `published_at`、`read_time_minutes` 默认值策略。

## 10. 待实现说明
- 支付回调与会员状态同步涉及外部支付网关，建议通过 Edge Functions 承接。
- 第三方登录账户合并流程与审计日志建议新增 `account_links` 与 `audit_logs`（如后续审计要求增强可扩展）。
