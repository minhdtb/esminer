const EventEmitter = require('events').EventEmitter;
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

export class ProcessManager extends EventEmitter {

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
        } else {
            this._process = spawn(this._name, params, {
                cwd: this._dir
            });
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