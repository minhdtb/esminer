<template>
    <v-layout row style="margin-top: 10px">
        <v-flex sm6 offset-sm3 style="padding: 45px">
            <form :submit.prevent="submit">
                <v-card style="padding: 25px; text-align: center">
                    <v-layout row>
                        <v-flex sm12>
                            <img src="static/images/logo.png" style="width: 180px">
                            <v-text-field label="Username" placeholder="Username" @blur="blur" @focus="focus"
                                          v-on:keyup.native.enter.prevent="submit"
                                          v-model="username" :rules="[rules.username]" prepend-icon="fa-user fa-lg">
                            </v-text-field>
                            <v-text-field label="Password" placeholder="Password" @blur="blur" @focus="focus"
                                          v-model="password" :rules="[rules.password]" prepend-icon="fa-lock fa-lg"
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
            </form>
        </v-flex>
    </v-layout>
</template>
<script>
    import PulseLoader from 'vue-spinner/src/PulseLoader.vue'
    import * as crypto from 'crypto';
    import {remote} from 'electron'
    import axios from 'axios'

    export default {
        components: {
            PulseLoader
        },
        data() {
            return {
                initialize: true,
                loading: false,
                errors: [],
                username: null,
                password: null,
                rules: {
                    username: (v) => {
                        if (this.initialize) return true;
                        return !!v || 'Username is required.';
                    },
                    password: (v) => {
                        if (this.initialize) return true;
                        return !!v || 'Password is required.';
                    }
                }
            }
        },
        methods: {
            focus() {
                this.initialize = false;
            },
            blur() {
                this.initialize = false;
            },
            submit() {
                this.initialize = false;
                this.errors = [];
                if (this.username && this.password) {
                    this.loading = true;
                    this.$store.dispatch('LOGIN', {
                        username: this.username,
                        password: this.password
                    }).then(response => {
                        this.loading = false;
                        let data = response.data;
                        if (data.ok) {
                            localStorage.setItem('authUser', JSON.stringify(data.user));
                            this.$store.commit('SET_AUTH', data.user);

                            remote.getCurrentWindow().application.getId().then(id => {
                                axios.create({
                                    baseURL: 'http://localhost:3000/api'
                                }).post('/unit/register', {
                                    unitId: id,
                                    userId: data.user._id
                                }).then(res => {
                                    let data = res.data;
                                    if (data.ok)
                                        console.log('unit name = ', data.unitName)
                                })
                            });

                            this.$router.push('/')
                        }
                    }).catch(e => {
                        this.loading = false;
                        if (e.response)
                            this.errors.push(e.response.data);
                        else
                            this.errors.push(e.message);
                    });
                }
            },
        }
    }
</script>