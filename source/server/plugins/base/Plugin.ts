import {EventEmitter} from 'events'
import {ChildProcess, exec, spawn} from "child_process";
import {IPlugin} from "./IPlugin";
import * as path from 'path';

const runas = require('runas');
const isDev = require('electron-is-dev');

export const BASE_PATH = isDev ? '../../../' : '../../';

export enum ProcessType {
    PROCESS_MINER_CLAYMORE,
    PROCESS_EXTERNAL
}

export class Plugin extends EventEmitter implements IPlugin {

    public static EXEC_MODE = 0;
    public static SPAWN_MODE = 1;
    public static RUNAS_MODE = 2;

    private _process: ChildProcess;
    private _dir: string;
    private _name: string;
    private _processType: ProcessType;

    constructor(dir: string, name: string, type: ProcessType) {
        super();
        this._process = null;
        this._dir = dir;
        this._name = name;
        this._processType = type;
    }

    getType(): ProcessType {
        return this._processType;
    }

    start(params, mode) {
        let loaderDir = path.resolve(__dirname, isDev ? `${BASE_PATH}../dist/loader` : `${BASE_PATH}dist/loader`);
        let loader = 'loader.exe';
        let miner = this._dir + '/' + this._name;

        if (!mode || mode === Plugin.EXEC_MODE) {
            let p = [miner].concat(params);
            this._process = exec('start /wait ' + loader + ' ' + p.join(' '), {
                cwd: loaderDir
            });
        } else if (mode === Plugin.SPAWN_MODE) {
            let p = [miner].concat(params);
            this._process = spawn(loader, p, {
                cwd: loaderDir
            });
        } else if (mode === Plugin.RUNAS_MODE) {
            if (params && params.length) {
                runas(path.join(this._dir, this._name), params.join(' '));
            } else {
                runas(path.join(this._dir, this._name));
            }
        }

        if (this._process) {
            this._process.on('close', () => {
                this.emit('stop');
            });

            this.emit('start');
        }
    }

    stop() {
        if (!this._process)
            return;

        this.emit('stoping');
        exec('taskkill /PID ' + this._process.pid + ' /T /F');
        this._process = null;
    }
}