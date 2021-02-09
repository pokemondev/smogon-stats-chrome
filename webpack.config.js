const path = require('path');
const glob = require("glob");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = {
    //devtool: 'inline-sourcemap',
    entry: {
        app: {
            import: path.resolve(__dirname, 'src', 'app.ts'),
            dependOn: 'core'
        },
        background: path.resolve(__dirname, 'src', 'background.ts'),
        showdownExtensions: path.resolve(__dirname, 'src', 'showdownExtensions.ts'),
        core: {
            import: glob.sync("./src/core/**/*.ts"),
            dependOn: 'data'
        },
        data: glob.sync('./data/**/*.json'),
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js'
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
            "node_modules"
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
                { from: "./src/css", to: "css" },
                { from: "./src/img", to: "img" },
                { from: "./src/js", to: "js" },
                { from: "./src/popup.html", to: "popup.html" },
            ],
        }),
    ]
}