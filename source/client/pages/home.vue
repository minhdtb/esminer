<template>
    <div>
        <v-layout row>
            <v-flex sm12>
                <v-tabs dark v-model="active">
                    <v-tabs-bar class="red">
                        <v-tabs-item :disabled="tab === 'configuration'? isRunning: false" v-for="tab in tabs"
                                     :key="tab" :href="'#' + tab" ripple>
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
                    <v-tabs-items>
                        <v-tabs-content id="dashboard">
                            <dashboard></dashboard>
                        </v-tabs-content>
                        <v-tabs-content id="configuration" style="height: 550px">
                            <configuration></configuration>
                        </v-tabs-content>
                    </v-tabs-items>
                </v-tabs>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex sm4>
                <div style="margin-left: 3px">v{{version}}</div>
            </v-flex>
            <v-flex sm4 style="text-align: center">
                <v-btn v-if="!isRunning" primary style="width: 250px" @click.stop="start">
                    <v-icon>fa-play-circle fa-lg fa-fw</v-icon>
                    START MINING
                </v-btn>
                <v-btn v-if="isRunning" error style="width: 250px" @click.stop="stop">
                    <v-icon>fa-stop-circle fa-lg fa-fw</v-icon>
                    STOP MINING
                </v-btn>
            </v-flex>
        </v-layout>
    </div>
</template>
<script>
    import {ipcRenderer, remote} from 'electron'
    import * as crypto from 'crypto';
    import dashboard from '../components/dashboard.vue'
    import configuration from '../components/configuration.vue'
    import {Client, connect} from 'mqtt'
    import {status, startType, getSettings, setSettings} from '../main'

    import * as net from 'net'

    const MQTT_URI = 'wss://mqtt.esminer.com:8083';

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
                let isRun = this.$store.state.status !== status.STATUS_STOPPED;
                if (isRun)
                    this.active = 'dashboard';

                return isRun;
            },
            user() {
                return this.$store.state.authUser;
            }
        },
        mounted() {
            getSettings();

            ipcRenderer.on('process:force-start', () => this.start());
            ipcRenderer.on('process:force-stop', () => this.stop());

            require('getmac').getMac((error, macAddress) => {
                if (error)
                    return;

                let id = crypto.createHash('md5').update(macAddress + this.user.username).digest("hex");

                this.id = id;

                this.channel_status = 'esminer:' + id + ':status';
                this.channel_data = 'esminer:' + id + ':data';
                this.channel_command = 'esminer:' + id + ':command';
                this.channel_console = 'esminer:' + id + ':console';

                this.client = connect(MQTT_URI, {
                    clientId: id,
                    username: 'minhdtb',
                    password: '123456',
                    clean: false,
                    will: {
                        topic: 'online',
                        payload: JSON.stringify({
                            id: this.id,
                            content: 'offline'
                        }),
                        qos: 2
                    }
                });

                net.createServer(socket => {
                    socket.on('data', data => {
                        try {
                            this.client.publish(this.channel_console, data);
                            this.client.publish('console', JSON.stringify({
                                id: id,
                                content: JSON.parse(data)
                            }));
                        } catch (e) {
                        }
                    });
                    socket.on("error", () => {
                    });
                }).listen(4444);

                this.client.on('connect', () => {
                    console.log('Message client is connected.');
                    this.client.publish('online', JSON.stringify({id: id, content: 'online'}), {qos: 2});
                });

                this.client.on('message', (topic, message) => {
                    let msg = JSON.parse(message.toString());
                    switch (msg.command) {
                        case 'start':
                            this.start(null, msg.configuration);
                            break;
                        case 'stop':
                            this.stop();
                            break;
                    }
                });

                this.client.subscribe(this.channel_command);

                this.$store.watch((state) => state.status,
                    (is) => {
                        if (this.isRunning)
                            this.$store.commit('SET_CONFIG_RUNNING', true);
                        else
                            this.$store.commit('SET_CONFIG_RUNNING', false);

                        setSettings();

                        this.client.publish(this.channel_status, is.toString(), {qos: 2});
                        this.client.publish('status', JSON.stringify({id: id, content: is.toString()}), {qos: 2});
                    });

                this.$store.watch((state) => state.data, (data) => this.client.publish(this.channel_data, JSON.stringify(data)));
            });
        },
        destroyed() {
            this.client.publish('online', JSON.stringify({id: this.id, content: 'offline'}), {qos: 2});

            this.client.end();
            this.client = null;
        },
        methods: {
            start(event, value) {
                if (value) {
                    ipcRenderer.send('request', {
                        command: 'start',
                        data: {
                            startType: startType.REMOTE_START,
                            unitType: value.unitType,
                            config: value.unitSetting
                        }
                    });
                } else {
                    ipcRenderer.send('request', {
                        command: 'start',
                        data: {
                            startType: startType.NORMAL_START,
                            unitType: 0,
                            config: this.$store.state.config
                        }
                    });
                }
            },
            stop() {
                ipcRenderer.send('request', {
                    command: 'stop'
                });
            }
        }
    }
</script>