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
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      /**
       * The prototype intentionally reads browser-only state after mount:
       * the demo dataset and sidebar preference load in an effect, deep links
       * are read from `location.hash`, and form dialogs reset when they open.
       * Those are deliberate patterns, not accidental cascading renders, so the
       * React Compiler advisories stay visible as warnings instead of errors.
       */
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;

