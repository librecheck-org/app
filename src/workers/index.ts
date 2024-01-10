// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChecklistsWorkerMessageType, GenericWorkerMessageType, SystemStatusWorkerMessageType, WorkerMessage, WorkerName } from "@/models";
import { useDefinitionsStore as useDefinitionStore, useSubmissionStore, useSystemStatusStore } from "@/stores";
import ChecklistsWorker from "@/workers/ChecklistsWorker?worker";
import SystemStatusWorker from "@/workers/SystemStatusWorker?worker";
import { fireAndForget } from "@/helpers";
import { registerSW } from "virtual:pwa-register";
import { setWorkerRef } from "@/infrastructure";

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

export { startStorageWorker } from "./shared";

export function startSystemStatusWorker() {
    const systemStatusWorker = new SystemStatusWorker();
    const systemStatusStore = useSystemStatusStore();

    systemStatusWorker.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case GenericWorkerMessageType.Initialized: {
                setWorkerRef(WorkerName.SystemStatus, systemStatusWorker);
                systemStatusWorker.postMessage(new WorkerMessage(SystemStatusWorkerMessageType.StartPeriodicServerConnectionCheck, {}));
                break;
            }
            case SystemStatusWorkerMessageType.ServerConnectionChecked: {
                systemStatusStore.setServerConnectionStatus(msg.payload);
                break;
            }
        }
    });

    systemStatusWorker.postMessage(new WorkerMessage(GenericWorkerMessageType.Initialize, {}));
}

export function startChecklistsWorker() {
    const checklistsWorker = new ChecklistsWorker();
    const definitionStore = useDefinitionStore();
    const submissionStore = useSubmissionStore();

    checklistsWorker.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case GenericWorkerMessageType.Initialized: {
                setWorkerRef(WorkerName.Checklists, checklistsWorker);
                checklistsWorker.postMessage(new WorkerMessage(ChecklistsWorkerMessageType.StartPeriodicSync, {}));
                break;
            }
            case ChecklistsWorkerMessageType.DefinitionsRead: {
                fireAndForget(async () => {
                    await definitionStore.update(msg.payload);
                });
                break;
            }
            case ChecklistsWorkerMessageType.SubmissionsRead: {
                fireAndForget(async () => {
                    await submissionStore.update(msg.payload);
                });
                break;
            }
        }
    });

    checklistsWorker.postMessage(new WorkerMessage(GenericWorkerMessageType.Initialize, {}));
}
