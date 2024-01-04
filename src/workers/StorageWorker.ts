// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { StorageKey, StorageWorkerMessageType, WorkerMessage } from "@/models";
import { Storage } from "@ionic/storage";
import { fireAndForget } from "@/helpers";

addEventListener("message", (ev) => {
    const msg = ev.data as WorkerMessage;
    fireAndForget(async () => await _handleMessage(msg));
});

async function _handleMessage(msg: WorkerMessage): Promise<void> {
    switch (msg.type) {
        case StorageWorkerMessageType.Read: {
            const { key, promiseId } = msg.payload;
            await _read(key, promiseId);
            break;
        }
        case StorageWorkerMessageType.Update: {
            const { key, updates, promiseId } = msg.payload;
            await _update(key, updates, promiseId);
            break;
        }
        case StorageWorkerMessageType.Delete: {
            const { key, promiseId } = msg.payload;
            await _delete(key, promiseId);
            break;
        }
    }
}

class IonicStorageWrapper {
    private readonly _store = new Storage();
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

function _unlockPromise(promiseId: string, value: unknown) {
    self.postMessage(new WorkerMessage(StorageWorkerMessageType.Unlock, { promiseId, value }));
}

async function _read(key: StorageKey, promiseId: string) {
    let value: any = null;
    try {
        await navigator.locks.request(key, { mode: "shared" }, async () => {
            value = await _ionicStorage.get(key);
        });
    } finally {
        _unlockPromise(promiseId, value);
    }
}

async function _update(key: StorageKey, updates: object, promiseId: string) {
    let value: object | null = null;
    try {
        await navigator.locks.request(key, { mode: "exclusive" }, async () => {
            value = await _ionicStorage.get(key);
            value = { ...value, ...updates };
            await _ionicStorage.set(key, value);
        });
    } finally {
        _unlockPromise(promiseId, value);
    }
}

async function _delete(key: StorageKey, promiseId: string) {
    try {
        await navigator.locks.request(key, { mode: "exclusive" }, async () => {
            await _ionicStorage.remove(key);
        });
    } finally {
        _unlockPromise(promiseId, undefined);
    }
}