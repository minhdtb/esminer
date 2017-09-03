import * as log from 'electron-log';
import Application from './classes/Application'
import * as path from "path";

process.env.APP_PATH = path.resolve(__dirname, '../../');

process.on('uncaughtException', error => {
    log.error(error)
});

let application = new Application();