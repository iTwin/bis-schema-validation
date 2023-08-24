const iTwinPlugin = require("@itwin/eslint-plugin");
//const eslintBaseConfig = require("../../common/config/eslint/eslint.config.base");

module.exports = [
  {
    files: ["**/*.ts"],
    ...iTwinPlugin.configs.iTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.ts"],
    rules: {
      "prefer-template": "off",
      "dot-notation": "off",
      "no-console": "off"
    }
  },
  //...eslintBaseConfig,
];