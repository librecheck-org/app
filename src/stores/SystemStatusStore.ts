// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChecklistsSyncStatus, ServerConnectionStatus, StorageKey, SyncWorkerMessageType, SystemStatus, WorkerMessage, WorkerName } from "@/models";
import { computed, ref } from "vue";
import { definePersistentStore, getWorkerRef, usePersistentStorage } from "@/infrastructure";
import { AppInfoApiClient } from "@/apiClients";
import { GenericStore } from "./shared";

async function _getClientVersion(): Promise<string> {
    const { version } = await (await fetch("/version.json")).json();
    return version;
}

async function _getServerVersion(): Promise<string> {
    const appInfoApiClient = new AppInfoApiClient();
    const { version } = (await appInfoApiClient.getAppVersion());
    return version;
}

export interface SystemStatusStore extends GenericStore<SystemStatus> {
    get clientUpdatesAreAvailable(): boolean;
    setClientUpdatesAreAvailable(clientUpdater: () => void): void;
    applyClientUpdates(): void;

    get checklistsSyncStatus(): ChecklistsSyncStatus;
    setChecklistsSyncStatus(status: ChecklistsSyncStatus): void;
    forceChecklistsSync(): void;

    get serverConnectionStatus(): ServerConnectionStatus;
    setServerConnectionStatus(status: ServerConnectionStatus): void;
}

export function useSystemStatusStore(): SystemStatusStore {
    const storageKey = StorageKey.SystemStatus;
    return definePersistentStore(storageKey, () => {
        const value = ref<SystemStatus>({ clientVersion: "0.0", serverVersion: "0.0" });

        const _clientUpdater = ref<() => void | undefined>();
        const _serverConnectionStatus = ref(ServerConnectionStatus.Healthy);
        const _checklistsSyncStatus = ref(ChecklistsSyncStatus.Idle);

        const clientUpdatesAreAvailable = computed(() => _clientUpdater.value !== undefined);
        const serverConnectionStatus = computed(() => _serverConnectionStatus.value);
        const checklistsSyncStatus = computed(() => _checklistsSyncStatus.value);

        const { ensureIsInitialized: _ensureIsInitialized, read, update } = usePersistentStorage(storageKey, value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();

            value.value.clientVersion = await _getClientVersion();

            try {
                value.value.serverVersion = await _getServerVersion();
                await update({ serverVersion: value.value.serverVersion });
            }
            catch (err) {
                // A non-blocking error occurred while reading server version.
                // That information should be available within client storage and,
                // if it is not, then a default value is used.
                console.warn("A non-blocking error occurred while reading server version", err);
            }
        }

        function setClientUpdatesAreAvailable(clientUpdater: () => void): void {
            _clientUpdater.value = clientUpdater;
        }

        function applyClientUpdates(): void {
            if (_clientUpdater.value !== undefined) {
                _clientUpdater.value();
            }
        }

        function setChecklistsSyncStatus(status: ChecklistsSyncStatus): void {
            _checklistsSyncStatus.value = status;
        }

        function forceChecklistsSync(): void {
            const workerRef = getWorkerRef(WorkerName.Sync);
            if (workerRef !== undefined) {
                workerRef.postMessage(new WorkerMessage(SyncWorkerMessageType.ForceImmediateSync, {}));
            }
        }

        function setServerConnectionStatus(status: ServerConnectionStatus): void {
            _serverConnectionStatus.value = status;
        }

        return {
            value, ensureIsInitialized, read, update,
            clientUpdatesAreAvailable, setClientUpdatesAreAvailable, applyClientUpdates,
            checklistsSyncStatus, setChecklistsSyncStatus, forceChecklistsSync,
            serverConnectionStatus, setServerConnectionStatus,
        };
    });
}