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
    rules: {
      // Data-fetching pattern: useEffect(() => { load() }, [deps]) es válido
      "react-hooks/set-state-in-effect": "off",
      // Date.now() y new Date() son válidos dentro de useMemo para cálculos temporales
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
