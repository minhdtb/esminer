const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const config = require('../config');
const baseWebpackConfig = require('./webpack.base.conf');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = merge(baseWebpackConfig, {
    entry: {
        app: './source/client/main.js',
        background: './source/server/main.js'
    },
    devtool: config.build.productionSourceMap ? '#source-map' : false,
    output: {
        filename: '[name].js',
        chunkFilename: '[id].js'
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: './source/package.json', to: '.'},
            {from: './static', to: 'static'},
            {from: './claymore', to: 'claymore'}
        ]),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new UglifyJSPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new ExtractTextPlugin(path.join(config.build.assetsSubDirectory, '[name].css')),
        new HtmlWebpackPlugin({
            filename: 'main.html',
            template: './source/client/main.html',
            excludeChunks: ['background'],
            inject: true,
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeAttributeQuotes: true
            }
        })
    ]
});
