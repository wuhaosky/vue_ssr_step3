"use strict";

require('es6-promise').polyfill();
import { createApp } from "./index.js";

let { app, store, router } = createApp();

if (window.__INITIAL_STATE__) {
    // 
    store.replaceState(window.__INITIAL_STATE__);
}

router.onReady(() => {
    app.$mount("#app");
})
