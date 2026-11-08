import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  {
    rules: { "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }] },
  },
  {
    // Async server components render once per request, so reading the clock there is intended.
    files: ["src/app/**/page.tsx", "src/app/**/layout.tsx"],
    rules: { "react-hooks/purity": "off" },
  },
];

export default config;
