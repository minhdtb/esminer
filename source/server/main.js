import {app, BrowserWindow, ipcMain} from 'electron'
import path from 'path'

const _ = require('lodash');
const socket = require('net');
const fs = require('fs');
const exec = require('child_process').exec;
const CONFIG_FILE = './config.json';

let claymoreProcess;
let claymoreSocket;

function execClaymore(sender, params) {
    let execDir = path.resolve(__dirname, 'claymore');

    claymoreProcess = exec('start /i /wait EthDcrMiner64.exe ' + params.join(' '), {
        cwd: execDir
    });

    claymoreProcess.on('close', function () {
        sender.send('response', {
            status: 'stopped'
        });
    });

    sender.send('response', {
        status: 'running'
    });
}

function connectToClaymore(sender) {
    if (!claymoreProcess)
        return;

    claymoreSocket = socket.Socket();
    claymoreSocket.setEncoding('ascii');

    function ping() {
        if (claymoreSocket.isConnected) {
            claymoreSocket.write(JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
                method: "miner_getstat1"
            }));

            setTimeout(ping, 100);
        }
    }

    claymoreSocket.connect(3333, 'localhost', () => {
        claymoreSocket.isConnected = true;
        ping();
    });

    claymoreSocket.on('data', d => {
        processData(sender, d)
    });

    claymoreSocket.on('close', () => {
        claymoreSocket.isConnected = false;
        setTimeout(connectToClaymore, 1000);
    });

    claymoreSocket.on('error', (e) => {
        // do nothing
    })
}

function killClaymore() {
    if (!claymoreProcess)
        return;

    exec('taskkill /PID ' + claymoreProcess.pid + ' /T /F');
    claymoreProcess = null;
}

function processData(sender, data) {
    if (!data)
        return;

    let info0 = data.result[2].split(';');

    let info1 = data.result[3].split(';');

    let info2 = data.result[4].split(';');

    let info3 = data.result[5].split(';');

    let info4 = data.result[6].split(';');
    info4 = _.reduce(info4, (result, value, index) => {
        if (index % 2 === 0)
            result.push(info4.slice(index, index + 2));

        return result;
    }, []);

    let info5 = data.result[8].split(';');

    let gpuInfo = _.map(info1, (item, i) => {
        return {
            hashRate: parseInt(item),
            hashRateDCR: info3[i] === 'off' ? 'off' : parseInt(info3[i]),
            temperature: parseInt(info4[i][0]),
            fanSpeed: parseInt(info4[i][1])
        }
    });

    let dataInfo = data.error ? {
        error: data.error
    } : {
        version: data.result[0],
        runningTime: parseInt(data.result[1]),
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
        pools: data.result[7].split(';'),
        gpuInfo: gpuInfo
    };

    sender.send('state', dataInfo);
}

function getConfig() {
    let config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8').toString());

    let r = _.filter(_.map(_.keys(config), (key) => {
        let value = config[key];
        if (!value && key === 'epool') {
            value = 'eth-eu2.nanopool.org:9999'
        }

        if (!value && key === 'ewal') {
            value = '0x32590ccd73c9675a6fe1e8ce776efc2a287f5d12'
        }

        return ['-' + key, value]
    }), (items) => {
        return !!items[1]
    });

    return _.flatten(r);
}

app.on('ready', () => {
    let mainWindow = new BrowserWindow({
        width: 1000,
        height: 750
    });

    const mainURL = process.env.HOT
        ? `http://localhost:${process.env.PORT}/main.html`
        : 'file://' + path.join(__dirname, 'main.html');

    mainWindow.setResizable(false);
    mainWindow.setMaximizable(false);
    mainWindow.loadURL(mainURL);

    if (process.env.NODE_ENV !== 'production') {
        mainWindow.openDevTools()
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    });

    ipcMain.on('command', (event, data) => {
        if (data.command === 'start-mining') {
            /* save config */
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(data.config, null, 2), 'utf-8');

            /* start claymore */
            let configs = getConfig();
            execClaymore(event.sender, configs);
            connectToClaymore(event.sender);
        } else if (data.command === 'stop-mining') {
            killClaymore();
        } else if (data.command === 'get-config') {
            let configs = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8').toString());
            event.sender.send('config', configs)
        }
    })
});

app.on('window-all-closed', () => {
    killClaymore();
    app.quit()
});
