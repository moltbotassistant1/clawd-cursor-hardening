const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const globals = require("globals");

module.exports = [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript compiler already catches undefined variables (including TS namespaces like NodeJS).
      // Disable ESLint's no-undef to avoid false positives in .ts files.
      "no-undef": "off",
      // Allow 'any' with a warning — pervasive in this codebase; tighten gradually
      "@typescript-eslint/no-explicit-any": "warn",
      // Warn on unused vars — codebase has pre-existing ones; enforce as error once cleaned up
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Warn on empty blocks — pre-existing; enforce as error once cleaned up
      "no-empty": "warn",
      // Downgrade noisy escape warnings — not security-relevant
      "no-useless-escape": "warn",
    },
  },
];
