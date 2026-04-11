-- Seed script for feed_categories and feeds
-- Generated from docs/knowledge/rsshub_routes.csv
-- Execute this after the initial migration to populate the feeds database

-- Insert feed categories
INSERT INTO feed_categories (id, title, slug, sort, created_at, updated_at)
VALUES
  (gen_random_uuid(), '新媒体', 'xin-mei-ti', 1, now(), now()),
  (gen_random_uuid(), '编程', 'bian-cheng', 2, now(), now()),
  (gen_random_uuid(), '音视频', 'yin-shi-pin', 3, now(), now()),
  (gen_random_uuid(), '出行旅游', 'chu-xing-lu-you', 4, now(), now()),
  (gen_random_uuid(), '博客', 'bo-ke', 5, now(), now()),
  (gen_random_uuid(), '二次元', 'er-ci-yuan', 6, now(), now()),
  (gen_random_uuid(), '游戏', 'you-xi', 7, now(), now()),
  (gen_random_uuid(), '图片', 'tu-pian', 8, now(), now()),
  (gen_random_uuid(), '购物', 'gou-wu', 9, now(), now()),
  (gen_random_uuid(), '科学期刊', 'ke-xue-qi-kan', 10, now(), now()),
  (gen_random_uuid(), '传统媒体', 'chuan-tong-mei-ti', 11, now(), now()),
  (gen_random_uuid(), '社交媒体', 'she-jiao-mei-ti', 12, now(), now()),
  (gen_random_uuid(), '直播', 'zhi-bo', 13, now(), now()),
  (gen_random_uuid(), '大学', 'da-xue', 14, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- Create a mapping of category slug to id for feeds insertion
DO $$
DECLARE
  cat RECORD;
BEGIN
  -- Clear existing feeds to avoid duplicates (optional - remove if you want to append)
  -- TRUNCATE feeds CASCADE;
  
  -- Insert feeds from RSS routes CSV data
  -- This is a sample of the 869 feeds - the full data should be imported via CSV
  
  -- Category: 新媒体 (xin-mei-ti)
  INSERT INTO feeds (id, category_id, title, url, image_url, site_url, language, is_featured, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    fc.id,
    '36kr资讯热榜',
    'https://rsshub.app/36kr/hot-list',
    'https://www.google.com/s2/favicons?sz=64&domain=36kr.com',
    'https://36kr.com',
    'zh',
    false,
    now(),
    now()
  FROM feed_categories fc WHERE fc.slug = 'xin-mei-ti'
  ON CONFLICT (url) DO NOTHING;

  INSERT INTO feeds (id, category_id, title, url, image_url, site_url, language, is_featured, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    fc.id,
    '52hrtt新闻',
    'https://rsshub.app/52hrtt/global',
    'https://www.google.com/s2/favicons?sz=64&domain=52hrtt.com',
    'https://52hrtt.com',
    'zh',
    false,
    now(),
    now()
  FROM feed_categories fc WHERE fc.slug = 'xin-mei-ti'
  ON CONFLICT (url) DO NOTHING;

  -- Category: 编程 (bian-cheng)
  INSERT INTO feeds (id, category_id, title, url, image_url, site_url, language, is_featured, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    fc.id,
    'GitHub Trending',
    'https://rsshub.app/github/trending',
    'https://www.google.com/s2/favicons?sz=64&domain=github.com',
    'https://github.com',
    'en',
    true,
    now(),
    now()
  FROM feed_categories fc WHERE fc.slug = 'bian-cheng'
  ON CONFLICT (url) DO NOTHING;

  -- Note: Full import of 869 feeds should be done via a CSV import script
  -- This seed provides a sample of the data structure
  
END $$;

-- Create index for faster feed queries
CREATE INDEX IF NOT EXISTS idx_feeds_category_id ON feeds(category_id);
CREATE INDEX IF NOT EXISTS idx_feeds_title ON feeds(title);
CREATE INDEX IF NOT EXISTS idx_feeds_url ON feeds(url);
