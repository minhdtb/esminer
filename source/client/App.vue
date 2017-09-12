<template>
    <v-app dark>
        <v-toolbar>
            <v-toolbar-title style="color: darkgray">ESMINER Pro</v-toolbar-title>
            <v-btn class="btnLogout" :disabled="isRunning" v-show="!!this.$store.state.authUser" warning
                   @click="logout">Logout
            </v-btn>
            <v-btn class="btnClose" @click="close" error>
                <v-icon>fa-close fa-lg</v-icon>
            </v-btn>
        </v-toolbar>
        <router-view style="padding: 10px"></router-view>
    </v-app>
</template>
<script>
    import {remote, ipcRenderer} from 'electron';

    export default {
        computed: {
            isRunning() {
                return this.$store.state.running;
            }
        },
        methods: {
            logout() {
                this.$store.dispatch('LOGOUT').then(() => this.$router.push('/login'));
            },
            close() {
                let window = remote.getCurrentWindow();
                if (window)
                    window.close();
            }
        }
    }
</script>
<style>
    .toolbar__content {
        height: 50px;
    }

    .toolbar {
        -webkit-user-select: none;
        -webkit-app-region: drag;
    }

    button {
        -webkit-app-region: no-drag;
    }

    .btnLogout {
        position: absolute;
        left: 840px;
    }

    .btnClose {
        position: absolute;
        left: 940px;
        min-width: 0;
        width: 40px
    }
</style>