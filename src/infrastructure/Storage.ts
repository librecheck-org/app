import { Ref, ref } from "vue";
import { Storage } from "@ionic/storage";
import { StorageKey } from "@/models";
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

export async function readFromStorage<T>(key: StorageKey): Promise<T | undefined> {
    const item = await _ionicStorage.getItem(key);
    return item !== null ? <T>item : undefined;
}

async function _writeToStorage<T>(key: StorageKey, value: T): Promise<void> {
    await _ionicStorage.setItem(key, value);
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
        const updated = updates !== undefined ? <T>{ ...value.value, ...updates } : undefined;
        await _writeToStorage(storageKey, updated);
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
