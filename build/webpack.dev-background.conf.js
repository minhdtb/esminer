let webpack = require('webpack');
let merge = require('webpack-merge');
let CopyWebpackPlugin = require('copy-webpack-plugin');
let webpackBaseConfig = require('./webpack.base.conf');
let config = require('../config');

module.exports = merge(webpackBaseConfig, {
    entry: {
        background: './source/server/main.js'
    },
    devtool: '#source-map',
    output: {
        publicPath: '/'
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: './source/package.json', to: '.'}
        ]),

        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"development"',
                HOT: JSON.stringify(process.env.HOT),
                PORT: JSON.stringify(process.env.PORT || config.dev.port)
            }
        }),

        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ],
    stats: {
        colors: true
    }
});
