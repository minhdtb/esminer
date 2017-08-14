let express = require('express');
let webpack = require('webpack');
let proxyMiddleware = require('http-proxy-middleware');
let webpackConfig = require('./webpack.dev-main.conf');
let config = require('../config');

let app = express();
let compiler = webpack(webpackConfig);

let port = process.env.PORT || config.dev.port;
let proxyTable = config.dev.proxyTable;
let devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    noInfo: true,
    stats: {
        colors: true,
        chunks: false
    }
});

let hotMiddleware = require('webpack-hot-middleware')(compiler);
compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
        hotMiddleware.publish({action: 'reload'});
        cb()
    })
});

Object.keys(proxyTable).forEach(function (context) {
    let options = proxyTable[context];
    if (typeof options === 'string') {
        options = {target: options}
    }

    app.use(proxyMiddleware(context, options))
});

app.use(require('connect-history-api-fallback')());
app.use(devMiddleware);
app.use(hotMiddleware);
app.use('/static', express.static('./static'));

module.exports = app.listen(port, function (err) {
    if (err) {
        console.log(err);
        return
    }

    console.log('Listening at http://localhost:' + port)
});
