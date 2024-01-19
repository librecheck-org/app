// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { BroadcastChannelName, StorageKey, StorageWorkerMessageType, WorkerMessage } from "@/models";
import { Drivers, Storage } from "@ionic/storage";
import { Ref, ref } from "vue";
import { fireAndForget, unrefType } from "@/helpers";
import _ from "lodash";
import { createBroadcastChannel } from "./workers";
import { defineStore } from "pinia";

/**
 * UI threads, which run the Ionic/Vue application, create a unique instance ID
 * and they pass it to storage module. In other words, each window/tab has its own ID.
 * 
 * Instance ID is received as part of the storage updated broadcast message
 * and it is used by UI threads to determine if they triggered the update or not:
 * if they did not trigger it, then they need to refresh their in-memory stores. 
 */
let _appInstanceId: string | undefined;

export function initializeStorageModule(appInstanceId: string) {
    _appInstanceId = appInstanceId;
}

/**
 * A broadcast channel which is used to listen to storage events.
 * Listening to those events is required in order to keep in-memory data fresh
 * when updates might have been performed by web workers or other tabs/pages.
 */
const _storageEventsChannel = createBroadcastChannel(BroadcastChannelName.StorageEvents);

function _triggerStorageUpdatedEvent(key: StorageKey) {
    _storageEventsChannel.postMessage(new WorkerMessage(StorageWorkerMessageType.StorageUpdated, { key, appInstanceId: _appInstanceId }));
}

class IonicStorageWrapper {
    private readonly _store = new Storage({
        name: "librecheck-db",
        storeName: "librecheck-kv-v1",
        driverOrder: [Drivers.IndexedDB],
    });
    private _isCreated = false;

    public async get(key: string): Promise<any> {
        await this._ensureCreated();
        return await this._store.get(key);
    }

    public async set(key: string, value: any): Promise<void> {
        await this._ensureCreated();
        await this._store.set(key, value);
    }

    public async remove(key: string): Promise<void> {
        await this._ensureCreated();
        await this._store.remove(key);
    }

    private async _ensureCreated() {
        if (this._isCreated) {
            return;
        }
        await this._store.create();
        this._isCreated = true;
    }
}

const _ionicStorage = new IonicStorageWrapper();

function _convertValue<T>(value: unknown): T | undefined {
    return Object.keys(value ?? {}).length > 0 ? <T>value : undefined;
}

export async function readFromStorage<T>(key: StorageKey): Promise<T | undefined> {
    let value;
    await navigator.locks.request(key, { mode: "shared" }, async () => {
        value = await _ionicStorage.get(key);
    });
    return _convertValue<T>(value);
}

type StorageUpdaterFunc<T> = (value: T, updates: Partial<T>) => T;

function _mergeUpdates<T>(value: T, updates: Partial<T>): T {
    return <T>{ ...value, ...updates };
}

export async function updateStorage<T>(key: StorageKey, updates: Partial<T>, updater: StorageUpdaterFunc<T> = _mergeUpdates): Promise<T> {
    // Storage update function might receive ref objects, which cannot be stored.
    // In fact, they are proxy objects, while a plain object is expected for serialization.
    // Therefore, a deep clone is applied to updates before applying them.
    updates = _.cloneDeep(updates);

    let value;
    await navigator.locks.request(key, { mode: "exclusive" }, async () => {
        value = await _ionicStorage.get(key);
        value = updater(value, updates);
        await _ionicStorage.set(key, value);
        _triggerStorageUpdatedEvent(key);
    });

    return _convertValue<T>(value)!;
}

export async function deleteFromStorage(key: StorageKey): Promise<void> {
    await navigator.locks.request(key, { mode: "exclusive" }, async () => {
        await _ionicStorage.remove(key);
    });
}

export interface PersistentStore<T> {
    value: T;

    ensureIsInitialized(): Promise<void>;
    read(): Promise<void>;
    update: (updates: Partial<T>, updater?: StorageUpdaterFunc<T> | undefined) => Promise<void>;
}

export function usePersistentStore<T>(storageKey: StorageKey, value: Ref<T>): PersistentStore<T> {
    const isInitialized = ref(false);

    async function ensureIsInitialized() {
        if (!isInitialized.value) {
            // If a value has been persisted, then it replaces default store value.
            // However, stored value is merged with default value, because new properties
            // might have been added to default value.
            const storedValue = await readFromStorage<T>(storageKey);
            if (storedValue !== undefined) {
                value.value = { ...value.value, ...storedValue };
            }
            // Stored value is updated with merged value, in order to let workers,
            // which do not use stores, directly read the merged value.
            // Value can be undefined when both stored value and default value are undefined.
            if (value.value !== undefined) {
                await update(value.value);
            }
        }
        isInitialized.value = true;
    }

    async function read() {
        const storedValue = await readFromStorage<T>(storageKey);
        if (storedValue !== undefined) {
            value.value = storedValue;
        }
    }

    async function update(updates: Partial<T>, updater: StorageUpdaterFunc<T> | undefined = undefined) {
        value.value = await updateStorage<T>(storageKey, updates, updater ?? _mergeUpdates);
    }

    return { value: unrefType(value), ensureIsInitialized, read, update };
}

/**
 * A map of store instances, which is used to avoid initializing them multiple times.
 */
const _storeInstances = new Map<StorageKey, PersistentStore<any>>();

export function definePersistentStore<TStore extends PersistentStore<TValue>, TValue>(storageKey: StorageKey, storeSetup: () => TStore): TStore {
    let store = <TStore | undefined>_storeInstances.get(storageKey);
    if (store !== undefined) {
        return store;
    }

    const storeDefinition = defineStore(storageKey, storeSetup);
    store = <TStore><unknown>storeDefinition();

    // Initialization happens asynchronously and the call is not awaited,
    // because underlying storage is asynchronous but store definition needs to be synchronous.
    fireAndForget(store.ensureIsInitialized);

    // Persistent stores need to listen to storage updated events,
    // because they need to refresh themselves when data is changed by other threads.
    const read = store.read;
    _storageEventsChannel.addEventListener("message", (ev) => {
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
