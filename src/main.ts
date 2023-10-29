
import App from "./App.vue";
import { IonicVue } from "@ionic/vue";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import { registerSW } from "virtual:pwa-register";
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

/* API clients */
import { Configuration, DefaultConfig } from "./apiClients";
import { AddHeadersMiddleware } from "./infrastructure";

defineCustomElements(window);

registerSW({
    onNeedRefresh() {
        console.info("App should be refreshed to apply updates");
    },
    onOfflineReady() {
        console.info("App is ready to work offline");
    },
});

const pinia = createPinia();
const app = createApp(App)
    .use(IonicVue)
    .use(router)
    .use(pinia);

router.isReady().then(async () => {
    const env = await (await fetch("/env.json")).json();

    DefaultConfig.config = new Configuration({
        basePath: env?.API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL,
        middleware: [new AddHeadersMiddleware()]
    });

    app.mount("#app");
});
