import {app, BrowserWindow, dialog, ipcMain, Menu, Tray} from 'electron'
import {resolve} from 'path'
import {ProcessManager} from "./utils/ProcessManager";

const isDev = require('electron-is-dev');
const {autoUpdater} = require("electron-updater");
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('Application is starting...');

const _ = require('lodash');
const fs = require('fs');

const MAIN_CONFIG = app.getPath('userData') + '/config_main.json';
const RUN_CONFIG = app.getPath('userData') + '/config_run.json';

const WINDOW_WIDTH = 1000;
const WINDOW_HEIGHT = 725;

const DEFAULT_POOL = 'eth-eu2.nanopool.org:9999';
const DEFAULT_WALLET = '0x32590ccd73c9675a6fe1e8ce776efc2a287f5d12';

let claymoreProcess;
let gpuzProcess;

(process as NodeJS.EventEmitter).on('uncaughtException', error => {
    log.error(error)
});

function connect(host, port, options) {
    if (!claymoreProcess)
        return;

    let socket = require('net').Socket();
    socket.isConnected = false;
    socket.setEncoding('ascii');

    socket.on('data', d => {
        if (options.cb)
            options.cb(JSON.parse(d));
    });

    socket.on('close', () => {
        socket = null;
        setTimeout(() => {
            connect(host, port, options)
        }, options.timeout ? options.timeout : 1000);
    });

    socket.on('error', () => {
        /* do nothing */
    });

    function ping() {
        if (socket && socket.isConnected) {
            if (options.pingData) {
                socket.write(JSON.stringify(options.pingData));
                setTimeout(ping, options.ping ? options.ping : 200);
            }
        }
    }

    socket.connect(port, host, () => {
        socket.isConnected = true;
        ping();
    })
}

function convertData(input) {
    if (!input)
        return;

    let dataInfo = null;

    try {
        let info0 = input.result[2].split(';');

        let info1 = input.result[3].split(';');

        let info2 = input.result[4].split(';');

        let info3 = input.result[5].split(';');

        let info4 = input.result[6].split(';');
        info4 = _.reduce(info4, (result, value, index) => {
            if (index % 2 === 0)
                result.push(info4.slice(index, index + 2));

            return result;
        }, []);

        let info5 = input.result[8].split(';');

        let gpuInfo = _.map(info1, (item, i) => {
            return {
                hashRate: parseInt(item),
                hashRateDCR: info3[i] === 'off' ? 0 : parseInt(info3[i]),
                temperature: parseInt(info4[i][0]),
                fanSpeed: parseInt(info4[i][1])
            }
        });

        dataInfo = input.error ? {
            error: input.error
        } : {
            version: input.result[0],
            runningTime: parseInt(input.result[1]),
            totalHashRate: parseInt(info0[0]),
            numberOfShare: parseInt(info0[1]),
            numberOfRejected: parseInt(info0[2]),
            totalDCRHashRate: parseInt(info2[0]),
            numberOfDCRShare: parseInt(info2[1]),
            numberOfDCRRejected: parseInt(info2[2]),
            numberOfInvalidShare: parseInt(info5[0]),
            numberOfPoolSwitches: parseInt(info5[1]),
            numberOfDCRInvalidShare: parseInt(info5[2]),
            numberOfDCRPoolSwitches: parseInt(info5[3]),
            pools: input.result[7].split(';'),
            gpuInfo: gpuInfo
        };

        return dataInfo;
    }
    catch (e) {
        console.log(e);
    }

    return dataInfo;
}

function getParams() {
    let config = JSON.parse(fs.readFileSync(MAIN_CONFIG, 'utf8').toString());

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

let mainWindow;
let tray;

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

app.setLoginItemSettings({
    openAtLogin: true,
});

app.on('ready', () => {
    if (!isDev)
        autoUpdater.checkForUpdates();

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
        if (fs.existsSync(RUN_CONFIG)) {
            const runConfig = JSON.parse(fs.readFileSync(RUN_CONFIG, 'utf8').toString());
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
                gpuzProcess = new ProcessManager(resolve(__dirname, '../../dist/gpuz'), 'GPU-Z.exe');
                gpuzProcess.start([], 2);
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

    ipcMain.on('command:request', (event, data) => {
        if (data.command === 'start') {
            /* save config */
            fs.writeFileSync(MAIN_CONFIG, JSON.stringify(data.data), 'utf-8');
            fs.writeFileSync(RUN_CONFIG, JSON.stringify({run: true}), 'utf-8');

            /* start claymore */
            claymoreProcess = new ProcessManager(resolve(__dirname, '../../dist/claymore'), 'EthDcrMiner64.exe');
            claymoreProcess.on('start', () => {
                event.sender.send('process:status', 'start');

                connect('localhost', 3333, {
                    pingData: {
                        id: 0,
                        jsonrpc: "2.0",
                        method: "miner_getstat1"
                    },
                    cb: data => {
                        event.sender.send('process:data', convertData(data))
                    }
                })
            });

            claymoreProcess.on('stop', () => {
                event.sender.send('process:status', 'stop');
            });

            let p = getParams();
            claymoreProcess.start(p.params, p.runMode);
        } else if (data.command === 'stop') {
            if (claymoreProcess) {
                claymoreProcess.stop();
                claymoreProcess = null;
            }

            fs.writeFileSync(RUN_CONFIG, JSON.stringify({run: false}), 'utf-8');
        } else if (data.command === 'configuration') {
            if (fs.existsSync(MAIN_CONFIG)) {
                let configs = JSON.parse(fs.readFileSync(MAIN_CONFIG, 'utf8').toString());
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