import Vue from 'vue'
import Vuetify from 'vuetify'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

import App from './App.vue'
import Home from './pages/home.vue'
import Login from './pages/login.vue'
import Register from './pages/register.vue'
import axios from 'axios'

import {ipcRenderer, remote} from 'electron'

import * as fs from 'fs'

Vue.use(VueRouter);
Vue.use(Vuetify);
Vue.use(Vuex);

export const status = {
    STATUS_STOPPED: 0,
    STATUS_INITIALIZING: 1,
    STATUS_RUNNING: 2
};

export const startType = {
    REMOTE_START: 0,
    NORMAL_START: 1
};

const routes = [
    {path: '/login', component: Login},
    {path: '/register', component: Register},
    {path: '/', component: Home}
];

const router = new VueRouter({routes});

const isDev = process.env.NODE_ENV === 'development';

const API_URL = isDev ? 'http://localhost:3001/api' : 'https://my.esminer.com/api';
const MAIN_CONFIG = remote.app.getPath('userData') + '/config_main.json';

const store = new Vuex.Store({
    state: {
        authUser: null,
        status: status.STATUS_STOPPED,
        data: {},
        config: {
            params: {
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
            },
            general: {
                runMode: 0,
                running: false
            }
        }
    },
    mutations: {
        SET_AUTH(state, user) {
            state.authUser = user;
        },
        SET_CONFIG(state, config) {
            state.config = config;
        },
        SET_CONFIG_RUNNING(state, running) {
            state.config.general.running = running;
        },
        SET_DATA(state, data) {
            state.data = data
        },
        SET_STATUS(state, status) {
            state.status = status;
        }
    },
    actions: {
        LOGIN({commit}, credentials) {
            return axios.post(`${API_URL}/login`, credentials)
                .then((response) => {
                    let data = response.data;
                    localStorage.setItem('authUser', JSON.stringify(data.user));
                    commit('SET_AUTH', data.user);
                });
        },
        LOGOUT({commit}) {
            localStorage.removeItem('authUser');
            commit('SET_AUTH', null);
        },
        REGISTER({commit}, credentials) {
            return axios.post(`${API_URL}/register`, credentials);
        },
        REGISTER_UNIT({commit}, credentials) {
            return axios.post(`${API_URL}/unit/register`, credentials);
        }
    },
    getters: {
        isLoggedIn(state) {
            return !!state.authUser;
        }
    }
});

ipcRenderer.on('status', (event, data) => {
    if (data === 'start') {
        store.commit('SET_STATUS', status.STATUS_INITIALIZING)
    }

    if (data === 'stop') {
        store.commit('SET_STATUS', status.STATUS_STOPPED)
    }
});

ipcRenderer.on('data', (event, data) => {
    store.commit('SET_DATA', data);
    store.commit('SET_STATUS', status.STATUS_RUNNING);
});

const isAuthRoute = route => route.fullPath.indexOf('/login') !== -1 || route.fullPath.indexOf('/register') !== -1;
const loadFromLocalStorage = () => {
    if (localStorage) {
        let user = JSON.parse(localStorage.getItem('authUser'));
        if (user) {
            store.commit('SET_AUTH', user);
            return true;
        }
    }

    return false;
};

export const getSettings = () => {
    if (fs.existsSync(MAIN_CONFIG)) {
        let config = JSON.parse(fs.readFileSync(MAIN_CONFIG, 'utf8').toString());
        store.commit('SET_CONFIG', config);
    }
};

export const setSettings = () => {
    fs.writeFileSync(MAIN_CONFIG, JSON.stringify(store.state.config), 'utf-8');
};

router.beforeEach((to, from, next) => {
    const isLogged = store.getters.isLoggedIn || loadFromLocalStorage();
    if (!isAuthRoute(to) && !isLogged) {
        next('/login')
    } else {
        next()
    }
});

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app');
