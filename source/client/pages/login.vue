<template>
    <v-layout row style="margin-top: 10px">
        <v-flex sm6 offset-sm3 style="padding: 45px">
            <v-form ref="form">
                <v-card style="padding: 25px; text-align: center">
                    <v-layout row>
                        <v-flex sm12>
                            <img src="static/images/logo.png" style="width: 180px">
                            <v-text-field label="Username" placeholder="Username"
                                          v-on:keyup.native.enter.prevent="submit"
                                          v-model="username" :rules="[rules.username]" prepend-icon="fa-user fa-lg">
                            </v-text-field>
                            <v-text-field label="Password" placeholder="Password" v-model="password"
                                          :rules="[rules.password]" prepend-icon="fa-lock fa-lg"
                                          type="password" v-on:keyup.native.enter.prevent="submit">
                            </v-text-field>
                        </v-flex>
                    </v-layout>
                    <v-layout row>
                        <v-flex sm12 style="text-align: center">
                            <div>
                                <pulse-loader :loading="loading" color="green" size="10px"></pulse-loader>
                            </div>
                            <div class="error" v-for="error in errors">
                                <span>{{error}}</span>
                            </div>
                            <v-btn :disabled="loading" primary style="width: 200px" @click="submit">
                                <v-icon>fa-sign-in fa-lg fa-fw</v-icon>
                                Login
                            </v-btn>
                        </v-flex>
                    </v-layout>
                    <v-layout row>
                        <v-flex sm12 style="text-align: center">
                            <router-link to="/register" style="margin-right: 5px">Register</router-link>
                        </v-flex>
                    </v-layout>
                </v-card>
            </v-form>
        </v-flex>
    </v-layout>
</template>
<script>
    import PulseLoader from 'vue-spinner/src/PulseLoader.vue'
    import * as crypto from 'crypto';
    import {remote, ipcRenderer} from 'electron'
    import axios from 'axios'

    export default {
        components: {
            PulseLoader
        },
        data() {
            return {
                loading: false,
                errors: [],
                username: null,
                password: null,
                rules: {
                    username: (v) => {
                        return !!v || 'Username is required.';
                    },
                    password: (v) => {
                        return !!v || 'Password is required.';
                    }
                }
            }
        },
        computed: {
            user() {
                return this.$store.state.authUser;
            }
        },
        methods: {
            submit() {
                this.errors = [];
                if (this.$refs.form.validate()) {
                    if (this.username && this.password) {
                        this.loading = true;
                        this.$store.dispatch('LOGIN', {
                            username: this.username,
                            password: this.password
                        }).then(() => {
                            require('getmac').getMac((error, macAddress) => {
                                if (error)
                                    return;

                                let id = crypto.createHash('md5').update(macAddress + this.user.username).digest("hex");
                                this.$store.dispatch('REGISTER_UNIT', {
                                    unitId: id,
                                    userId: this.user._id
                                }).then(() => {
                                    this.$router.push('/');
                                });
                            });
                        }).catch(e => {
                            this.loading = false;
                            if (e.response) {
                                let data = e.response.data;
                                this.errors.push(data.message);
                            }
                            else
                                this.errors.push(e.message);
                        });
                    }
                }
            },
        }
    }
</script>