import Vue from 'vue'
import Vuetify from 'vuetify'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

import App from './App.vue'

Vue.use(VueRouter);
Vue.use(Vuetify);
Vue.use(Vuex);

const routes = [];

const router = new VueRouter({
    routes
});

const store = new Vuex.Store({
    state: {
        running: false,
        config: {
            epool: null,
            ewal: null,
            epsw: null,
            eworker: null,
            dwal: null,
            dpool: null,
            dpsw: null,
            di: null,
            mode: 1,
            dcoin: 'sc'
        }
    },
    mutations: {
        SET_RUNNING(state, value) {
            state.running = value;
        },
        SET_CONFIG(state, config) {
            state.config = config;
        }
    }
});

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app');