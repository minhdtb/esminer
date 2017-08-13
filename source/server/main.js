import {app, BrowserWindow, ipcMain} from 'electron'
import path from 'path'

const socket = require('net');
let claymoreSocket;
const exec = require('child_process').exec;
let claymoreProcess;

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

function connectToClaymore() {
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
        processData(d)
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
    exec('taskkill /PID ' + claymoreProcess.pid + ' /T /F');
    claymoreProcess = null;
}

function processData(data) {
    //  {"id": 0, "error": null, "result": ["9.7 - ETH", "4", "21102;2;0", "21102", "0;0;0", "off", "60;60", "eth-eu1.nanopool.org:9999", "0;0;0;0"]}
    console.log(data);
}

app.on('ready', () => {
    let mainWindow = new BrowserWindow({
        width: 800,
        height: 600
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
            execClaymore(event.sender, ['-epool', 'eth-eu1.nanopool.org:9999', '-ewal', '0x32590ccd73c9675a6fe1e8ce776efc2a287f5d12']);
            connectToClaymore();
        } else if (data.command === 'stop-mining') {
            killClaymore();
        }
    })
});

app.on('window-all-closed', () => {
    killClaymore();
    app.quit()
});
