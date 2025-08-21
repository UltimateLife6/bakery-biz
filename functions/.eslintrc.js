module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "quotes": ["error", "double"],
    "max-len": "off",
    "object-curly-spacing": ["error", "never"],
    "comma-dangle": ["error", "always-multiline"],
    "no-trailing-spaces": "error",
    "padded-blocks": "off",
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
};
