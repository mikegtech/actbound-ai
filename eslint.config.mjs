import { createActboundEslintConfig } from "./packages/config/eslint/base.mjs";

export default createActboundEslintConfig({
  webFiles: ["apps/web/src/**/*.{ts,tsx}"],
  rules: {
    "react-refresh/only-export-components": "off",
  },
});
