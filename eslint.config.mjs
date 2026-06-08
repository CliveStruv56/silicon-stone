import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    // Local tooling / generated outputs — not part of the project source:
    ".agent/**",
    ".agents/**",
    ".claude/**",
    ".understand-anything/**",
    "generated-docs/**",
    "outputs/**",
  ]),
]);

export default eslintConfig;
