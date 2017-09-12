import {app, BrowserWindow, dialog, ipcMain, Menu, Tray} from 'electron'
import {existsSync, readFileSync, writeFileSync} from 'fs'
import {Claymore} from "./plugins/Claymore"
import {Gpuz} from "./plugins/Gpuz"
import {Plugin} from "./plugins/base/Plugin"
import * as _ from 'lodash'
import * as log from 'electron-log'
import {join} from 'path'

import {autoUpdater} from 'electron-updater'

const isDev = require('electron-is-dev');

const MAIN_CONFIG = app.getPath('userData') + '/config_main.json';
const RUN_CONFIG = app.getPath('userData') + '/config_run.json';
const WINDOW_WIDTH = 1000;
const WINDOW_HEIGHT = 725;

const DEFAULT_POOL = 'eth-eu2.nanopool.org:9999';
const DEFAULT_WALLET = '0x32590ccd73c9675a6fe1e8ce776efc2a287f5d12';

export default class Application {

    private mainWindow: Electron.BrowserWindow;
    private tray: Electron.Tray;

    private minerProcess: Plugin;

    constructor() {
        autoUpdater.logger = log;

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

        const isSecondInstance = app.makeSingleInstance(() => {
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized())
                    this.mainWindow.restore();

                if (!this.mainWindow.isVisible())
                    this.mainWindow.show();

                this.mainWindow.focus()
            }
        });

        if (isSecondInstance) {
            app.quit()
        }

        app.on('ready', () => this.onReady());
        app.on('window-all-closed', () => this.onClosed());
        app.on('before-quit', () => this.onBeforeQuit());
    }

    private readParams(filename: string) {
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

    private async onReady() {
        if (!isDev) {
            await autoUpdater.checkForUpdates();

            app.setLoginItemSettings({
                openAtLogin: true,
                openAsHidden: true
            });
        }

        this.mainWindow = new BrowserWindow({
            titleBarStyle: 'hidden',
            frame: false,
            width: WINDOW_WIDTH,
            height: WINDOW_HEIGHT,
            icon: join(process.env.APP_PATH, 'static/images/logo.ico'),
            show: false,
            backgroundColor: '#303030'
        });

        this.mainWindow.application = this;

        const mainURL = process.env.NODE_ENV === 'development'
            ? `http://localhost:9080`
            : `file://${__dirname}/index.html`;

        this.mainWindow.setResizable(false);
        this.mainWindow.setMaximizable(false);

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show()
        });

        this.mainWindow.on('close', event => {
            if (app.quitting) {
                this.mainWindow = null
            } else {
                event.preventDefault();
                this.mainWindow.hide()
            }
        });

        this.mainWindow.webContents.on('did-finish-load', async () => {
            if (existsSync(RUN_CONFIG)) {
                const runConfig = JSON.parse(readFileSync(RUN_CONFIG, 'utf8').toString());
                if (runConfig.run) {
                    this.mainWindow.webContents.send('process:force-start');
                }
            }
        });

        this.tray = new Tray(join(process.env.APP_PATH, 'static/images/logo.ico'));

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show',
                click: () => {
                    this.mainWindow.show();
                }
            },
            {
                label: 'Run GPU-Z',
                click: () => new Gpuz().start([], Plugin.RUNAS_MODE)
            },
            {type: 'separator'},
            {
                label: 'Quit',
                click: () => dialog.showMessageBox({
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
        ]);

        this.tray.setToolTip('ESMINER');
        this.tray.setContextMenu(contextMenu);
        this.tray.on('double-click', () => this.mainWindow.show());

        ipcMain.on('request', async (event, response) =>
            await this.onCommand(event.sender, response.command, response.data ? response.data : null));

        this.mainWindow.loadURL(mainURL);
    }

    private onClosed() {
        if (this.minerProcess) {
            this.minerProcess.stop();
            this.minerProcess = null;
        }
    }

    private onBeforeQuit() {
        if (this.minerProcess) {
            this.minerProcess.stop();
            this.minerProcess = null;
        }

        app.quitting = true
    }

    private async onCommand(sender, command: string, data?: any) {
        switch (command) {
            case 'start': {
                /* save config */
                writeFileSync(MAIN_CONFIG, JSON.stringify(data), 'utf-8');
                writeFileSync(RUN_CONFIG, JSON.stringify({run: true}), 'utf-8');

                /* start claymore */
                this.minerProcess = new Claymore();

                this.minerProcess.on('start', () => {
                    sender.send('status', 'running');
                });

                this.minerProcess.on('stop', () => {
                    sender.send('status', 'stopped');
                });

                this.minerProcess.on('data', data => {
                    sender.send('data', data);
                });

                let currentParams = this.readParams(MAIN_CONFIG);

                this.minerProcess.start(currentParams.params, currentParams.runMode);

                break;
            }
            case 'stop': {
                if (this.minerProcess) {
                    this.minerProcess.stop();
                    this.minerProcess = null;
                }

                writeFileSync(RUN_CONFIG, JSON.stringify({run: false}), 'utf-8');
                break;
            }
            case 'get:configuration': {
                if (existsSync(MAIN_CONFIG)) {
                    let configs = JSON.parse(readFileSync(MAIN_CONFIG, 'utf8').toString());
                    sender.send('response', {command: 'get:configuration', data: configs})
                }
                break;
            }
        }
    }
}