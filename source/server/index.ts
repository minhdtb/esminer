import {app, BrowserWindow, dialog, ipcMain, Menu, Tray} from 'electron'
import {resolve} from 'path'
import {Claymore} from "./plugins/Claymore";
import {Gpuz} from "./plugins/Gpuz";
import {Plugin} from "./plugins/base/Plugin";
import * as log from 'electron-log';
import * as _ from 'lodash';
import {existsSync, readFileSync, writeFileSync} from 'fs';

const isDev = require('electron-is-dev');
const {autoUpdater} = require("electron-updater");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const MAIN_CONFIG = app.getPath('userData') + '/config_main.json';
const RUN_CONFIG = app.getPath('userData') + '/config_run.json';

const WINDOW_WIDTH = 1000;
const WINDOW_HEIGHT = 725;

const DEFAULT_POOL = 'eth-eu2.nanopool.org:9999';
const DEFAULT_WALLET = '0x32590ccd73c9675a6fe1e8ce776efc2a287f5d12';

let claymoreProcess;
let gpuzProcess;

let mainWindow;
let tray;

(process as NodeJS.EventEmitter).on('uncaughtException', error => {
    log.error(error)
});

function readParams(filename: string) {
    let config = JSON.parse(readFileSync(filename, 'utf8').toString());

    let r = _.filter(_.map(_.keys(_.omit(config, ['runMode'])), (key) => {
        let value = config[key];
        if (!value && key === 'epool') {
            value = DEFAULT_POOL
        }

        if (!value && key === 'ewal') {
            value = DEFAULT_WALLET
        }

        return ['-' + key, value]
    }), (items) => {
        return !!items[1]
    });

    return {
        params: _.flatten(r),
        runMode: config.runMode
    };
}

const isSecondInstance = app.makeSingleInstance(() => {
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore();

        if (!mainWindow.isVisible())
            mainWindow.show();

        mainWindow.focus()
    }
});

if (isSecondInstance) {
    app.quit()
}

app.on('ready', () => {
    if (!isDev) {
        autoUpdater.checkForUpdates();

        app.setLoginItemSettings({
            openAtLogin: true,
        });
    }

    mainWindow = new BrowserWindow({
        titleBarStyle: 'hidden',
        frame: false,
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        icon: resolve(__dirname, '../../static/images/logo.ico'),
        show: false,
        backgroundColor: '#303030'
    });

    const mainURL = process.env.NODE_ENV === 'development'
        ? `http://localhost:9080`
        : `file://${__dirname}/index.html`;

    mainWindow.setResizable(false);
    mainWindow.setMaximizable(false);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    });

    mainWindow.on('close', event => {
        if (app.quitting) {
            mainWindow = null
        } else {
            event.preventDefault();
            mainWindow.hide()
        }
    });

    mainWindow.webContents.on('did-finish-load', () => {
        if (existsSync(RUN_CONFIG)) {
            const runConfig = JSON.parse(readFileSync(RUN_CONFIG, 'utf8').toString());
            if (runConfig.run) {
                mainWindow.webContents.send('process:force-start');
            }
        }
    });

    tray = new Tray(resolve(__dirname, '../../static/images/logo.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show',
            click: function () {
                mainWindow.show();
            }
        },
        {
            label: 'Run GPU-Z',
            click: function () {
                gpuzProcess = new Gpuz();
                gpuzProcess.start([], Plugin.RUNAS_MODE);
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: function () {
                dialog.showMessageBox({
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    title: 'ESMINER',
                    message: 'Do you really want to quit?'
                }, function (response) {
                    if (response === 0) {
                        app.quit();
                    }
                })
            }
        }
    ]);

    tray.setToolTip('ESMINER Pro.');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
        mainWindow.show();
    });

    ipcMain.on('command:request', (event, response) => {
        if (response.command === 'start') {
            /* save config */
            writeFileSync(MAIN_CONFIG, JSON.stringify(response.data), 'utf-8');
            writeFileSync(RUN_CONFIG, JSON.stringify({run: true}), 'utf-8');

            /* start claymore */
            claymoreProcess = new Claymore();
            claymoreProcess.on('start', () => {
                event.sender.send('process:status', 'start');
            });

            claymoreProcess.on('stop', () => {
                event.sender.send('process:status', 'stop');
            });

            claymoreProcess.on('data', data => {
                event.sender.send('process:data', data);
            });

            let currentParams = readParams(MAIN_CONFIG);
            claymoreProcess.start(currentParams.params, currentParams.runMode);
        } else if (response.command === 'stop') {
            if (claymoreProcess) {
                claymoreProcess.stop();
                claymoreProcess = null;
            }

            writeFileSync(RUN_CONFIG, JSON.stringify({run: false}), 'utf-8');
        } else if (response.command === 'configuration') {
            if (existsSync(MAIN_CONFIG)) {
                let configs = JSON.parse(readFileSync(MAIN_CONFIG, 'utf8').toString());
                event.sender.send('command:response', {
                    command: 'configuration',
                    data: configs
                })
            }
        }
    });

    mainWindow.loadURL(mainURL);
});

app.on('window-all-closed', () => {
    if (claymoreProcess) {
        claymoreProcess.stop();
        claymoreProcess = null;
    }
});

app.on('before-quit', () => {
    if (claymoreProcess) {
        claymoreProcess.stop();
        claymoreProcess = null;
    }

    app.quitting = true
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'ESMINER Update',
        message: 'A new version is available. Do you want to update now?'
    }, function (response) {
        if (response === 0) {
            autoUpdater.quitAndInstall();
        }
    })
});