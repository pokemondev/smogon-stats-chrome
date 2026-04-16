const fs = require('fs');
const path = require('path');
const glob = require("glob");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

class RemoveStaleBuildFilesPlugin {
    constructor(files) {
        this.files = files;
    }

    apply(compiler) {
        const removeFiles = () => {
            for (const file of this.files) {
                const filePath = path.resolve(compiler.options.output.path, file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        };

        compiler.hooks.beforeRun.tap('RemoveStaleBuildFilesPlugin', removeFiles);
        compiler.hooks.watchRun.tap('RemoveStaleBuildFilesPlugin', removeFiles);
    }
}

module.exports = {
    //devtool: 'inline-sourcemap',
    entry: {
        app: {
            import: path.resolve(__dirname, 'src', 'app.ts'),
            dependOn: 'core'
        },
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
        new RemoveStaleBuildFilesPlugin(['background.js']),
        new webpack.ProgressPlugin(),
        new CopyPlugin({
            patterns: [
                { from: "./src/css", to: "css" },
                { from: "./src/img", to: "img" },
                { from: "./node_modules/materialize-css/dist/css/materialize.min.css", to: "css/materialize.min.css" },
                {
                    from: "./node_modules/materialize-css/dist/js/materialize.min.js",
                    to: "js/materialize.min.js",
                    info: { minimized: true }
                },
                { from: "./src/popup.html", to: "popup.html" },
            ],
        }),
    ]
}