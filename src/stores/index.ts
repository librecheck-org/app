// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { BroadcastChannelName, StorageWorkerMessageType, WorkerMessage } from "@/models";
import { createBroadcastChannel } from "@/infrastructure";
import { fireAndForget } from "@/helpers";

export * from "./CurrentUserStore";
export * from "./DefinitionStore";
export * from "./SubmissionStore";
export * from "./SystemStatusStore";
export * from "./TokenStore";

const _storageEventsBroadcastChannel = createBroadcastChannel(BroadcastChannelName.StorageEvents);

export function startListeningToStorageEvents(appInstanceId: string) {
    _storageEventsBroadcastChannel.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        fireAndForget(async () => await _handleMessage(msg, appInstanceId));
    });
}

async function _handleMessage(msg: WorkerMessage, appInstanceId: string): Promise<void> {
    switch (msg.type) {
        case StorageWorkerMessageType.StorageUpdated: {
            const { key } = msg.payload;
            console.log(key, appInstanceId);
            break;
        }
    }
}