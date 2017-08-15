<template>
    <v-container>
        <v-layout row style="margin-top: 50px">
            <v-flex sm8 offset-sm2>
                <v-card style="padding: 15px; text-align: center">
                    <v-layout row>
                        <v-flex sm12>
                            <img src="static/images/logo.png" style="width: 180px">
                            <v-text-field label="Username" placeholder="Username"
                                          v-model="username" :rules="[rules.username]" prepend-icon="fa-user fa-lg">
                            </v-text-field>
                            <v-text-field label="Password" placeholder="Password"
                                          v-model="password" :rules="[rules.password]" prepend-icon="fa-lock fa-lg"
                                          type="password">
                            </v-text-field>
                        </v-flex>
                    </v-layout>
                    <v-layout row>
                        <v-flex sm12 style="text-align: center">
                            <span class="error" v-for="error in errors">{{error}}</span><br>
                            <v-btn primary style="width: 200px" @click="submit">
                                <v-icon>fa-sign-in fa-lg fa-fw</v-icon>
                                Login
                            </v-btn>
                        </v-flex>
                    </v-layout>
                    <v-layout row>
                        <v-flex sm12 style="text-align: center">
                            <router-link to="/register" style="margin-right: 5px">Register</router-link>
                            <router-link to="/" style="margin-left: 5px">Forgot Password</router-link>
                        </v-flex>
                    </v-layout>
                </v-card>
            </v-flex>
        </v-layout>
    </v-container>
</template>
<script>
    export default {
        data() {
            return {
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
        mounted() {

        },
        methods: {
            submit() {
                this.errors = [];
                if (this.username && this.password) {
                    this.$store.dispatch('LOGIN', {
                        username: this.username,
                        password: this.password
                    }).then(response => {
                        let user = response.data;
                        if (user) {
                            localStorage.setItem('authUser', JSON.stringify(user));
                            this.$store.commit('SET_AUTH', user);
                            this.$router.push('/')
                        }
                    }).catch(e => {
                        this.errors.push(e.response.data);
                    });
                }
            }
        }
    }
</script>