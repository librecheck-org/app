// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { BroadcastChannelName, ChecklistsSyncStatus, GenericWorkerMessageType, SyncWorkerMessageType, SystemStatusWorkerMessageType, WorkerMessage, WorkerName } from "@/models";
import { createBroadcastChannel, setWorkerRef } from "@/infrastructure";
import { useDefinitionStore as useDefinitionStore, useSubmissionStore, useSystemStatusStore } from "@/stores";
import { fireAndForget } from "@/helpers";

export async function registerServiceWorker() {
    const { registerSW } = await import("virtual:pwa-register");

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

export async function registerMonacoWorkers() {
    await import("monaco-editor/esm/vs/language/json/monaco.contribution");
    await import("monaco-editor/esm/vs/language/typescript/monaco.contribution");
    const monaco = await import("monaco-editor/esm/vs/editor/editor.api");
    const EditorWorker = await import("monaco-editor/esm/vs/editor/editor.worker?worker");
    const JsonWorker = await import("monaco-editor/esm/vs/language/json/json.worker?worker");
    const TsWorker = await import("monaco-editor/esm/vs/language/typescript/ts.worker?worker");

    self.MonacoEnvironment = {
        getWorker(_: any, label: string) {
            if (label === "json") {
                return new JsonWorker.default();
            }
            if (label === "typescript" || label === "javascript") {
                return new TsWorker.default();
            }
            return new EditorWorker.default();
        }
    };

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
}

export async function startSystemStatusWorker() {
    const SystemStatusWorker = await import("@/workers/SystemStatusWorker?worker");

    const systemStatusWorker = new SystemStatusWorker.default();
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

export async function startSyncWorker() {
    const SyncWorker = await import("@/workers/SyncWorker?worker");

    const syncWorker = new SyncWorker.default();
    const definitionStore = useDefinitionStore();
    const submissionStore = useSubmissionStore();
    const systemStatusStore = useSystemStatusStore();

    syncWorker.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case GenericWorkerMessageType.Initialized: {
                setWorkerRef(WorkerName.Sync, syncWorker);
                syncWorker.postMessage(new WorkerMessage(SyncWorkerMessageType.StartPeriodicSync, {}));
                break;
            }
            case SyncWorkerMessageType.DefinitionsRead: {
                fireAndForget(async () => {
                    await definitionStore.update(msg.payload);
                });
                break;
            }
            case SyncWorkerMessageType.SubmissionsRead: {
                fireAndForget(async () => {
                    await submissionStore.update(msg.payload);
                });
                break;
            }
        }
    });

    syncWorker.postMessage(new WorkerMessage(GenericWorkerMessageType.Initialize, {}));

    const syncEventsChannel = createBroadcastChannel(BroadcastChannelName.SyncEvents);
    syncEventsChannel.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case SyncWorkerMessageType.SyncStarted: {
                systemStatusStore.setChecklistsSyncStatus(ChecklistsSyncStatus.Running);
                break;
            }
            case SyncWorkerMessageType.SyncCompleted: {
                systemStatusStore.setChecklistsSyncStatus(ChecklistsSyncStatus.Idle);
                break;
            }
        }
    });
}
