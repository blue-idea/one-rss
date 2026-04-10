-- Generated from docs/knowledge/rsshub_routes.csv by scripts/sync-feed-directory-from-csv.mjs

create table if not exists public.feed_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feeds (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.feed_categories(id) on delete restrict,
  title text not null,
  description text not null default '',
  url text not null unique,
  image_url text,
  site_url text,
  language text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_categories_sort_idx
  on public.feed_categories (sort, created_at desc);

create index if not exists feeds_category_featured_created_idx
  on public.feeds (category_id, is_featured, created_at desc);

alter table public.feed_categories enable row level security;
alter table public.feeds enable row level security;

drop policy if exists "feed_categories_select_auth" on public.feed_categories;
create policy "feed_categories_select_auth" on public.feed_categories
for select using (auth.uid() is not null);

drop policy if exists "feeds_select_auth" on public.feeds;
create policy "feeds_select_auth" on public.feeds
for select using (auth.uid() is not null);

insert into public.feed_categories (title, slug, sort)
values
  ('科技', 'tech', 1),
  ('设计', 'design', 2),
  ('商业', 'business', 3),
  ('财经', 'finance', 4),
  ('文化', 'culture', 5)
on conflict (slug) do update
set
  title = excluded.title,
  sort = excluded.sort,
  updated_at = now();

with seeded_feeds(category_slug, title, description, url, site_url, language, is_featured) as (
  values
    ('tech', 'TechCrunch Startups', '聚焦创业公司、融资动态与新产品发布。', 'https://rsshub.app/techcrunch/startups', 'https://techcrunch.com/startups/', 'en', true),
    ('tech', 'The Verge Tech', '覆盖消费电子、平台生态与互联网文化。', 'https://rsshub.app/theverge', 'https://www.theverge.com/tech', 'en', true),
    ('tech', 'WIRED Security', '安全事件、隐私议题与基础设施风险分析。', 'https://rsshub.app/wired/category/security', 'https://www.wired.com/category/security/', 'en', false),
    ('tech', 'Ars Technica AI', '人工智能、芯片与开发工具的深度报道。', 'https://rsshub.app/arstechnica/index', 'https://arstechnica.com/ai/', 'en', false),
    ('tech', 'GitHub Engineering', '工程实践、平台架构与开发者体验更新。', 'https://rsshub.app/github/blog', 'https://github.blog/category/engineering/', 'en', false),
    ('design', 'Dezeen Architecture', '建筑、空间与可持续设计案例精选。', 'https://rsshub.app/dezeen/architecture', 'https://www.dezeen.com/architecture/', 'en', true),
    ('design', 'It''s Nice That Design', '品牌、平面和视觉系统的新作与评论。', 'https://rsshub.app/itsnicethat/articles', 'https://www.itsnicethat.com/articles', 'en', false),
    ('design', 'Smashing Magazine', '设计系统、前端体验与产品细节实践。', 'https://rsshub.app/smashingmagazine', 'https://www.smashingmagazine.com/articles/', 'en', false),
    ('design', 'AIGA Eye on Design', '设计史、出版趋势与创意行业观察。', 'https://rsshub.app/aiga/eye-on-design', 'https://eyeondesign.aiga.org/', 'en', false),
    ('business', 'Bloomberg Tech', '全球公司、资本流向与科技商业化追踪。', 'https://rsshub.app/bloomberg/technology', 'https://www.bloomberg.com/technology', 'en', true),
    ('business', 'Harvard Business Review', '战略、管理与组织创新方法论。', 'https://rsshub.app/hbr/topic/innovation', 'https://hbr.org/topic/innovation', 'en', false),
    ('business', 'Product Hunt Daily', '新品榜单、创作者故事与产品增长线索。', 'https://rsshub.app/producthunt/daily', 'https://www.producthunt.com/', 'en', false),
    ('business', 'Stratechery', '平台竞争、科技公司战略与长期结构分析。', 'https://rsshub.app/stratechery', 'https://stratechery.com/', 'en', true),
    ('finance', 'Financial Times Markets', '宏观市场、利率与资产定价日报。', 'https://rsshub.app/financialtimes/markets', 'https://www.ft.com/markets', 'en', true),
    ('finance', 'WSJ Markets', '华尔街、企业财报与投资者情绪更新。', 'https://rsshub.app/wsj/markets', 'https://www.wsj.com/news/markets', 'en', false),
    ('finance', 'The Economist Finance', '从政策到资本市场的全球财经评论。', 'https://rsshub.app/economist/finance-and-economics', 'https://www.economist.com/finance-and-economics', 'en', false),
    ('culture', 'The New Yorker Culture', '写作、评论与文化议题的长篇内容。', 'https://rsshub.app/newyorker/culture', 'https://www.newyorker.com/culture', 'en', false),
    ('culture', 'Aeon Ideas', '哲学、社会科学与人文思辨文章。', 'https://rsshub.app/aeon', 'https://aeon.co/', 'en', true),
    ('culture', 'The Atlantic Culture', '媒介、社会与创意工作的深度写作。', 'https://rsshub.app/theatlantic/culture', 'https://www.theatlantic.com/culture/', 'en', false)
)
insert into public.feeds (category_id, title, description, url, site_url, language, is_featured)
select
  categories.id,
  seeded_feeds.title,
  seeded_feeds.description,
  seeded_feeds.url,
  seeded_feeds.site_url,
  seeded_feeds.language,
  seeded_feeds.is_featured
from seeded_feeds
join public.feed_categories as categories
  on categories.slug = seeded_feeds.category_slug
on conflict (url) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  site_url = excluded.site_url,
  language = excluded.language,
  is_featured = excluded.is_featured,
  updated_at = now();
