// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ServerConnectionStatus, WorkerMessage } from "@/models";
import { initializeWorker, scheduleNextExecution } from "./Helpers";
import { AppInfoApiClient } from "@/apiClients";
import { fireAndForget } from "@/helpers";

export const enum SystemStatusWorkerMessageType {
    Start = "start",
    ServerConnectionChecked = "server_connection_checked"
}

addEventListener("message", (ev) => {
    const msg = ev.data as WorkerMessage;
    fireAndForget(async () => await _handleMessage(msg));
});

async function _handleMessage(msg: WorkerMessage): Promise<void> {
    switch (msg.type) {
        case SystemStatusWorkerMessageType.Start:
            await initializeWorker();
            await _checkServerConnection();
            break;
    }
}

async function _checkServerConnection() {
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
    finally {
        scheduleNextExecution(_checkServerConnection, 30 * 1000 /* Thirty seconds */);
    }
}
