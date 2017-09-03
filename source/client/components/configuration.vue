<template>
    <div style="padding-top: 20px">
        <v-layout row>
            <v-flex xs6>
                <v-text-field label="Wallet Address (Required)" v-model="$store.state.config.ewal"
                              placeholder="0x32590ccd73c9675a6fe1e8ce776efc2a287f5d12">
                </v-text-field>
            </v-flex>
            <v-flex xs6>
                <v-text-field label="Pool Address (Optional)" v-model="$store.state.config.epool"
                              placeholder="eth-eu2.nanopool.org:9999">
                </v-text-field>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs6>
                <v-text-field label="Pool Password (Optional)" v-model="$store.state.config.epsw"
                              placeholder="Password" type="password">
                </v-text-field>
            </v-flex>
            <v-flex xs6>
                <v-text-field label="Worker Name (Optional)" v-model="$store.state.config.eworker"
                              placeholder="Worker Name">
                </v-text-field>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs6>
                <v-text-field label="D-Wallet Address (Optional)"
                              v-model="$store.state.config.dwal"
                              placeholder="D-Wallet Address">
                </v-text-field>
            </v-flex>
            <v-flex xs6>
                <v-text-field label="D-Pool Address (Optional)"
                              v-model="$store.state.config.dpool"
                              placeholder="D-Pool Address">
                </v-text-field>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs6>
                <v-text-field label="D-Pool Password (Optional)"
                              v-model="$store.state.config.dpsw"
                              placeholder="Password" type="password">
                </v-text-field>
            </v-flex>
            <v-flex xs6>
                <v-text-field label="GPU Indexes (Optional)" v-model="$store.state.config.di"
                              placeholder="GPU Indexes">
                </v-text-field>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs6>
                <v-select v-bind:items="miningModes" label="Mining Mode (Optional)"
                          v-model="$store.state.config.mode" bottom></v-select>
            </v-flex>
            <v-flex xs6>
                <v-select v-bind:items="secondCoins" label="Second Coin (Optional)"
                          v-model="$store.state.config.dcoin" bottom></v-select>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs6>
                <v-select v-bind:items="runModes" label="Run Mode (Optional)"
                          v-model="$store.state.config.runMode" bottom></v-select>
            </v-flex>
            <v-flex xs6>
            </v-flex>
        </v-layout>
    </div>
</template>
<script>
    import {ipcRenderer} from 'electron'

    export default {
        name: 'configuration',
        data() {
            return {
                runModes: [{text: 'Console Mode', value: 0}, {text: 'Background Mode', value: 1}],
                miningModes: [{text: 'Dual mode', value: 0}, {text: 'ETH only', value: 1}],
                secondCoins: [{text: 'Decred', value: 'dcr'}, {text: 'Siacoin', value: 'sc'},
                    {text: 'Lbry', value: 'lbc'}, {text: 'Pascal', value: 'psc'}]
            }
        },
        mounted() {
            ipcRenderer.send('request', {
                command: 'get:configuration'
            });
        }
    }
</script>