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
                maximumFileSizeToCacheInBytes: 10000000 /* Almost 10 MB */,
                runtimeCaching: [
                    {
                        urlPattern: /\/env\.json/,
                        handler: "NetworkFirst",
                    }
                ]
            },
            devOptions: {
                enabled: true
            }
        })
    ],
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    worker: {
        // Storage worker uses dynamic imports in order to dynamically invoke
        // updater functions. In order for that to work, worker output format
        // needs to be changed from "iife", the default value, to "es".
        format: "es",
    },
    test: {
        globals: true,
        environment: "jsdom",
        reporters: ["junit", "default"],
        outputFile: {
            junit: "./test-report.xml",
        },
        coverage: {
            enabled: true,
            provider: "v8",
            reporter: ["cobertura", "html"],
        },
    }
});
