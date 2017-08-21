<template>
    <div>
        <v-layout row>
            <v-flex sm12>
                <v-tabs dark v-model="active">
                    <v-tabs-bar slot="activators" class="red">
                        <v-tabs-item :disabled="tab === 'configuration'? isRunning: false" v-for="tab in tabs"
                                     :key="tab"
                                     :href="'#' + tab" ripple>
                            <v-icon v-if="tab === 'dashboard'" style="margin-top: 3px">
                                fa-home fa-lg fa-fw
                            </v-icon>
                            <v-icon v-else style="margin-top: 3px">
                                fa-cog fa-lg fa-fw
                            </v-icon>
                            {{ tab }}
                        </v-tabs-item>
                        <v-tabs-slider class="yellow"></v-tabs-slider>
                    </v-tabs-bar>
                    <v-tabs-content id="dashboard">
                        <dashboard></dashboard>
                    </v-tabs-content>
                    <v-tabs-content id="configuration" style="height: 550px">
                        <configuration></configuration>
                    </v-tabs-content>
                </v-tabs>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex sm4>
                <div style="margin-left: 3px">v{{version}}</div>
            </v-flex>
            <v-flex sm4 style="text-align: center">
                <v-btn v-if="!isRunning" primary style="width: 250px" @click="start()">
                    <v-icon>fa-play-circle fa-lg fa-fw</v-icon>
                    START MINING
                </v-btn>
                <v-btn v-if="isRunning" error style="width: 250px" @click="stop()">
                    <v-icon>fa-stop-circle fa-lg fa-fw</v-icon>
                    STOP MINING
                </v-btn>
            </v-flex>
        </v-layout>


    </div>
</template>
<script>
    import {ipcRenderer, remote} from 'electron'
    import dashboard from '../components/dashboard.vue'
    import configuration from '../components/configuration.vue'

    export default {
        components: {
            dashboard,
            configuration
        },
        data() {
            return {
                tabs: ['dashboard', 'configuration'],
                version: remote.app.getVersion(),
                active: null
            }
        },
        computed: {
            isRunning() {
                if (this.$store.state.running)
                    this.active = 'dashboard';

                return this.$store.state.running;
            }
        },
        mounted() {
            ipcRenderer.on('process:status', (event, data) => {
                this.$store.commit('SET_RUNNING', (data === 'start'));

                if (data === 'start') {
                    this.$store.commit('SET_STATUS', 'Initializing...')
                }

                if (data === 'stop') {
                    this.$store.commit('SET_STATUS', 'Stopped.')
                }
            });

            ipcRenderer.on('process:force-start', () => {
                this.start();
            });
        },
        methods: {
            start() {
                ipcRenderer.send('command:request', {
                    command: 'start',
                    data: this.$store.state.config
                });
            },
            stop() {
                ipcRenderer.send('command:request', {
                    command: 'stop'
                });
            }
        }
    }
</script>