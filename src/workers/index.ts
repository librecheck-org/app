// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import AppInfoWorker from "@/workers/AppInfoWorker?worker";
import { AppInfoWorkerMessageType } from "./AppInfoWorker";
import { WorkerMessage } from "@/models";
import { registerSW } from "virtual:pwa-register";
import { useAppInfoStore } from "@/stores";

export function BuildAppInfoWorker() {
    return new AppInfoWorker();
}

export function registerServiceWorker() {
    const updateSW = registerSW({
        onNeedRefresh() {
            console.info("App should be refreshed to apply updates");
    
            const appInfo = useAppInfoStore();
            appInfo.setUpdatesAreAvailable(updateSW);
        },
    
        onOfflineReady() {
            console.info("App is ready to work offline");
        }
    });
}

export function startWebWorkers() {
    const appInfoStore = useAppInfoStore();

    const appInfoWorker = new AppInfoWorker();
    appInfoWorker.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case AppInfoWorkerMessageType.ServerConnectionChecked:
                appInfoStore.setServerConnectionStatus(msg.value);
                break;
        }
    });

    appInfoWorker.postMessage(new WorkerMessage(AppInfoWorkerMessageType.Start, {}));
}