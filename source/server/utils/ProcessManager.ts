import {EventEmitter} from 'events'

const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const runas = require('runas');

const path = require('path');

export class ProcessManager extends EventEmitter {

    private _process: any;
    private _dir: string;
    private _name: string;

    constructor(dir, name) {
        super();
        this._process = null;
        this._dir = dir;
        this._name = name;
    }

    start(params, mode) {
        if (!mode) {
            this._process = exec('start /i /wait ' + this._name + ' ' + params.join(' '), {
                cwd: this._dir
            });
        } else if (mode === 1) {
            this._process = spawn(this._name, params, {
                cwd: this._dir
            });
        } else if (mode === 2) {
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