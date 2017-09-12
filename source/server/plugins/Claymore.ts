import {BASE_PATH, Plugin, ProcessType} from "./base/Plugin";
import {resolve} from "path";
import * as log from 'electron-log';
import * as _ from 'lodash';

export class Claymore extends Plugin {

    constructor() {
        super(resolve(__dirname, `${BASE_PATH}dist/claymore`), 'EthDcrMiner64.exe', ProcessType.PROCESS_MINER_CLAYMORE);

        this.on('start', () => {
            this.connect('localhost', 3333, {
                pingData: {
                    id: 0,
                    jsonrpc: "2.0",
                    method: "miner_getstat1"
                },
                cb: data => {
                    this.emit('data', this.convertData(data));
                }
            })
        })
    }

    connect(host: string, port: Number, options: any) {
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
                this.connect(host, port, options)
            }, options.timeout ? options.timeout : 1000);
        });

        socket.on('error', () => {
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

    convertData(input) {
        if (!input)
            return;

        let dataInfo = null;

        try {
            let info0 = input.result[2].split(';');

            let info1 = input.result[3].split(';');

            let info2 = input.result[4].split(';');

            let info3 = input.result[5].split(';');

            let info4 = input.result[6].split(';');
            info4 = _.reduce(info4, (result, value, index) => {
                if (index % 2 === 0)
                    result.push(info4.slice(index, index + 2));

                return result;
            }, []);

            let info5 = input.result[8].split(';');

            let gpuInfo = _.map(info1, (item, i) => {
                return {
                    hashRate: parseInt(item as any),
                    hashRateDCR: info3[i] === 'off' ? 0 : parseInt(info3[i]),
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
            log.error(e);
        }

        return dataInfo;
    }
}