import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    include: ["**/*.{test,spec}.ts"],
    exclude: ["node_modules", "e2e", "dist", "supabase", ".agent"],
  },
  resolve: {
    alias: {
      "@": root,
    },
  },
});
