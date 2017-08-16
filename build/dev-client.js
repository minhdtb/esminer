const hotClient = require('webpack-hot-middleware/client?noInfo=true&reload=true');

hotClient.subscribe(event => {
    if (event.action === 'reload') {
        window.location.reload()
    }

    if (event.action === 'compiling') {
        document.body.innerHTML += `<h3>Compiling Main Process...</h3>`
    }
});
