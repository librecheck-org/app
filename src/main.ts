
import App from "./App.vue";
import { IonicVue } from "@ionic/vue";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import router from "./router";

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

/* LibreCheck modules */
import { registerServiceWorker, startWebWorkers } from "./workers";
import { initDefaultApiConfig } from "./helpers";

defineCustomElements(window);
registerServiceWorker();

const pinia = createPinia();
const app = createApp(App)
    .use(IonicVue)
    .use(router)
    .use(pinia);

router.isReady().then(async () => {
    await initDefaultApiConfig();

    app.mount("#app");

    startWebWorkers();
});
