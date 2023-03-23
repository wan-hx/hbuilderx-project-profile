// eslint.org官网：https://eslint.org/docs/latest/use/getting-started
module.exports = {
    root: true,
    parserOptions: {
        parser: require.resolve('babel-eslint'),
        ecmaVersion: 2018,
        sourceType: 'module'
    },
    env: {
        es6: true,
        node: true,
        browser: true
    },
    plugins: [
        "babel"
    ],
    extends: [
        "eslint:recommended"
    ],
    globals: {},
    rules: {
        'no-console': process.env.NODE_ENV !== 'production' ? 0 : 2,
        'no-useless-escape': 0,
        'no-empty': 0,
        "indent": ["error", 4],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "linebreak-style": ["error", "unix"],
    }
}
