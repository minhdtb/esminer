import {app, BrowserWindow} from 'electron'
import path from 'path'
import {ipcMain} from 'electron'

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
        } else if (data.command === 'stop-mining') {
            exec('taskkill /PID ' + claymoreProcess.pid + ' /T /F');
            claymoreProcess = null;
        }
    })
});

app.on('window-all-closed', () => {
    app.quit()
});
