module.exports = {
    bracketSpacing: false,
    singleQuote: true,
    jsxBracketSameLine: true,
    trailingComma: 'es5',
    printWidth: 120,
    parser: 'babel',

    overrides: [{
        files: esNextPaths,
        options: {
            trailingComma: 'all',
        },
    }, ],
};
