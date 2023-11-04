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
            includeAssets: [
                "images/favicon.ico",
                "images/apple-touch-icon-180x180.png",
                "images/maskable-icon-512x512.png"
            ],
            manifest: {
                name: "LibreCheck",
                short_name: "LibreCheck",
                description: "LibreCheck",
                theme_color: "#ffffff",
                icons: [
                    {
                        src: "images/pwa-64x64.png",
                        sizes: "64x64",
                        type: "image/png"
                    },
                    {
                        src: "images/pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: "images/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png"
                    }
                ]
            },
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
