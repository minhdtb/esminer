<template>
    <div>
        <v-layout row style="margin-bottom: 10px; margin-top: 10px">
            <v-flex xs8>
                <v-card height="200px" id="test">
                    <v-card-media>
                        <div id="total-hash-rate" style="height: 190px; margin: 5px"></div>
                    </v-card-media>
                </v-card>
            </v-flex>
            <v-flex xs4>
                <v-card height="200px">
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
                <v-card height="260px">
                    <v-card-media>
                        <div :id="'gpu-temp-' + gpu.id" style="height: 150px;"></div>
                        <table class="table-gpu">
                            <tbody>
                            <tr>
                                <td style="color: gainsboro; text-align: right">Rate</td>
                                <td style="text-align: center"><h5 class="totalHashRate" style="color: orangered">
                                    {{gpu.hashRate}}</h5>
                                </td>
                                <td style="color: plum;">MH/s</td>
                            </tr>
                            <tr>
                                <td style="color: gainsboro; text-align: right">Temp</td>
                                <td style="text-align: center"><h5 class="totalHashRate" style="color: red">
                                    {{gpu.temperature}}</h5></td>
                                <td style="color: plum;">°C</td>
                            </tr>
                            <tr>
                                <td style="color: gainsboro; text-align: right">Fan</td>
                                <td style="text-align: center"><h5 class="totalHashRate" style="color: green">
                                    {{gpu.fanSpeed}}</h5></td>
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
    </div>
</template>
<script>
    import {ipcRenderer} from 'electron'
    import _ from 'lodash'

    let data1 = [];
    let totalPoints1 = 200;

    function getPlotArray1(value, max) {
        if (data1.length > 0)
            data1 = data1.slice(1);

        while (data1.length < totalPoints1) {
            let y = value;

            if (y < 0) {
                y = 0;
            } else if (y > max) {
                y = max;
            }

            data1.push(y);
        }

        let res = [];
        for (let i = 0; i < data1.length; ++i) {
            res.push([i, data1[i]])
        }

        return res;
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
                ]
            }
        },
        mounted() {
            ipcRenderer.on('state', (event, data) => {
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

                if (!this.$store.state.running) {
                    this.$store.commit('SET_RUNNING', true)
                }

                updatePlot(data.totalHashRate / 1000, this.gpuList);
            });

            let hashRatePlot;
            let tempPlotList = [];
            setTimeout(() => {
                hashRatePlot = $.plot('#total-hash-rate', [getPlotArray1(0)], {
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
                        max: 300,
                        color: '#c6c6c6'
                    },
                    xaxis: {
                        show: false
                    }
                });

                tempPlotList = _.map(this.gpuList, (gpu) => {
                    return $.plot('#gpu-temp-' + gpu.id, [getPlotArray1(0)], {
                        colors: ['#e80b1a'],
                        series: {
                            lines: {
                                show: true,
                                lineWidth: 1
                            },
                            points: {
                                show: false
                            }
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
            }, 100);

            function updatePlot(value, gpuList) {
                hashRatePlot.setData([getPlotArray1(value)]);
                hashRatePlot.draw();
                _.each(gpuList, (gpu, i) => {
                    //tempPlotList[i].setData([getPlotArray1(gpu.temperature)]);
                    //tempPlotList[i].draw();
                });
            }
        }
    }
</script>