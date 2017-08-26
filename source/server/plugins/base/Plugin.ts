import {EventEmitter} from 'events'
import {ChildProcess, exec, spawn} from "child_process";
import {IPlugin} from "./IPlugin";
import * as AMQP from "amqplib";
import * as crypto from 'crypto';
import * as path from 'path';

const runas = require('runas');
const isDev = require('electron-is-dev');

const AMQP_URI = 'amqp://localhost';

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

    constructor(dir, name, type: ProcessType) {
        super();
        this._process = null;
        this._dir = dir;
        this._name = name;

        require('getmac').getMac((error, macAddress) => {
            if (error)
                throw error;

            let exchange_name = crypto.createHash('md5').update(macAddress).digest("hex") + '_miner_data';

            if (type !== ProcessType.PROCESS_EXTERNAL) {
                AMQP.connect(AMQP_URI)
                    .then(connection => {
                        return connection
                            .createChannel()
                            .then(channel => {
                                channel.assertExchange(exchange_name, 'fanout', {durable: false});
                                this.on('data', data => {
                                    let msg = JSON.stringify({
                                        type: type,
                                        data: data
                                    });

                                    channel.publish(exchange_name, '', new Buffer(msg))
                                });
                            })
                    })
            }
        });
    }

    getType(): ProcessType {
        return this._processType;
    }

    start(params, mode) {
        if (!mode || mode === Plugin.EXEC_MODE) {
            this._process = exec('start /i /wait ' + this._name + ' ' + params.join(' '), {
                cwd: this._dir
            });
        } else if (mode === Plugin.SPAWN_MODE) {
            this._process = spawn(this._name, params, {
                cwd: this._dir
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