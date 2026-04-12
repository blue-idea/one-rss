const fs = require("fs");

const files = [
  "modules/article/api/toggleFavorite.ts",
  "modules/article/api/updateReadingProgress.ts",
  "modules/article/api/fetchArticle.ts",
  "modules/subscriptions/api/fetchSubscriptions.ts",
];

files.forEach((f) => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, "utf8");
    content = content.replace(
      /\\nimport { getSupabaseUrl, getSupabaseAnonKey } from "@\/modules\/today\/api\/getSupabaseConfig";/,
      '\nimport { getSupabaseUrl, getSupabaseAnonKey } from "@/modules/today/api/getSupabaseConfig";',
    );
    fs.writeFileSync(f, content, "utf8");
  }
});
