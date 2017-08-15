import {app, BrowserWindow, ipcMain} from 'electron'
import path from 'path'
import {ProcessManager} from "./utils/ProcessManager";

const _ = require('lodash');
const fs = require('fs');
const CONFIG_FILE = './config.json';

const WINDOW_WIDTH = 1000;
const WINDOW_HEIGHT = 750;

const DEFAULT_POOL = 'eth-eu2.nanopool.org:9999';
const DEFAULT_WALLET = '0x32590ccd73c9675a6fe1e8ce776efc2a287f5d12';

let claymoreProcess;

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

    socket.on('error', (e) => {
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

        let info4 = _.reduce(input.result[6].split(';'), (result, value, index) => {
            if (index % 2 === 0)
                result.push(info4.slice(index, index + 2));

            return result;
        }, []);

        let info5 = input.result[8].split(';');

        let gpuInfo = _.map(info1, (item, i) => {
            return {
                hashRate: parseInt(item),
                hashRateDCR: info3[i] === 'off' ? 'off' : parseInt(info3[i]),
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

    }

    return dataInfo;
}

function getParams() {
    let config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8').toString());

    let r = _.filter(_.map(_.keys(config), (key) => {
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

    return _.flatten(r);
}

app.on('ready', () => {
    let mainWindow = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT
    });

    const mainURL = process.env.HOT
        ? `http://localhost:${process.env.PORT}/main.html`
        : 'file://' + path.join(__dirname, 'main.html');

    mainWindow.setResizable(false);
    mainWindow.setMaximizable(false);
    mainWindow.loadURL(mainURL);

    mainWindow.on('closed', () => {
        mainWindow = null
    });

    ipcMain.on('command:request', (event, data) => {
        if (data.command === 'start') {
            /* save config */
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(data.data), 'utf-8');

            /* start claymore */
            claymoreProcess = new ProcessManager(path.resolve(__dirname, 'claymore'), 'EthDcrMiner64.exe');

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

            claymoreProcess.start(getParams());
        } else if (data.command === 'stop') {
            if (claymoreProcess) {
                claymoreProcess.stop();
                claymoreProcess = null;
            }
        } else if (data.command === 'configuration') {
            if (fs.existsSync(CONFIG_FILE)) {
                let configs = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8').toString());
                event.sender.send('command:response', {
                    command: 'configuration',
                    data: configs
                })
            }
        }
    })
});

app.on('window-all-closed', () => {
    if (claymoreProcess) {
        claymoreProcess.stop();
        claymoreProcess = null;
    }

    app.quit()
});
