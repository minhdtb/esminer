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
        running: false,
        status: null,
        appId: null,
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
        SET_RUNNING(state, value) {
            state.running = value;
        },
        SET_CONFIG(state, config) {
            state.config = config;
        },
        SET_DATA(state, data) {
            state.data = data
        },
        SET_STATUS(state, status) {
            state.status = status;
        },
        SET_APPID(state, id) {
            state.appId = id;
        }
    },
    getters: {
        isLoggedIn(state) {
            return !!state.authUser;
        }
    }
});

ipcRenderer.on('status', (event, data) => {
    store.commit('SET_RUNNING', (data === 'running'));

    if (data === 'running') {
        store.commit('SET_STATUS', 'Initializing...')
    }

    if (data === 'stopped') {
        store.commit('SET_STATUS', 'Stopped.')
    }
});

ipcRenderer.on('data', (event, data) => {
    store.commit('SET_DATA', data);
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