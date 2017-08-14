<template>
    <v-app dark style="padding: 10px">
        <v-layout row style="margin-bottom: 10px">
            <v-flex xs8>
                <v-card height="200px">
                    <v-card-media>
                        <div id="total-hash-rate" style="height: 190px; margin: 5px"></div>
                    </v-card-media>
                </v-card>
            </v-flex>
            <v-flex xs4>
                <v-card height="200px">

                    <table class="rate">
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
                                <h2 class="totalHashRate" style="color: royalblue">{{totalShare}}</h2>
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
                <v-card height="250px">
                    <v-card-media>
                        <div :id="'gpu-temp-' + gpu.id" style="height: 150px"></div>
                        <table class="table-gpu">
                            <tbody>
                            <tr>
                                <td style="color: gainsboro">Rate</td>
                                <td><h5 class="totalHashRate" style="color: orangered">{{gpu.hashRate}}</h5></td>
                                <td style="color: plum;">MH/s</td>
                            </tr>
                            <tr>
                                <td style="color: gainsboro">Temp</td>
                                <td><h5 class="totalHashRate" style="color: red">{{gpu.temperature}}</h5></td>
                                <td style="color: plum;">°C</td>
                            </tr>
                            <tr>
                                <td style="color: gainsboro">Fan</td>
                                <td><h5 class="totalHashRate" style="color: green">{{gpu.fanSpeed}}</h5></td>
                                <td style="color: plum;">%</td>
                            </tr>
                            </tbody>
                        </table>
                    </v-card-media>
                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex>
                <v-card height="90px">

                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row style="text-align: center">
            <v-flex md4 offset-md4>
                <v-btn v-if="!running" primary style="width: 200px" @click="start()">
                    <v-icon>fa-play-circle fa-lg fa-fw</v-icon>
                    START MINING
                </v-btn>
                <v-btn v-if="running" error style="width: 200px" @click="stop()">
                    <v-icon>fa-stop-circle fa-lg fa-fw</v-icon>
                    STOP MINING
                </v-btn>
            </v-flex>
        </v-layout>
    </v-app>
</template>

<script>
    import {ipcRenderer} from 'electron'
    import _ from 'lodash'

    let data = [];
    let totalPoints = 200;

    function getPlotArray(value, max) {
        if (data.length > 0)
            data = data.slice(1);

        while (data.length < totalPoints) {
            let y = value;

            if (y < 0) {
                y = 0;
            } else if (y > max) {
                y = max;
            }

            data.push(y);
        }

        let res = [];
        for (let i = 0; i < data.length; ++i) {
            res.push([i, data[i]])
        }

        return res;
    }

    export default {
        data() {
            return {
                totalHashRate: 0,
                totalShare: 0,
                gpuList: [
                    {
                        id: 0,
                        hashRate: 0,
                        temperature: 0,
                        fanSpeed: 0
                    },
                    {
                        id: 1,
                        hashRate: 0,
                        temperature: 0,
                        fanSpeed: 0
                    },
                    {
                        id: 2,
                        hashRate: 0,
                        temperature: 0,
                        fanSpeed: 0
                    },
                    {
                        id: 3,
                        hashRate: 0,
                        temperature: 0,
                        fanSpeed: 0
                    },
                    {
                        id: 4,
                        hashRate: 0,
                        temperature: 0,
                        fanSpeed: 0
                    },
                    {
                        id: 5,
                        hashRate: 0,
                        temperature: 0,
                        fanSpeed: 0
                    }
                ],
                running: false
            }
        },
        mounted() {
            ipcRenderer.on('response', (event, data) => {
                this.running = (data.status === 'running')
            });

            ipcRenderer.on('state', (event, data) => {
                updateHashRatePlot(data.totalHashRate / 1000);
            });

            let hashRatePlot = $.plot('#total-hash-rate', [getPlotArray(0)], {
                colors: ['#e8a028'],
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
                    labelMargin: 15
                },
                yaxis: {
                    min: 0,
                    max: 400,
                    color: '#c6c6c6'
                },
                xaxis: {
                    show: false
                }
            });

            _.each(this.gpuList, (gpu) => {
                $.plot('#gpu-temp-' + gpu.id, [getPlotArray(0)], {
                    height: 100,
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

            function updateHashRatePlot(value) {
                hashRatePlot.setData([getPlotArray(value)]);
                hashRatePlot.draw();
            }
        },
        methods: {
            start() {
                ipcRenderer.send('command', {command: 'start-mining'});
            },
            stop() {
                ipcRenderer.send('command', {command: 'stop-mining'});
            }
        }
    }
</script>
<style lang="css">

</style>