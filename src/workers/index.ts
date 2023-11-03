// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import SystemStatusWorker from "@/workers/SystemStatusWorker?worker";
import { SystemStatusWorkerMessageType } from "./SystemStatusWorker";
import { WorkerMessage } from "@/models";
import { registerSW } from "virtual:pwa-register";
import { useSystemStatusStore } from "@/stores";

export function BuildSystemStatusWorker() {
    return new SystemStatusWorker();
}

export function registerServiceWorker() {
    const updateSW = registerSW({
        onNeedRefresh() {
            console.info("App should be refreshed to apply updates");

            const systemStatusStore = useSystemStatusStore();
            systemStatusStore.setClientUpdatesAreAvailable(updateSW);
        },

        onOfflineReady() {
            console.info("App is ready to work offline");
        }
    });
}

export function startWebWorkers() {
    const systemStatusStore = useSystemStatusStore();

    const systemStatusWorker = new SystemStatusWorker();
    systemStatusWorker.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case SystemStatusWorkerMessageType.ServerConnectionChecked:
                systemStatusStore.setServerConnectionStatus(msg.value);
                break;
        }
    });

    systemStatusWorker.postMessage(new WorkerMessage(SystemStatusWorkerMessageType.Start, {}));
}