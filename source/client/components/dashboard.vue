<template>
    <div>
        <v-layout row style="margin-bottom: 10px; margin-top: 10px">
            <v-flex xs8>
                <v-card height="100%" style="padding: 5px">
                    <div id="total-hash-rate" style="height: 100%"></div>
                </v-card>
            </v-flex>
            <v-flex xs4>
                <v-card height="100%" style="padding: 5px">
                    <table class="table-hash-rate">
                        <tbody>
                        <tr>
                            <td style="text-align: center">
                                <h2 class="totalHashRate" style="color: orangered">{{totalHashRate}}</h2>
                            </td>
                            <td>
                                <h5 class="totalHashRateUnit" style="color: plum;">MH/s</h5>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center">
                                <h2 class="totalHashRate" style="color: skyblue">{{totalShare}}</h2>
                            </td>
                            <td>
                                <h5 class="totalHashRateUnit" style="color: plum;">Shares</h5>
                            </td>
                        </tr>
                        </tbody>
                    </table>

                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row style="margin-bottom: 10px">
            <v-flex xs2 v-for="gpu in gpuList" :key='gpu.id'>
                <v-card height="100%">
                    <v-layout row>
                        <v-flex sm12>
                            <div :id="'gpu-temp-' + gpu.id" style="height: 150px; margin: 5px"></div>
                        </v-flex>
                    </v-layout>
                    <v-layout row>
                        <v-flex sm12>
                            <table class="table-gpu">
                                <tbody>
                                <tr>
                                    <td style="color: #f3f3f3; text-align: right">Rate</td>
                                    <td style="text-align: center"><h5 class="totalHashRate" style="color: orangered">
                                        {{gpu.hashRate}}</h5>
                                    </td>
                                    <td style="color: plum;">MH/s</td>
                                </tr>
                                <tr>
                                    <td style="color: #f3f3f3; text-align: right">Temp</td>
                                    <td style="text-align: center"><h5 class="totalHashRate" style="color: red">
                                        {{gpu.temperature}}</h5></td>
                                    <td style="color: plum;">°C</td>
                                </tr>
                                <tr>
                                    <td style="color: #f3f3f3; text-align: right">Fan</td>
                                    <td style="text-align: center">
                                        <h5 class="totalHashRate" style="color: lightgreen">{{gpu.fanSpeed}}</h5>
                                    </td>
                                    <td style="color: plum;">%</td>
                                </tr>
                                </tbody>
                            </table>
                        </v-flex>
                    </v-layout>
                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex sm12>
                <v-card height="90px" style="padding: 5px">
                    <v-layout row>
                        <v-flex sm6>
                            <div v-if="!!$store.state.status" class="totalHashRate" style="color: #87b9f5; font-size: medium">
                               Status : {{$store.state.status}}
                            </div>
                        </v-flex>
                        <v-flex sm6 style="text-align: right">
                            <div v-if="!!version" class="totalHashRate" style="color: whitesmoke; font-size: smaller">
                                Version : {{version}}
                            </div>
                            <div v-for="pool in pools" class="totalHashRate" style="color: #f5b643; font-size: small">
                                {{pool}}
                            </div>
                            <div v-if="!!runningTime" class="totalHashRate" style="color: #8888f5; font-size: small">
                                Running Time : {{runningTime}}
                            </div>
                        </v-flex>
                    </v-layout>
                </v-card>
            </v-flex>
        </v-layout>
    </div>
</template>
<script>
    import {ipcRenderer} from 'electron'
    import _ from 'lodash'
    import moment from 'moment'

    const HASHRATE_TOTAL = 200;
    const TEMP_TOTAL = 50;

    function getPlotData(data, value, total) {
        if (data.length > 0)
            data = data.slice(1);

        while (data.length < total) {
            data.push([0, value]);
        }

        return _.map(data, (item, i) => {
            return [i, item[1]]
        });
    }

    export default {
        name: 'dashboard',
        data() {
            return {
                totalHashRate: 0,
                totalShare: 0,
                gpuList: [
                    {id: 0, hashRate: 0, temperature: 0, fanSpeed: 0},
                    {id: 1, hashRate: 0, temperature: 0, fanSpeed: 0},
                    {id: 2, hashRate: 0, temperature: 0, fanSpeed: 0},
                    {id: 3, hashRate: 0, temperature: 0, fanSpeed: 0},
                    {id: 4, hashRate: 0, temperature: 0, fanSpeed: 0},
                    {id: 5, hashRate: 0, temperature: 0, fanSpeed: 0}
                ],
                pools: [],
                version: null,
                runningTime: null,
            }
        },
        mounted() {
            ipcRenderer.on('process:data', (event, data) => {
                this.totalHashRate = (data.totalHashRate / 1000).toFixed(3);
                this.totalShare = data.numberOfShare;
                this.gpuList = _.map(data.gpuInfo, function (item, i) {
                    return {
                        id: i,
                        hashRate: (item.hashRate / 1000).toFixed(1),
                        temperature: item.temperature,
                        fanSpeed: item.fanSpeed
                    }
                });

                this.pools = data.pools;
                this.version = data.version;
                this.runningTime = moment.duration(data.runningTime, 'minutes').humanize();

                if (!this.$store.state.running) {
                    this.$store.commit('SET_RUNNING', true)
                }

                if (this.$store.state.status !== 'Running.') {
                    this.$store.commit('SET_STATUS', 'Running.')
                }

                updatePlot(data.totalHashRate / 1000, this.gpuList);
            });

            let hashRatePlot;
            let tempPlotList = [];

            setTimeout(() => {
                hashRatePlot = $.plot('#total-hash-rate', [getPlotData([], 0, HASHRATE_TOTAL)], {
                    colors: ['#FF4500'],
                    series: {
                        lines: {
                            show: true,
                            fill: true,
                            lineWidth: 2,
                            fillColor: {
                                colors: [{
                                    opacity: 0.45
                                }, {
                                    opacity: 0.45
                                }]
                            }
                        },
                        points: {
                            show: false
                        }
                    },
                    grid: {
                        borderColor: '#c6c6c6',
                        borderWidth: 1,
                        labelMargin: 10
                    },
                    yaxis: {
                        min: 0,
                        max: 300,
                        color: '#c6c6c6'
                    },
                    xaxis: {
                        show: false
                    }
                });

                tempPlotList = _.map(this.gpuList, (gpu) => {
                    return $.plot('#gpu-temp-' + gpu.id, [getPlotData([], 0, TEMP_TOTAL)], {
                        colors: ['#FF0000', '90EE90'],
                        series: {
                            lines: {
                                show: true,
                                lineWidth: 1
                            },
                            points: {
                                show: false
                            }
                        },
                        grid: {
                            borderColor: '#c6c6c6',
                            borderWidth: 1,
                            labelMargin: 10
                        },
                        yaxis: {
                            min: 0,
                            max: 100,
                            color: '#c6c6c6'
                        },
                        xaxis: {
                            show: false
                        }
                    });
                });
            }, 200);

            function updatePlot(value, gpus) {
                if (hashRatePlot) {
                    let oldData = hashRatePlot.getData()[0].data;
                    hashRatePlot.setData([getPlotData(oldData, value, HASHRATE_TOTAL)]);
                    hashRatePlot.draw();
                }

                _.each(gpus, (gpu, i) => {
                    if (tempPlotList[i]) {
                        let oldData = tempPlotList[i].getData()[0].data;
                        tempPlotList[i].setData([getPlotData(oldData, gpu.temperature, TEMP_TOTAL)]);
                        tempPlotList[i].draw();
                    }
                });
            }
        }
    }
</script>