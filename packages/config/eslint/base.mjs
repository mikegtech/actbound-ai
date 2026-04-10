import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export function createActboundEslintConfig({ webFiles = [], rules = {} } = {}) {
  return tseslint.config(
    {
      ignores: ["**/dist/**", "**/node_modules/**", "docs/openapi/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ["**/*.{ts,tsx,js,cjs,mjs}"],
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        globals: {
          ...globals.node,
          ...globals.browser,
        },
      },
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
          },
        ],
      },
    },
    {
      files: ["**/*.cjs"],
      languageOptions: {
        sourceType: "commonjs",
      },
      rules: {
        "@typescript-eslint/no-require-imports": "off",
      },
    },
    {
      files: webFiles,
      plugins: {
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        "react-refresh/only-export-components": [
          "warn",
          {
            allowConstantExport: true,
          },
        ],
        ...rules,
      },
    },
  );
}
