import * as log from 'electron-log';
import Application from './classes/Application'

process.on('uncaughtException', error => {
    log.error(error)
});

let application = new Application();