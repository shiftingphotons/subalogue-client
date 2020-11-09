import currency from 'currency.js'
import axios from 'axios'

import Vue from 'vue'
import Vuex from 'vuex'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import { GridGlobal  } from 'gridjs-vue'

import Landing from './Landing.vue'
import App from './App.vue'
import {version} from '../package.json';

Vue.use(Vuex)
Vue.use(GridGlobal)

Vue.config.productionTip = false
Vue.use(Buefy, {
  defaultIconPack: 'fas',
});

const routes = {
  '/': Landing,
  '/app': App,
}

// TODO: Split into files
const store = new Vuex.Store({
  state: {
    subscriptions: []
  },
  getters: {
    subscriptionsToRows: state => {
      var rows = [];
      state.subscriptions.forEach(function(sub) {
        rows.push({name: sub.name, url: sub.url, price: sub.price})
      });
      return rows
    },
    findSubByName: (state) => (name) => {
      return state.subscriptions.find(sub => (sub.name == name))
    },
    findSubIndexById: (state) => (id) => {
      return state.subscriptions.findIndex(sub => (sub.id == id));
    }
  },
  mutations: {
    addOne (state, sub) {
      state.subscriptions.push(sub)
    },
    addMany (state, subscriptions) {
      state.subscriptions = state.subscriptions.concat(subscriptions)
    },
    update (state, sub) {
      var index = store.getters.findSubIndexById(sub.id)
      Vue.set(state.subscriptions, index, sub)
    },
    remove (state, id) {
      var index = store.getters.findSubIndexById(id)
      state.subscriptions.splice(index, 1)
    }
  },
  actions: {
    getSubscriptions (context) {
      axios
        .get('http://localhost:8000/api/v1/me/subscriptions', {withCredentials: true})
        .then(response => (
          response.data.subscriptions.forEach(function(sub) {
            sub.price = currency(sub.price, { fromCents: true }).value;
          }),
          context.commit('addMany', response.data.subscriptions)
        ))
    },
    createSubscription (context, sub) {
      axios({
        method: "POST",
        url: "http://localhost:8000/api/v1/me/subscriptions",
        data: sub,
        withCredentials: true,
        }).then(response => (
          response.data.price = currency(response.data.price, { fromCents: true }).value,
          context.commit('addOne', response.data)
        ));
    },
    updateSubscription (context, sub) {
      var id = sub.id
      delete sub.id

      axios({
        method: "PUT",
        url: "http://localhost:8000/api/v1/me/subscriptions/" + id,
        data: sub,
        withCredentials: true,
        }).then(response => (
          response.data.price = currency(response.data.price, { fromCents: true }).value,
          context.commit('update', response.data)
        ));
    },
    deleteSubscription (context, id) {
      var url = 'http://localhost:8000/api/v1/me/subscriptions/' + id
      axios.delete(url, {withCredentials: true})
         .then(response => (context.commit('remove', id)))
    }
  }
})

const app = new Vue({
  el: '#app',
  store: store,
  data: {
    currentRoute: window.location.pathname,
    version: version
  },
  computed: {
    ViewComponent () {
      return routes[this.currentRoute]// || NotFound
    }
  },
  render (h) { return h(this.ViewComponent) }
}).$mount('#app')

window.addEventListener('popstate', () => {
  app.currentRoute = window.location.pathname
})
