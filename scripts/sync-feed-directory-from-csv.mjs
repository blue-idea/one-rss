import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CSV_PATH = resolve(ROOT, "docs/knowledge/rsshub_routes.csv");
const TS_PATH = resolve(
  ROOT,
  "modules/discovery/data/rsshub-routes.ts",
);
const SQL_PATH = resolve(
  ROOT,
  "supabase/migrations/20260410110000_feed_directory_seed.sql",
);

function parseCsv(text) {
  const rows = [];
  let currentField = "";
  let currentRow = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        currentField += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      currentField = "";

      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

function escapeTypeScript(value) {
  return JSON.stringify(value);
}

function escapeSql(value) {
  return value.replaceAll("'", "''");
}

function toBoolean(value) {
  return value.trim().toLowerCase() === "true";
}

function toInteger(value) {
  return Number.parseInt(value, 10);
}

function formatTypeScript(rows) {
  const categories = [];
  const categorySeen = new Set();

  for (const row of rows) {
    if (categorySeen.has(row.category_slug)) {
      continue;
    }

    categorySeen.add(row.category_slug);
    categories.push({
      slug: row.category_slug,
      title: row.category_title,
      sort: toInteger(row.category_sort),
    });
  }

  const categoryEntries = categories
    .map(
      (category) =>
        `  { slug: ${escapeTypeScript(category.slug)}, title: ${escapeTypeScript(category.title)}, sort: ${category.sort} },`,
    )
    .join("\n");

  const feedEntries = rows
    .map(
      (row) => `  {
    id: ${escapeTypeScript(row.feed_id)},
    categorySlug: ${escapeTypeScript(row.category_slug)},
    title: ${escapeTypeScript(row.feed_title)},
    description: ${escapeTypeScript(row.description)},
    rssUrl: ${escapeTypeScript(row.rss_url)},
    siteUrl: ${escapeTypeScript(row.site_url)},
    language: ${escapeTypeScript(row.language)},
    isFeatured: ${toBoolean(row.is_featured)},
  },`,
    )
    .join("\n");

  return `// Generated from docs/knowledge/rsshub_routes.csv by scripts/sync-feed-directory-from-csv.mjs

export type FeedCategorySeed = {
  slug: string;
  title: string;
  sort: number;
};

export type FeedSeed = {
  id: string;
  categorySlug: string;
  title: string;
  description: string;
  rssUrl: string;
  siteUrl: string;
  language: string;
  isFeatured: boolean;
};

export const feedCategorySeeds: FeedCategorySeed[] = [
${categoryEntries}
];

export const feedSeeds: FeedSeed[] = [
${feedEntries}
];
`;
}

function formatSql(rows) {
  const categories = [];
  const categorySeen = new Set();

  for (const row of rows) {
    if (categorySeen.has(row.category_slug)) {
      continue;
    }

    categorySeen.add(row.category_slug);
    categories.push({
      slug: row.category_slug,
      title: row.category_title,
      sort: toInteger(row.category_sort),
    });
  }

  const categoryValues = categories
    .map(
      (category) =>
        `  ('${escapeSql(category.title)}', '${escapeSql(category.slug)}', ${category.sort})`,
    )
    .join(",\n");

  const feedValues = rows
    .map(
      (row) =>
        `    ('${escapeSql(row.category_slug)}', '${escapeSql(row.feed_title)}', '${escapeSql(row.description)}', '${escapeSql(row.rss_url)}', '${escapeSql(row.site_url)}', '${escapeSql(row.language)}', ${toBoolean(row.is_featured)})`,
    )
    .join(",\n");

  return `-- Generated from docs/knowledge/rsshub_routes.csv by scripts/sync-feed-directory-from-csv.mjs

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
${categoryValues}
on conflict (slug) do update
set
  title = excluded.title,
  sort = excluded.sort,
  updated_at = now();

with seeded_feeds(category_slug, title, description, url, site_url, language, is_featured) as (
  values
${feedValues}
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
`;
}

async function main() {
  const csv = await readFile(CSV_PATH, "utf8");
  const [headerRow, ...dataRows] = parseCsv(csv);

  if (!headerRow || headerRow.length === 0) {
    throw new Error(`CSV header is missing: ${CSV_PATH}`);
  }

  const rows = dataRows.map((cells) =>
    Object.fromEntries(headerRow.map((header, index) => [header, cells[index] ?? ""])),
  );

  await mkdir(dirname(TS_PATH), { recursive: true });
  await mkdir(dirname(SQL_PATH), { recursive: true });
  await writeFile(TS_PATH, formatTypeScript(rows));
  await writeFile(SQL_PATH, formatSql(rows));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
