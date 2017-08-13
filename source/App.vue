<template>
    <v-app dark>
        <v-layout row>
            <v-flex sm6 style="margin: 15px 5px 4px 10px">
                <v-card height="200px">
                    <v-card-media>
                        <div id="g-1" style="height: 150px; margin: 5px"></div>
                    </v-card-media>
                </v-card>
            </v-flex>
            <v-flex sm6 style="margin: 15px 10px 4px 5px">
                <v-card height="200px">

                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex style="margin: 15px 10px 4px 10px">
                <v-card height="150px">

                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row style="text-align: center">
            <v-flex md4 offset-md4>
                <v-btn v-if="!running" primary style="width: 200px" @click="start()">START MINING</v-btn>
                <v-btn v-if="running" error style="width: 200px" @click="stop()">STOP MINING</v-btn>
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