/* global __resourceQuery */

let hotClient = require('webpack-hot-middleware/client' + __resourceQuery);

hotClient.subscribe(function (event) {
    if (event.action === 'reload') {
        window.location.reload()
    }
});
