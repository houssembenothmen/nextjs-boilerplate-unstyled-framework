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
    // components/ui is a vendored, self-contained component library, not
    // day-to-day application code — lint your own app/ and lib/ instead.
    // (It's already exercised by a real build + runtime smoke test.)
    "components/ui/**",
  ]),
  {
    // lib/api intentionally mirrors a loosely-typed `params: any = {}` style
    // (matching the original snippet this was built from) so any endpoint's
    // shape can be passed through without fighting the type checker.
    files: ["lib/api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
