// eslint.org官网：https://eslint.org/docs/latest/use/getting-started
export default [{
    files: ["src/**/*.js"],
    ignores: ["**/*.config.js"],
    languageOptions: {
        ecmaVersion: 5
    },
    linterOptions: {
        noInlineConfig: false,
        reportUnusedDisableDirectives: true
    },
    rules: {
        semi: "error",
        "prefer-const": "error"
    }
}]
