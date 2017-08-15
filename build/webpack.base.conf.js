const path = require('path');
const webpack = require('webpack');
const config = require('../config');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    output: {
        path: config.build.outputRoot,
        filename: '[name].js'
    },
    performance: {
        hints: false
    },
    target: 'node',
    node: {
        __filename: false,
        __dirname: false
    },
    resolve: {
        extensions: ['.js', '.vue'],
        alias: {
            app: path.resolve(__dirname, '../app'),
            'vue$': 'vue/dist/vue.esm.js'
        }
    },
    module: {
        loaders: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    optimizeSSR: false,
                    loaders: [
                        {
                            css: ExtractTextPlugin.extract({
                                use: 'css-loader',
                                fallback: 'vue-style-loader'
                            })
                        }
                    ],
                    preserveWhitespace: false,
                    postcss: [
                        require('autoprefixer')({
                            browsers: ['last 3 versions']
                        })
                    ]
                }
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /vue-devtools|node_modules/,
                options: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.json$/,
                loader: 'json'
            },
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: path.join(config.build.assetsSubDirectory, '[name].[ext]').replace('\\', '/')
                }
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin("style.css"),
        new webpack.ExternalsPlugin('commonjs2', [
            'desktop-capturer',
            'electron',
            'ipc',
            'ipc-renderer',
            'native-image',
            'remote',
            'web-frame',
            'clipboard',
            'crash-reporter',
            'screen',
            'shell'
        ])
    ]
};
