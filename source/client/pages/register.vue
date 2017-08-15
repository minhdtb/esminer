<template>
    <div>
        <v-layout row style="margin-top: 50px">
            <v-flex sm8 offset-sm2 style="padding: 10px">
                <v-card style="padding: 25px; text-align: center">
                    <v-layout row>
                        <v-flex sm12>
                            <v-text-field label="Username" placeholder="Username" @blur="blur" @focus="focus"
                                          :rules="[rules.username]" v-model="username" prepend-icon="fa-user fa-lg">
                            </v-text-field>
                            <v-text-field label="Password" placeholder="Password" @blur="blur" @focus="focus"
                                          v-model="password" prepend-icon="fa-lock fa-lg" :rules="[rules.password]"
                                          type="password">
                            </v-text-field>
                            <v-text-field label="Confirm password" placeholder="Confirm password" @blur="blur"
                                          @focus="focus" v-model="confirm" prepend-icon="fa-lock fa-lg"
                                          :rules="[rules.confirm]" type="password">
                            </v-text-field>
                            <v-text-field label="E-mail" placeholder="E-mail" @blur="blur"
                                          @focus="focus" v-model="email" prepend-icon="fa-envelope-o fa-lg"
                                          :rules="[rules.email]">
                            </v-text-field>
                        </v-flex>
                    </v-layout>
                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex sm12 style="text-align: center">
                <div>
                    <span class="error" v-for="error in errors">{{error}}</span>
                    <span class="success" v-if="success">User was registered successfully.</span>
                </div>
                <v-btn :disabled="success" primary style="width: 150px" @click="submit">Register</v-btn>
                <router-link to="/" tag="v-btn" class="error" style="width: 150px">Back</router-link>
            </v-flex>
        </v-layout>
    </div>
</template>
<script>
    const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    export default {
        data() {
            return {
                errors: [],
                success: false,
                initialize: true,
                username: null,
                password: null,
                confirm: null,
                email: null,
                rules: {
                    username: (v) => {
                        if (this.initialize) return true;
                        return !!v || 'Username is required.';
                    },
                    password: (v) => {
                        if (this.initialize) return true;
                        return !!v || 'Password is required.';
                    },
                    confirm: v => {
                        if (this.initialize) return true;
                        return !!v || 'Confirm password is required.';
                    },
                    email: v => {
                        if (this.initialize) return true;
                        if (!v) {
                            return 'Email is required.'
                        }

                        return emailPattern.test(v) || 'Invalid e-mail format.'
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
                if (this.username && this.password && this.confirm && this.email && emailPattern.test(this.email)) {
                    if (this.password !== this.confirm) {
                        return this.errors.push('Password does not match the confirm password.')
                    }

                    this.$store.dispatch('REGISTER', {
                        username: this.username,
                        password: this.password,
                        email: this.email
                    }).then(user => {
                        this.success = true;
                    }).catch(e => {
                        this.success = false;
                        this.errors.push(e.response.data);
                    })
                }
            }
        }
    }
</script>