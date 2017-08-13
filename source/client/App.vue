<template>
    <v-app dark>
        <v-layout row>
            <v-flex md6 style="margin: 10px 3px 5px 10px">
                <v-card height="200px">
                    <v-card-media>
                        <div id="g-1" style="height: 150px; margin: 5px"></div>
                    </v-card-media>
                </v-card>
            </v-flex>
            <v-flex md6 style="margin: 10px 10px 5px 2px">
                <v-card height="200px">

                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex style="margin: 8px 10px 4px 10px">
                <v-card height="150px">

                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex style="margin: 10px 10px 4px 10px">
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

    export default {
        data() {
            return {
                running: false
            }
        },
        mounted() {
            ipcRenderer.on('response', (error, data) => {
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