// Generated from docs/knowledge/rsshub_routes.csv by scripts/sync-feed-directory-from-csv.mjs

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
  { slug: "tech", title: "科技", sort: 1 },
  { slug: "design", title: "设计", sort: 2 },
  { slug: "business", title: "商业", sort: 3 },
  { slug: "finance", title: "财经", sort: 4 },
  { slug: "culture", title: "文化", sort: 5 },
];

export const feedSeeds: FeedSeed[] = [
  {
    id: "techcrunch-startups",
    categorySlug: "tech",
    title: "TechCrunch Startups",
    description: "聚焦创业公司、融资动态与新产品发布。",
    rssUrl: "https://rsshub.app/techcrunch/startups",
    siteUrl: "https://techcrunch.com/startups/",
    language: "en",
    isFeatured: true,
  },
  {
    id: "the-verge-tech",
    categorySlug: "tech",
    title: "The Verge Tech",
    description: "覆盖消费电子、平台生态与互联网文化。",
    rssUrl: "https://rsshub.app/theverge",
    siteUrl: "https://www.theverge.com/tech",
    language: "en",
    isFeatured: true,
  },
  {
    id: "wired-security",
    categorySlug: "tech",
    title: "WIRED Security",
    description: "安全事件、隐私议题与基础设施风险分析。",
    rssUrl: "https://rsshub.app/wired/category/security",
    siteUrl: "https://www.wired.com/category/security/",
    language: "en",
    isFeatured: false,
  },
  {
    id: "ars-technica-ai",
    categorySlug: "tech",
    title: "Ars Technica AI",
    description: "人工智能、芯片与开发工具的深度报道。",
    rssUrl: "https://rsshub.app/arstechnica/index",
    siteUrl: "https://arstechnica.com/ai/",
    language: "en",
    isFeatured: false,
  },
  {
    id: "github-blog-engineering",
    categorySlug: "tech",
    title: "GitHub Engineering",
    description: "工程实践、平台架构与开发者体验更新。",
    rssUrl: "https://rsshub.app/github/blog",
    siteUrl: "https://github.blog/category/engineering/",
    language: "en",
    isFeatured: false,
  },
  {
    id: "dezeen-architecture",
    categorySlug: "design",
    title: "Dezeen Architecture",
    description: "建筑、空间与可持续设计案例精选。",
    rssUrl: "https://rsshub.app/dezeen/architecture",
    siteUrl: "https://www.dezeen.com/architecture/",
    language: "en",
    isFeatured: true,
  },
  {
    id: "itsnicethat-design",
    categorySlug: "design",
    title: "It's Nice That Design",
    description: "品牌、平面和视觉系统的新作与评论。",
    rssUrl: "https://rsshub.app/itsnicethat/articles",
    siteUrl: "https://www.itsnicethat.com/articles",
    language: "en",
    isFeatured: false,
  },
  {
    id: "smashing-magazine",
    categorySlug: "design",
    title: "Smashing Magazine",
    description: "设计系统、前端体验与产品细节实践。",
    rssUrl: "https://rsshub.app/smashingmagazine",
    siteUrl: "https://www.smashingmagazine.com/articles/",
    language: "en",
    isFeatured: false,
  },
  {
    id: "aiga-eye-on-design",
    categorySlug: "design",
    title: "AIGA Eye on Design",
    description: "设计史、出版趋势与创意行业观察。",
    rssUrl: "https://rsshub.app/aiga/eye-on-design",
    siteUrl: "https://eyeondesign.aiga.org/",
    language: "en",
    isFeatured: false,
  },
  {
    id: "bloomberg-tech",
    categorySlug: "business",
    title: "Bloomberg Tech",
    description: "全球公司、资本流向与科技商业化追踪。",
    rssUrl: "https://rsshub.app/bloomberg/technology",
    siteUrl: "https://www.bloomberg.com/technology",
    language: "en",
    isFeatured: true,
  },
  {
    id: "hbr-innovation",
    categorySlug: "business",
    title: "Harvard Business Review",
    description: "战略、管理与组织创新方法论。",
    rssUrl: "https://rsshub.app/hbr/topic/innovation",
    siteUrl: "https://hbr.org/topic/innovation",
    language: "en",
    isFeatured: false,
  },
  {
    id: "product-hunt",
    categorySlug: "business",
    title: "Product Hunt Daily",
    description: "新品榜单、创作者故事与产品增长线索。",
    rssUrl: "https://rsshub.app/producthunt/daily",
    siteUrl: "https://www.producthunt.com/",
    language: "en",
    isFeatured: false,
  },
  {
    id: "stratechery",
    categorySlug: "business",
    title: "Stratechery",
    description: "平台竞争、科技公司战略与长期结构分析。",
    rssUrl: "https://rsshub.app/stratechery",
    siteUrl: "https://stratechery.com/",
    language: "en",
    isFeatured: true,
  },
  {
    id: "ft-markets",
    categorySlug: "finance",
    title: "Financial Times Markets",
    description: "宏观市场、利率与资产定价日报。",
    rssUrl: "https://rsshub.app/financialtimes/markets",
    siteUrl: "https://www.ft.com/markets",
    language: "en",
    isFeatured: true,
  },
  {
    id: "wsj-markets",
    categorySlug: "finance",
    title: "WSJ Markets",
    description: "华尔街、企业财报与投资者情绪更新。",
    rssUrl: "https://rsshub.app/wsj/markets",
    siteUrl: "https://www.wsj.com/news/markets",
    language: "en",
    isFeatured: false,
  },
  {
    id: "economist-finance",
    categorySlug: "finance",
    title: "The Economist Finance",
    description: "从政策到资本市场的全球财经评论。",
    rssUrl: "https://rsshub.app/economist/finance-and-economics",
    siteUrl: "https://www.economist.com/finance-and-economics",
    language: "en",
    isFeatured: false,
  },
  {
    id: "newyorker-culture",
    categorySlug: "culture",
    title: "The New Yorker Culture",
    description: "写作、评论与文化议题的长篇内容。",
    rssUrl: "https://rsshub.app/newyorker/culture",
    siteUrl: "https://www.newyorker.com/culture",
    language: "en",
    isFeatured: false,
  },
  {
    id: "aeon-ideas",
    categorySlug: "culture",
    title: "Aeon Ideas",
    description: "哲学、社会科学与人文思辨文章。",
    rssUrl: "https://rsshub.app/aeon",
    siteUrl: "https://aeon.co/",
    language: "en",
    isFeatured: true,
  },
  {
    id: "atlantic-culture",
    categorySlug: "culture",
    title: "The Atlantic Culture",
    description: "媒介、社会与创意工作的深度写作。",
    rssUrl: "https://rsshub.app/theatlantic/culture",
    siteUrl: "https://www.theatlantic.com/culture/",
    language: "en",
    isFeatured: false,
  },
];
