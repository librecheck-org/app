// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { useDefinitionsStore, useSubmissionsStore, useSystemStatusStore } from "@/stores";
import ChecklistsWorker from "@/workers/ChecklistsWorker?worker";
import { ChecklistsWorkerMessageType } from "./ChecklistsWorker";
import StorageWorker from "@/workers/StorageWorker?worker";
import SystemStatusWorker from "@/workers/SystemStatusWorker?worker";
import { SystemStatusWorkerMessageType } from "./SystemStatusWorker";
import { WorkerMessage } from "@/models";
import { registerSW } from "virtual:pwa-register";
import { setStorageWorker } from "@/infrastructure";

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

export function startStorageWorker() {
    const storageWorker = new StorageWorker();
    setStorageWorker(storageWorker);
}

export function startSystemStatusWorker() {
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

export function startChecklistsWorker() {
    const checklistsWorker = new ChecklistsWorker();
    const definitionsStore = useDefinitionsStore();
    const submissionsStore = useSubmissionsStore();

    checklistsWorker.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case ChecklistsWorkerMessageType.DefinitionsRead:
                Promise.resolve().then(async () => {
                    await definitionsStore.update(msg.payload);
                });
                break;

            case ChecklistsWorkerMessageType.SubmissionsRead:
                Promise.resolve().then(async () => {
                    await submissionsStore.update(msg.payload);
                });
                break;
        }
    });

    checklistsWorker.postMessage(new WorkerMessage(ChecklistsWorkerMessageType.Start, {}));
}