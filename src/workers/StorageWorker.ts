// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { BroadcastChannelName, GenericWorkerMessageType, StorageKey, StorageUpdater, StorageWorkerMessageType, WorkerMessage } from "@/models";
import { Drivers, Storage } from "@ionic/storage";
import { createBroadcastChannel } from "@/infrastructure";
import { fireAndForget } from "@/helpers";

addEventListener("message", (ev) => {
    const msg = ev.data as WorkerMessage;
    fireAndForget(async () => await _handleMessage(msg));
});

async function _handleMessage(msg: WorkerMessage): Promise<void> {
    switch (msg.type) {
        case GenericWorkerMessageType.Initialize: {
            const { appInstanceId } = msg.payload;
            _appInstanceId = appInstanceId;
            break;
        }
        case StorageWorkerMessageType.ExecuteRead: {
            const { key, promiseId } = msg.payload;
            await _read(key, promiseId);
            break;
        }
        case StorageWorkerMessageType.ExecuteUpdate: {
            const { key, updates, updater, promiseId } = msg.payload;
            await _update(key, updates, updater, promiseId);
            break;
        }
        case StorageWorkerMessageType.ExecuteDelete: {
            const { key, promiseId } = msg.payload;
            await _delete(key, promiseId);
            break;
        }
    }
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
const _broadcastChannel = createBroadcastChannel(BroadcastChannelName.StorageEvents);

/**
 * UI threads, which run the Ionic/Vue application, create a unique instance ID
 * and they pass it to storage worker. In other words, each window/tab has its own ID.
 * 
 * Instance ID, if available, is sent as part of the storage updated broadcast message
 * and it is used by UI threads to determine if they triggered the update or not:
 * if they did not trigger it, then they need to refresh their in-memory stores. 
 */
let _appInstanceId: string | undefined;

function _raiseStorageUpdateEvent(key: StorageKey) {
    _broadcastChannel.postMessage(new WorkerMessage(StorageWorkerMessageType.StorageUpdated, { key, appInstanceId: _appInstanceId }));
}

function _unlockPromise(promiseId: string, value: unknown) {
    self.postMessage(new WorkerMessage(StorageWorkerMessageType.ResolvePromise, { promiseId, value }));
}

function _rejectPromise(promiseId: string, error: unknown) {
    self.postMessage(new WorkerMessage(StorageWorkerMessageType.RejectPromise, { promiseId, error }));
}

async function _read(key: StorageKey, promiseId: string) {
    let value: any = null;
    try {
        await navigator.locks.request(key, { mode: "shared" }, async () => {
            value = await _ionicStorage.get(key);
        });
    }
    catch (err) {
        _rejectPromise(promiseId, err);
    }
    finally {
        _unlockPromise(promiseId, value);
    }
}

async function _update(key: StorageKey, updates: object, updater: StorageUpdater, promiseId: string) {
    let value: object | null = null;
    try {
        await navigator.locks.request(key, { mode: "exclusive" }, async () => {
            value = await _ionicStorage.get(key);
            const updaterModule = await import(`../stores/${updater.module}.ts`);
            value = updaterModule[updater.function](value, updates);
            await _ionicStorage.set(key, value);
            _raiseStorageUpdateEvent(key);
        });
    }
    catch (err) {
        _rejectPromise(promiseId, err);
    }
    finally {
        _unlockPromise(promiseId, value);
    }
}

async function _delete(key: StorageKey, promiseId: string) {
    let value: any = null;
    try {
        await navigator.locks.request(key, { mode: "exclusive" }, async () => {
            value = await _ionicStorage.get(key);
            await _ionicStorage.remove(key);
        });
    }
    catch (err) {
        _rejectPromise(promiseId, err);
    }
    finally {
        _unlockPromise(promiseId, value);
    }
}