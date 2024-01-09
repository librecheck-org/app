// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { GenericWorkerMessageType, WorkerMessage } from "@/models";
import { initDefaultApiConfig, setStorageWorker } from "@/infrastructure";
import StorageWorker from "@/workers/StorageWorker?worker";
import { fireAndForget } from "@/helpers";

export async function initializeWorker() {
    startStorageWorker();
    await initDefaultApiConfig();
    self.postMessage(new WorkerMessage(GenericWorkerMessageType.Initialized, {}));
}

export function startStorageWorker(appInstanceId: string | undefined = undefined) {
    const storageWorker = new StorageWorker();
    storageWorker.postMessage(new WorkerMessage(GenericWorkerMessageType.Initialize, { appInstanceId }));
    // Saves a reference to storage worker, so that storage functions can send it commands.
    setStorageWorker(storageWorker);
}

export function scheduleNextExecution(action: () => Promise<void>, interval: number) {
    // Here setTimeout is used to repeat function execution and the same behavior
    // could be better achieved by using setInterval. However, by using setTimeout,
    // we make sure that, when an execution runs for a longer time
    // than given interval, it does not create a queue of blocked actions,
    // because the execution of next action is explicitly scheduled once
    // the current action is over.
    setTimeout(() => fireAndForget(action), interval);
}