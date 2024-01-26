// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import App from "./App.vue";
import { IonicVue } from "@ionic/vue";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import router from "./router";
import { surveyPlugin } from "survey-vue3-ui";

/* LibreCheck modules */
import { initializeApiModule, initializeStorageModule } from "./infrastructure";
import { registerMonacoWorkers, registerServiceWorker, startSyncWorker, startSystemStatusWorker } from "./workers";
import { newUuid } from "./helpers";

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";

/* Theme variables */
import "./theme/variables.css";

defineCustomElements(window);

const appInstanceId = newUuid();
initializeStorageModule(appInstanceId);

const pinia = createPinia();
const app = createApp(App)
    .use(IonicVue)
    .use(router)
    .use(pinia)
    .use(surveyPlugin);

router.isReady().then(async () => {
    await initializeApiModule();
    await registerMonacoWorkers();

    app.mount("#app");

    await registerServiceWorker();
    await startSystemStatusWorker();
    await startSyncWorker();
});
