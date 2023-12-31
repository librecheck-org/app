// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Ref, ref } from "vue";
import { StorageKey, StorageWorkerMessageType, WorkerMessage } from "@/models";
import { Storage } from "@ionic/storage";
import _ from "lodash";
import { defineStore } from "pinia";

class IonicStorageWrapper {
    private readonly _store = new Storage();
    private _isCreated = false;

    public async getItem(key: string): Promise<any> {
        await this._ensureCreated();
        return await this._store.get(key);
    }

    public async setItem(key: string, value: any): Promise<void> {
        await this._ensureCreated();
        await this._store.set(key, value);
    }

    public async removeItem(key: string): Promise<void> {
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

let _storageWorker: Worker | undefined;

export function setStorageWorker(storageWorker: Worker) {
    _storageWorker = storageWorker;
}

export async function readFromStorage<T>(key: StorageKey): Promise<T | undefined> {
    const item = await _ionicStorage.getItem(key);
    return item !== null ? <T>item : undefined;
}

export async function updateStorage<T>(key: StorageKey, updates: Partial<T> | undefined): Promise<T | undefined> {
    const storedItem = await _ionicStorage.getItem(key);
    const updatedItem = updates !== undefined ? _.cloneDeep(<T>{ ...storedItem, ...updates }) : undefined;
    _storageWorker?.postMessage(new WorkerMessage(StorageWorkerMessageType.Write, { key: key, value: updatedItem }));
    return updatedItem;
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
    store.ensureIsInitialized();

    _storeInstances.set(storageKey, store);
    return store;
}
