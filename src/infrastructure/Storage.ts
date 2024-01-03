// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Ref, ref } from "vue";
import { StorageKey, StorageWorkerMessageType, WorkerMessage } from "@/models";
import { fireAndForget, newUuid } from "@/helpers";
import _ from "lodash";
import { defineStore } from "pinia";

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
    const lockingPromise = _createLockingPromise();
    _ensureStorageWorkerAvailability();
    _storageWorker!.postMessage(new WorkerMessage(StorageWorkerMessageType.Read, { key, promiseId: lockingPromise.id }));
    const item = await lockingPromise.promise;
    return item !== null ? <T>item : undefined;
}

export async function updateStorage<T>(key: StorageKey, updates: Partial<T> | undefined): Promise<T | undefined> {
    const storedItem = await readFromStorage<T>(key);
    const updatedItem = updates !== undefined ? _.cloneDeep(<T>{ ...storedItem, ...updates }) : undefined;
    const lockingPromise = _createLockingPromise();
    _ensureStorageWorkerAvailability();
    _storageWorker!.postMessage(new WorkerMessage(StorageWorkerMessageType.Update, { key, value: updatedItem, promiseId: lockingPromise.id }));
    await lockingPromise.promise;
    return updatedItem;
}

export async function deleteFromStorage(key: StorageKey): Promise<void> {
    const lockingPromise = _createLockingPromise();
    _ensureStorageWorkerAvailability();
    _storageWorker!.postMessage(new WorkerMessage(StorageWorkerMessageType.Delete, { key, promiseId: lockingPromise.id }));
    await lockingPromise.promise;
}

function _ensureStorageWorkerAvailability() {
    if (_storageWorker === undefined) {
        throw new Error("Storage worker is not available");
    }
}

export function useIonicStorage<T>(storageKey: StorageKey, value: Ref<T | undefined>) {
    const isInitialized = ref(false);

    async function ensureIsInitialized() {
        if (!isInitialized.value) {
            // If value is stored within client storage, then it replaces default value.
            // Otherwise, default value is kept as a starting point.
            const storedValue = await readFromStorage<T>(storageKey);
            if (storedValue !== undefined) {
                value.value = storedValue;
            }
        }
        isInitialized.value = true;
    }

    async function update(updates: Partial<T> | undefined) {
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
