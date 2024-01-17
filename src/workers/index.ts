// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { BroadcastChannelName, ChecklistsSyncStatus, GenericWorkerMessageType, SyncWorkerMessageType, SystemStatusWorkerMessageType, WorkerMessage, WorkerName } from "@/models";
import { createBroadcastChannel, setWorkerRef } from "@/infrastructure";
import { useDefinitionStore as useDefinitionStore, useSubmissionStore, useSystemStatusStore } from "@/stores";
import SyncWorker from "@/workers/SyncWorker?worker";
import SystemStatusWorker from "@/workers/SystemStatusWorker?worker";
import { fireAndForget } from "@/helpers";
import { registerSW } from "virtual:pwa-register";

// Monaco Editor
import * as monaco from "monaco-editor";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

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

export function registerMonacoWorkers() {
    self.MonacoEnvironment = {
        getWorker(_: any, label: string) {
            if (label === "json") {
                return new JsonWorker();
            }
            if (label === "css" || label === "scss" || label === "less") {
                return new CssWorker();
            }
            if (label === "html" || label === "handlebars" || label === "razor") {
                return new HtmlWorker();
            }
            if (label === "typescript" || label === "javascript") {
                return new TsWorker();
            }
            return new EditorWorker();
        }
    };

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
}

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

export function startSyncWorker() {
    const syncWorker = new SyncWorker();
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
