<template>
    <v-container>
        <v-layout row style="margin-top: 50px">
            <v-flex sm8 offset-sm2>
                <v-card style="padding: 15px; text-align: center">
                    <v-layout row>
                        <v-flex sm12 style="text-align: center">
                            <img src="static/images/logo.png" style="width: 180px">
                            <v-text-field label="Username" placeholder="Username" prepend-icon="fa-user fa-lg">
                            </v-text-field>
                            <v-text-field label="Password" placeholder="Password" prepend-icon="fa-lock fa-lg"
                                          type="password">
                            </v-text-field>
                            <v-btn primary style="width: 200px">
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
        mounted() {

        }
    }
</script>