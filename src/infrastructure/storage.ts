// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { BroadcastChannels, StorageKey, StorageUpdater, StorageWorkerMessageType, WorkerMessage } from "@/models";
import { Ref, ref } from "vue";
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
 * UI threads, which run the Ionic/Vue application, create a unique instance ID
 * and they pass it to storage module. In other words, each window/tab has its own ID.
 * 
 * Instance ID is received as part of the storage updated broadcast message
 * and it is used by UI threads to determine if they triggered the update or not:
 * if they did not trigger it, then they need to refresh their in-memory stores. 
 */
let _appInstanceId: string | undefined;

export function setAppInstanceId(appInstanceId: string) {
    _appInstanceId = appInstanceId;
}

/**
 * Creates a broadcast channel which can be used to listen to storage events.
 * Listening to those events is required in order to keep in-memory data fresh
 * when updates might have been performed by web workers or other tabs/pages.
 * @returns A broadcast channel for storage events.
 */
export function createStorageEventsBroadcastChannel(): BroadcastChannel {
    return new BroadcastChannel(BroadcastChannels.StorageEvents);
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

    async function read() {
        value.value = await readFromStorage(storageKey);
    }

    async function update(updates: Partial<T>, updater: StorageUpdater | undefined = undefined) {
        value.value = await updateStorage(storageKey, updates, updater);
    }

    return { ensureIsInitialized, read, update };
}

interface PersistentStore {
    ensureIsInitialized(): Promise<void>;
    read(): Promise<void>;
}

const _storeInstances = new Map<StorageKey, PersistentStore>();
const _broadcastChannel = createStorageEventsBroadcastChannel();

export function definePersistentStore<S extends PersistentStore>(storageKey: StorageKey, storeSetup: () => PersistentStore): S {
    let store = <S | undefined>_storeInstances.get(storageKey);
    if (store !== undefined) {
        return store;
    }

    const storeDefinition = defineStore(storageKey, storeSetup);
    store = <S><unknown>storeDefinition();

    // Initialization happens asynchronously and the call is not awaited,
    // because underlying storage is asynchronous but store definition needs to be synchronous.
    fireAndForget(store.ensureIsInitialized);

    // Persistent stores need to listen to storage updated events,
    // because they need to refresh themselves when data is changed by other threads.
    const read = store.read;
    _broadcastChannel.addEventListener("message", (ev) => {
        const msg = ev.data as WorkerMessage;
        switch (msg.type) {
            case StorageWorkerMessageType.StorageUpdated: {
                const { key, appInstanceId } = msg.payload;
                if (storageKey == key && _appInstanceId !== appInstanceId) {
                    fireAndForget(read);
                }
                break;
            }
        }
    });

    _storeInstances.set(storageKey, store);
    return store;
}
