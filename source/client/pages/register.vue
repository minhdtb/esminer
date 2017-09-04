<template>
    <v-form ref="form">
        <v-layout row style="margin-top: 50px">
            <v-flex sm8 offset-sm2 style="padding: 10px">
                <v-card style="padding: 25px; text-align: center">
                    <v-layout row>
                        <v-flex sm12>
                            <v-text-field label="Username" placeholder="Username" :rules="[rules.username]"
                                          v-model="username" prepend-icon="fa-user fa-lg">
                            </v-text-field>
                            <v-text-field label="Password" placeholder="Password" v-model="password"
                                          prepend-icon="fa-lock fa-lg" :rules="[rules.password]" type="password">
                            </v-text-field>
                            <v-text-field label="Confirm password" placeholder="Confirm password" v-model="confirm"
                                          prepend-icon="fa-lock fa-lg" :rules="[rules.confirm]" type="password">
                            </v-text-field>
                            <v-text-field label="E-mail" placeholder="E-mail" v-model="email"
                                          prepend-icon="fa-envelope-o fa-lg" :rules="[rules.email]">
                            </v-text-field>
                        </v-flex>
                    </v-layout>
                </v-card>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex sm12 style="text-align: center">
                <div>
                    <pulse-loader :loading="loading" color="green" size="10px"></pulse-loader>
                </div>
                <div>
                    <span class="error" v-for="error in errors">{{error}}</span>
                </div>
                <v-btn :disabled="loading" primary style="width: 150px" @click="submit">Register</v-btn>
                <router-link to="/" tag="v-btn" class="error" style="width: 150px">Back</router-link>
            </v-flex>
        </v-layout>
    </v-form>
</template>
<script>
    import PulseLoader from 'vue-spinner/src/PulseLoader.vue'

    const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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
                confirm: null,
                email: null,
                rules: {
                    username: (v) => {
                        return !!v || 'Username is required.';
                    },
                    password: (v) => {
                        return !!v || 'Password is required.';
                    },
                    confirm: v => {
                        return !!v || 'Confirm password is required.';
                    },
                    email: v => {
                        if (!v) {
                            return 'Email is required.'
                        }

                        return emailPattern.test(v) || 'Invalid e-mail format.'
                    }
                }
            }
        },
        methods: {
            submit() {
                this.errors = [];
                if (this.$refs.form.validate()) {
                    if (this.username && this.password && this.confirm && this.email && emailPattern.test(this.email)) {
                        if (this.password !== this.confirm) {
                            return this.errors.push('Password does not match the confirm password.')
                        }

                        this.loading = true;
                        this.$store.dispatch('REGISTER', {
                            username: this.username,
                            password: this.password,
                            email: this.email
                        }).then(() => {
                            this.$router.push('/');
                            this.loading = false;
                        }).catch(e => {
                            if (e.response) {
                                let data = e.response.data;
                                this.errors.push(data.message);
                            }
                            else
                                this.errors.push(e.message);

                            this.loading = false;
                        })
                    }
                }
            }
        }
    }
</script>