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
    // Prepend missing AuthApiError
    if (!content.includes("AuthApiError")) {
      content =
        'import { AuthApiError } from "@/modules/auth/api/authApiError";\n' +
        content;
      fs.writeFileSync(f, content, "utf8");
    }
  }
});
