const path = require('path');
const glob = require("glob");
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
        core: glob.sync("./src/core/*.ts") 
        // helpers: [
        //   path.resolve(__dirname, 'src', 'models.ts'),
        //   //path.resolve(__dirname, 'src', 'background.ts'),
        // ],
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
                    // Path to your custom js file, which has Handlebars with custom helpers registered
                    runtime: path.resolve(__dirname, './src/handlebarsRuntime')
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
            //jquery: "jquery/src/jquery"

         }
    },
    // optimization: {
    //     mergeDuplicateChunks: false,
    // },
    plugins: [
        new webpack.ProgressPlugin(),

    //   new webpack.ProvidePlugin({
    //     $: "jquery",
    //     jQuery: "jquery"
    //   })
    ]
}