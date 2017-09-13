import Vue from 'vue'
import Vuetify from 'vuetify'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

import App from './App.vue'
import Home from './pages/home.vue'
import Login from './pages/login.vue'
import Register from './pages/register.vue'
import axios from 'axios'

import {ipcRenderer} from 'electron'

Vue.use(VueRouter);
Vue.use(Vuetify);
Vue.use(Vuex);

export const status = {
    STATUS_STOPPED: 0,
    STATUS_INITIALIZING: 1,
    STATUS_RUNNING: 2
};

const routes = [
    {path: '/login', component: Login},
    {path: '/register', component: Register},
    {path: '/', component: Home}
];

const router = new VueRouter({routes});

const API_URL = 'http://localhost:3000/api';

const store = new Vuex.Store({
    state: {
        authUser: null,
        status: status.STATUS_STOPPED,
        data: {},
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
            runMode: 0,
            dcoin: 'sc'
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
    mutations: {
        SET_AUTH(state, user) {
            state.authUser = user;
        },
        SET_CONFIG(state, config) {
            state.config = config;
        },
        SET_DATA(state, data) {
            state.data = data
        },
        SET_STATUS(state, status) {
            state.status = status;
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

ipcRenderer.on('response', (event, data) => {
    if (data.command === 'get:configuration') {
        store.commit('SET_CONFIG', data.data);
    }
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
