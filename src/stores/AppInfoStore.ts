import { AppInfo, ServerConnectionStatus, StorageKey } from "@/models";
import { computed, ref } from "vue";
import { defineIonicStore, useIonicStorage } from "@/infrastructure";
import { AppInfoApiClient } from "@/apiClients";

async function _getClientVersion(): Promise<string> {
    const { version } = await (await fetch("/version.json")).json();
    return version;
}

async function _getServerVersion(): Promise<string> {
    const appInfoApiClient = new AppInfoApiClient();
    const { version } = (await appInfoApiClient.getAppVersion());
    return version;
}

export function useAppInfoStore() {
    const storageKey = StorageKey.AppInfo;
    return defineIonicStore(storageKey, () => {
        const _value = ref<AppInfo>({ clientVersion: "0.0", serverVersion: "0.0" });
        const _updateSW = ref<() => void | undefined>();
        const _serverConnectionStatus = ref(ServerConnectionStatus.Healthy);

        const updatesAreAvailable = computed(() => _updateSW.value !== undefined);
        const serverConnectionStatus = computed(() => _serverConnectionStatus.value);

        const { ensureIsInitialized: _ensureIsInitialized, update } = useIonicStorage(storageKey, _value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();

            _value.value.clientVersion = await _getClientVersion();

            try {
                _value.value.serverVersion = await _getServerVersion();
                await update({ serverVersion: _value.value.serverVersion });
            }
            catch (err) {
                // A non-blocking error occurred while reading server version.
                // That information should be available within client storage and,
                // if it is not, then a default value is used.
                console.warn("A non-blocking error occurred while reading server version", err);
            }
        }

        function setUpdatesAreAvailable(updateSW: () => void): void {
            _updateSW.value = updateSW;
        }

        function setServerConnectionStatus(status: ServerConnectionStatus): void {
            _serverConnectionStatus.value = status;
        }

        function applyUpdates(): void {
            if (_updateSW.value !== undefined) {
                _updateSW.value();
            }
        }

        return {
            value: _value, ensureIsInitialized, update,
            updatesAreAvailable, setUpdatesAreAvailable, applyUpdates,
            serverConnectionStatus, setServerConnectionStatus
        };
    });
}