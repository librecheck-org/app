// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { fireAndForget, initDefaultApiConfig } from "@/helpers";
import StorageWorker from "@/workers/StorageWorker?worker";
import { setStorageWorker } from "@/infrastructure";

export async function initializeWorker() {
    startStorageWorker();
    await initDefaultApiConfig();
}

export function startStorageWorker() {
    const storageWorker = new StorageWorker();
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