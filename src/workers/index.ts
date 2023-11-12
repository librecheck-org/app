// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { useDefinitionsStore, useSystemStatusStore } from "@/stores";
import ChecklistsWorker from "@/workers/ChecklistsWorker?worker";
import { ChecklistsWorkerMessageType } from "./ChecklistsWorker";
import SystemStatusWorker from "@/workers/SystemStatusWorker?worker";
import { SystemStatusWorkerMessageType } from "./SystemStatusWorker";
import { WorkerMessage } from "@/models";
import { registerSW } from "virtual:pwa-register";

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
    _startSystemStatusWorker();
    _startChecklistsWorker();
}

function _startSystemStatusWorker() {
    const systemStatusWorker = new SystemStatusWorker();
    const systemStatusStore = useSystemStatusStore();

    systemStatusWorker.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case SystemStatusWorkerMessageType.ServerConnectionChecked:
                systemStatusStore.setServerConnectionStatus(msg.payload);
                break;
        }
    });

    systemStatusWorker.postMessage(new WorkerMessage(SystemStatusWorkerMessageType.Start, {}));
}

function _startChecklistsWorker() {
    const checklistsWorker = new ChecklistsWorker();
    const definitionsStore = useDefinitionsStore();

    checklistsWorker.addEventListener("message", async (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case ChecklistsWorkerMessageType.DefinitionsDownloaded:
                await definitionsStore.update(msg.payload);
                break;
        }
    });

    checklistsWorker.postMessage(new WorkerMessage(ChecklistsWorkerMessageType.Start, {}));
}