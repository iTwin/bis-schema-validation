const iTwinPlugin = require("@itwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.ts"],
    ...iTwinPlugin.configs.iTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.ts"],
    rules: {
      "prefer-template": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/dot-notation": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    }
  },
];