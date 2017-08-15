import Vue from 'vue'
import Vuetify from 'vuetify'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

import App from './App.vue'
import Home from './pages/home.vue'
import Login from './pages/login.vue'
import Register from './pages/register.vue'
import axios from 'axios'

Vue.use(VueRouter);
Vue.use(Vuetify);
Vue.use(Vuex);

const routes = [
    {path: '/login', component: Login},
    {path: '/register', component: Register},
    {path: '/', component: Home}
];

const router = new VueRouter({routes});

const store = new Vuex.Store({
    state: {
        authUser: null,
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
    actions: {
        LOGIN(state, credentials) {
            return axios.post('http://localhost:3000/api/login', credentials);
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
        }
    },
    getters: {
        isLoggedIn(state) {
            return !!state.authUser;
        }
    }
});

const isAuthRoute = route => route.fullPath.indexOf('/login') !== -1 || route.fullPath.indexOf('/register') !== -1;
const loadFromLocalStorage = () => {
    if (window.localStorage) {
        let user = JSON.parse(window.localStorage.getItem('authUser'));
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