// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { StorageWorkerMessageType, WorkerMessage } from "@/models";
import { Storage } from "@ionic/storage";

addEventListener("message", (ev) => {
    const msg = ev.data as WorkerMessage;
    switch (msg.type) {
        case StorageWorkerMessageType.Read:
            break;

        case StorageWorkerMessageType.Write: {
            const { key, value } = msg.payload;
            navigator.locks.request(key, { mode: "exclusive" }, async () => {
                await _ionicStorage.setItem(key, value);
            });
            break;
        }
    }
});

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
