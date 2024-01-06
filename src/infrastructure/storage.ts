// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Ref, ref } from "vue";
import { StorageKey, StorageWorkerMessageType, WorkerMessage } from "@/models";
import { fireAndForget, newUuid } from "@/helpers";
import { StorageUpdater } from "@/models";
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
            case StorageWorkerMessageType.ResolvePromise: {
                const { promiseId, value } = msg.payload;
                _resolvePromise(promiseId, value);
                break;
            }
            case StorageWorkerMessageType.RejectPromise: {
                const { promiseId, error } = msg.payload;
                _rejectPromise(promiseId, error);
                break;
            }
        }
    });
}

async function _sendMessageToStorageWorker(type: StorageWorkerMessageType, payload: object): Promise<unknown> {
    if (_storageWorker === undefined) {
        throw new Error("Storage worker is not available");
    }
    const lockingPromise = _createBlockingPromise();
    _storageWorker.postMessage(new WorkerMessage(type, { ...payload, promiseId: lockingPromise.id }));
    return await lockingPromise.promise;
}

/**
 * Creates a broadcast channel which can be used to listen to storage events.
 * Listening to those events is required in order to keep in-memory data fresh
 * when updates might have been performed by web workers or other tabs/pages.
 * @returns A broadcast channel for storage events.
 */
export function createStorageEventsBroadcastChannel(): BroadcastChannel {
    return new BroadcastChannel("lc.storageEvents");
}

interface BlockingPromise {
    id: string;
    promise: Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
}

const _blockingPromiseMap = new Map<string, BlockingPromise>();
const _dummyPromise = new Promise<unknown>(() => { });
const _dummyAction = () => { /* Empty function used to initialize a blocking promise */ };

function _createBlockingPromise(): BlockingPromise {
    const promiseId = newUuid();
    const blockingPromise: BlockingPromise = { id: promiseId, promise: _dummyPromise, resolve: _dummyAction, reject: _dummyAction };
    blockingPromise.promise = new Promise((resolve, reject) => {
        blockingPromise.resolve = resolve;
        blockingPromise.reject = reject;
    });
    _blockingPromiseMap.set(promiseId, blockingPromise);
    return blockingPromise;
}

function _resolvePromise(promiseId: string, value: unknown): void {
    const blockingPromise = _blockingPromiseMap.get(promiseId);
    if (blockingPromise !== undefined) {
        blockingPromise.resolve(value);
        _blockingPromiseMap.delete(promiseId);
    }
}

function _rejectPromise(promiseId: string, error: unknown): void {
    const blockingPromise = _blockingPromiseMap.get(promiseId);
    if (blockingPromise !== undefined) {
        blockingPromise.reject(error);
        _blockingPromiseMap.delete(promiseId);
    }
}

function _convertValue<T = object>(value: unknown) {
    return Object.keys(value ?? {}).length > 0 ? <T>value : undefined;
}

export async function readFromStorage<T = object>(key: StorageKey): Promise<T | undefined> {
    const value = await _sendMessageToStorageWorker(StorageWorkerMessageType.ExecuteRead, { key });
    return _convertValue(value);
}

export async function updateStorage<T = object>(key: StorageKey, updates: Partial<T>, updater: StorageUpdater | undefined = undefined): Promise<T | undefined> {
    // Update function might receive ref objects, which cannot be sent to storage worker.
    // In fact, they are proxy objects, while a plain object is expected for serialization.
    updates = _.cloneDeep(updates);
    // When a storage updater is not specified, then we fall back to a default function.
    // That function, as the name implies, simply merges given updates into stored value.
    updater ??= { module: "shared", function: "mergeUpdates" };
    const value = await _sendMessageToStorageWorker(StorageWorkerMessageType.ExecuteUpdate, { key, updates, updater });
    return _convertValue(value);
}

export async function deleteFromStorage(key: StorageKey): Promise<void> {
    await _sendMessageToStorageWorker(StorageWorkerMessageType.ExecuteDelete, { key });
}

export function usePersistentStorage<T = object>(storageKey: StorageKey, value: Ref<T | undefined>) {
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

    async function update(updates: Partial<T>, updater: StorageUpdater | undefined = undefined) {
        const updated = await updateStorage(storageKey, updates, updater);
        value.value = updated;
    }

    return { ensureIsInitialized, update };
}

interface PersistentStore {
    get ensureIsInitialized(): any;
}

const _storeInstances = new Map<StorageKey, any>();

export function definePersistentStore<SS extends PersistentStore>(storageKey: StorageKey, storeSetup: () => SS) {
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
