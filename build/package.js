let argv = require('minimist')(process.argv.slice(2));
let packager = require('electron-packager');
let appManifest = require('../source/package.json');
let devManifest = require('../package.json');
let config = require('../config');

function getElectronVersion() {
    let v = config.release.electronVersion ||
        (devManifest.devDependencies || {})['electron-prebuilt'] ||
        (devManifest.dependencies || {})['electron-prebuilt'];

    if (v) {
        return v.replace(/^\D+/, '')
    } else {
        console.log(
            'No electron version was found in config.js or package.json.'
        )
    }
}

let packagerConfig = {
    dir: config.build.outputRoot,
    out: config.build.releasesRoot,
    name: appManifest.productName,
    appVersion: appManifest.version,
    electronVersion: getElectronVersion(),
    platform: argv.platform || config.release.platform,
    arch: argv.arch || 'all',
    prune: true,
    overwrite: true,
    ignore: Object.keys((appManifest.devDependencies || {})).map(function (name) {
        return '/node_modules/' + name + '($|/)'
    })
};

packager(packagerConfig, function (err, appPath) {
    if (err) {
        console.error(err);
        process.exit(1)
    }

    console.log('packaged to ' + appPath)
});
