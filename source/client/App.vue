<template>
    <v-app dark style="padding: 10px">
        <v-tabs dark v-model="active">
            <v-tabs-bar slot="activators" class="red">
                <v-tabs-item v-for="tab in tabs" :key="tab" :href="'#' + tab" ripple>
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
            <v-tabs-content id="configuration" style="height: 580px">
                <configuration></configuration>
            </v-tabs-content>
        </v-tabs>
        <v-layout row style="text-align: center">
            <v-flex md4 offset-md4>
                <v-btn v-if="!isRunning" primary style="width: 200px" @click="start()">
                    <v-icon>fa-play-circle fa-lg fa-fw</v-icon>
                    START MINING
                </v-btn>
                <v-btn v-if="isRunning" error style="width: 200px" @click="stop()">
                    <v-icon>fa-stop-circle fa-lg fa-fw</v-icon>
                    STOP MINING
                </v-btn>
            </v-flex>
        </v-layout>
    </v-app>
</template>

<script>
    import {ipcRenderer} from 'electron'
    import dashboard from './components/dashboard.vue'
    import configuration from './components/configuration.vue'

    export default {
        components: {
            dashboard,
            configuration
        },
        data() {
            return {
                tabs: ['dashboard', 'configuration'],
                active: null
            }
        },
        computed: {
            isRunning() {
                return this.$store.state.running;
            }
        },
        mounted() {
            ipcRenderer.on('response', (event, data) => {
                this.$store.commit('SET_RUNNING', (data.status === 'running'));
            });
        },
        methods: {
            start() {
                ipcRenderer.send('command', {
                    command: 'start-mining',
                    config: this.$store.state.config
                });
            },
            stop() {
                ipcRenderer.send('command', {command: 'stop-mining'});
            }
        }
    }
</script>
<style lang="css">

</style>