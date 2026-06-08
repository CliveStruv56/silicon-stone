import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Next 15's eslint-config-next ships eslintrc-style configs, so the canonical
// flat-config setup wraps them with FlatCompat (matches create-next-app@15).
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
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
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
