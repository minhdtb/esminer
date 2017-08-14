<template>
    <v-app dark style="padding: 10px">
        <v-tabs dark v-model="active">
            <v-tabs-bar slot="activators" class="red">
                <v-tabs-item v-for="tab in tabs" :key="tab" :href="'#' + tab" ripple>
                    {{ tab }}
                </v-tabs-item>
                <v-tabs-slider class="yellow"></v-tabs-slider>
            </v-tabs-bar>
            <v-tabs-content id="dashboard">
                <dashboard></dashboard>
            </v-tabs-content>
            <v-tabs-content id="configuration" style="height: 580px"></v-tabs-content>
        </v-tabs>
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
    import dashboard from './components/dashboard.vue'

    export default {
        components: {
            dashboard
        },
        data() {
            return {
                tabs: ['dashboard', 'configuration'],
                active: null,
                running: false
            }
        },
        mounted() {
            ipcRenderer.on('response', (event, data) => {
                this.running = (data.status === 'running')
            });
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