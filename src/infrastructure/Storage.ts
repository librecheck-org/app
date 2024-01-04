// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Ref, ref } from "vue";
import { StorageKey, StorageWorkerMessageType, WorkerMessage } from "@/models";
import { fireAndForget, newUuid } from "@/helpers";
import _ from "lodash";
import { defineStore } from "pinia";

/**
 * Storage worker handles direct operations on storage, in order to
 * take advantage of locks. CRUD operations are sent to this worker,
 * which sends back a message with operation result.
 */
let _storageWorker: Worker | undefined;

export function setStorageWorker(storageWorker: Worker) {
    _storageWorker = storageWorker;
    _storageWorker.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case StorageWorkerMessageType.Unlock: {
                const { promiseId, value } = msg.payload;
                _unlockPromise(promiseId, value);
                break;
            }
        }
    });
}

async function _sendMessageToStorageWorker(type: StorageWorkerMessageType, payload: object): Promise<unknown> {
    if (_storageWorker === undefined) {
        throw new Error("Storage worker is not available");
    }
    const lockingPromise = _createLockingPromise();
    _storageWorker.postMessage(new WorkerMessage(type, { ...payload, promiseId: lockingPromise.id }));
    return await lockingPromise.promise;
}

interface LockingPromise {
    id: string;
    promise: Promise<unknown>;
    resolve: (value: unknown) => void;
}

const _lockingPromiseMap = new Map<string, LockingPromise>();
const _dummyPromise = new Promise<unknown>(() => { });
const _dummyResolve = () => { /* Empty function used to initialize a locking promise */ };

function _createLockingPromise(): LockingPromise {
    const promiseId = newUuid();
    const lockingPromise: LockingPromise = { id: promiseId, promise: _dummyPromise, resolve: _dummyResolve };
    lockingPromise.promise = new Promise((resolve: (value: unknown) => void) => lockingPromise.resolve = resolve);
    _lockingPromiseMap.set(promiseId, lockingPromise);
    return lockingPromise;
}

function _unlockPromise(promiseId: string, value: unknown): void {
    const lockingPromise = _lockingPromiseMap.get(promiseId);
    if (lockingPromise !== undefined) {
        lockingPromise.resolve(value);
        _lockingPromiseMap.delete(promiseId);
    }
}

export async function readFromStorage<T>(key: StorageKey): Promise<T | undefined> {
    const item = await _sendMessageToStorageWorker(StorageWorkerMessageType.Read, { key });
    return item !== null ? <T>item : undefined;
}

export async function updateStorage<T>(key: StorageKey, updates: Partial<T>): Promise<T | undefined> {
    // Update function might receive ref objects, which cannot be sent to storage worker.
    // In fact, they are proxy objects, while a plain object is expected for serialization.
    updates = _.cloneDeep(updates);
    const item = await _sendMessageToStorageWorker(StorageWorkerMessageType.Update, { key, updates });
    return item !== null ? <T>item : undefined;
}

export async function deleteFromStorage(key: StorageKey): Promise<void> {
    await _sendMessageToStorageWorker(StorageWorkerMessageType.Delete, { key });
}

export function useIonicStorage<T>(storageKey: StorageKey, value: Ref<T | undefined>) {
    const isInitialized = ref(false);

    async function ensureIsInitialized() {
        if (!isInitialized.value) {
            // If value is stored within client storage, then it replaces default value.
            // Stored value is merged with default value, because new properties
            // might have been added to default value.
            const storedValue = await readFromStorage<T>(storageKey);
            if (storedValue !== undefined) {
                value.value = { ...value.value, ...storedValue };
            }
            // Stored value is updated with merged value, in order to let workers,
            // which do not use stores, directly read the merged value.
            await update(value.value);
        }
        isInitialized.value = true;
    }

    async function update(updates: Partial<T>) {
        const updated = await updateStorage(storageKey, updates);
        value.value = updated;
    }

    return { ensureIsInitialized, update };
}

interface IonicStore {
    value: any;
    ensureIsInitialized: any;
}

const _storeInstances = new Map<StorageKey, any>();

export function defineIonicStore<SS extends IonicStore>(storageKey: StorageKey, storeSetup: () => SS) {
    let store = _storeInstances.get(storageKey);
    if (store !== undefined) {
        return store;
    }

    const storeDefinition = defineStore(storageKey, storeSetup);
    store = storeDefinition();

    // Initialization happens asynchronously and the call is not awaited,
    // because underlying storage is asynchronous but store definition needs to be synchronous.
    fireAndForget(store.ensureIsInitialized);

    _storeInstances.set(storageKey, store);
    return store;
}
