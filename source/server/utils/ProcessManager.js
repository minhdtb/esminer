const EventEmitter = require('events').EventEmitter;
const exec = require('child_process').exec;

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

            this._process.on('close', () => {
                this.emit('stop');
            })
        } else {

        }

        this.emit('start');
    }

    stop() {
        if (!this._process)
            return;

        this.emit('stoping');
        exec('taskkill /PID ' + this._process.pid + ' /T /F');
        this._process = null;
    }
}