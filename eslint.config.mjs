import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  globalIgnores([
    "dist/**",
    ".next/**",
    ".astro/**",
    // Old Next.js app, pending removal.
    "app/**",
    "components/**",
    "proxy.ts",
    "next.config.ts",
    "next-env.d.ts",
  ]),
]);
