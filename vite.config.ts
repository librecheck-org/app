import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        legacy(),
        VitePWA({
            registerType: "prompt",
            includeAssets: ["favicon.png"],
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: /\/env\.json/,
                        handler: "NetworkFirst",
                    },
                    {
                        urlPattern: /\/version\.json/,
                        handler: "StaleWhileRevalidate",
                    }
                ]
            },
            devOptions: {
                enabled: true
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        globals: true,
        environment: "jsdom"
    }
});
