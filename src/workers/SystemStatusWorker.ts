// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ServerConnectionStatus, WorkerMessage } from "@/models";
import { AppInfoApiClient } from "@/apiClients";
import { initDefaultApiConfig } from "@/helpers";

export const enum SystemStatusWorkerMessageType {
    Start = "start",
    ServerConnectionChecked = "server_connection_checked"
}

addEventListener("message", (ev) => {
    const msg = ev.data as WorkerMessage;
    if (msg.type == SystemStatusWorkerMessageType.Start) {
        Promise.resolve().then(async () => {
            await initDefaultApiConfig();
            await _checkServerConnection();
            setInterval(() => { _checkServerConnection(); }, 30 * 1000);
        });
    }
});

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
}