// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ServerConnectionStatus, SystemStatusWorkerMessageType, WorkerMessage } from "@/models";
import { initializeWorker, scheduleNextExecution } from "./shared";
import { AppInfoApiClient } from "@/apiClients";
import { fireAndForget } from "@/helpers";

addEventListener("message", (ev) => {
    const msg = ev.data as WorkerMessage;
    fireAndForget(async () => await _handleMessage(msg));
});

async function _handleMessage(msg: WorkerMessage): Promise<void> {
    switch (msg.type) {
        case SystemStatusWorkerMessageType.Initialize:
            await initializeWorker();
            break;

        case SystemStatusWorkerMessageType.StartPeriodicServerConnectionCheck:
            await _checkServerConnection();
            break;
    }
}

async function _checkServerConnection() {
    try {
        await _checkServerConnectionCore();
    }
    finally {
        scheduleNextExecution(_checkServerConnection, 30 * 1000 /* Thirty seconds */);
    }
}

async function _checkServerConnectionCore() {
    try {
        const appInfoApiClient = new AppInfoApiClient();
        await appInfoApiClient.checkAppHealth();
        self.postMessage(new WorkerMessage(
            SystemStatusWorkerMessageType.ServerConnectionChecked,
            ServerConnectionStatus.Healthy));
    }
    catch (err) {
        self.postMessage(new WorkerMessage(
            SystemStatusWorkerMessageType.ServerConnectionChecked,
            ServerConnectionStatus.Disconnected));
    }
}