// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { BroadcastChannelName, WorkerName } from "@/models";

/**
 * A map of references to currently allocated web workers.
 */
const _workerRefMap = new Map<WorkerName, Worker>();

/**
 * Gets a reference to given worker name, if available.
 * @param name Worker name.
 */
export function getWorkerRef(name: WorkerName): Worker | undefined {
    return _workerRefMap.get(name);
}

/**
 * Sets a reference to given worker name.
 * @param name Worker name.
 * @param ref Reference to worker instance.
 */
export function setWorkerRef(name: WorkerName, ref: Worker): void {
    if (_workerRefMap.has(name)) {
        throw new Error(`A reference to worker ${name} has already been set`);
    }
    _workerRefMap.set(name, ref);
}

/**
 * Creates a broadcast channel which can be used to listen to storage events.
 * Listening to those events is required in order to keep in-memory data fresh
 * when updates might have been performed by web workers or other tabs/pages.
 * @returns A broadcast channel for storage events.
 */
export function createBroadcastChannel(key: BroadcastChannelName): BroadcastChannel {
    return new BroadcastChannel(key);
}

