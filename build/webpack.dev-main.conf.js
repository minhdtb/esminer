let webpack = require('webpack');
let merge = require('webpack-merge');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let webpackBaseConfig = require('./webpack.base.conf');
let config = require('../config');

let devServerUrl = 'http://localhost:' + config.dev.port + '/';

let webpackConfig = merge(webpackBaseConfig, {
    entry: {
        app: [
            './build/dev-client?path=' + devServerUrl + '__webpack_hmr&noInfo=true&reload=true',
            './source/main.js'
        ]
    },
    devtool: '#source-map',
    output: {
        publicPath: devServerUrl
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"development"'
            }
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new HtmlWebpackPlugin({
            filename: 'main.html',
            template: './source/main.html',
            excludeChunks: ['devtools'],
            inject: true
        })
    ]
});

module.exports = webpackConfig;

