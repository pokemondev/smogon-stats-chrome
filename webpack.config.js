const path = require('path');
const { globSync } = require("glob");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = (_, argv = {}) => {
    const isProduction = argv.mode === 'production';

    return {
        mode: isProduction ? 'production' : 'development',
        cache: {
            type: 'filesystem'
        },
        devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
        entry: {
            app: {
                import: path.resolve(__dirname, 'src', 'app.ts'),
                dependOn: 'core'
            },
            showdownExtensions: path.resolve(__dirname, 'src', 'showdownExtensions.ts'),
            core: {
                import: globSync('./src/core/**/*.ts', { cwd: __dirname, absolute: true }),
                dependOn: 'data'
            },
            data: globSync('./data/**/*.json', { cwd: __dirname, absolute: true }),
        },
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: '[name].js',
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    loader: 'ts-loader'
                },
                {
                    test: /\.hbs$/,
                    loader: 'handlebars-loader',
                    options: {
                        helperDirs: [
                            path.resolve(__dirname, './src/templates/helpers')
                        ],
                        knownHelpers: ['safePkmName'],
                    }
                }
            ]
        },
        resolve: {
            modules: [
                path.resolve(__dirname, 'src'),
                'node_modules'
            ],
            extensions: ['.js', '.ts'],
            alias: {
                handlebars: 'handlebars/dist/handlebars.min.js',
            }
        },
        plugins: [
            new webpack.ProgressPlugin(),
            new CopyPlugin({
                patterns: [
                    { from: './src/css', to: 'css' },
                    { from: './src/img', to: 'img' },
                    { from: './node_modules/materialize-css/dist/css/materialize.min.css', to: 'css/materialize.min.css' },
                    {
                        from: './node_modules/materialize-css/dist/js/materialize.min.js',
                        to: 'js/materialize.min.js',
                        info: { minimized: true }
                    },
                    { from: './src/popup.html', to: 'popup.html' },
                ],
            }),
        ],
        performance: {
            hints: false
        },
        stats: 'errors-warnings'
    };
};