import { AppInfo, StorageKey } from "@/models";
import { computed, ref } from "vue";
import { defineIonicStore, useIonicStorage } from "@/infrastructure";

export function useAppInfoStore() {
    const storageKey = StorageKey.App;
    return defineIonicStore(storageKey, () => {
        const _value = ref<AppInfo | undefined>();
        const _updateSW = ref<() => void | undefined>();

        const updatesAreAvailable = computed(() => _updateSW.value !== undefined);

        const { ensureIsInitialized, update } = useIonicStorage(storageKey, _value);

        function setUpdatesAreAvailable(updateSW: () => void): void {
            _updateSW.value = updateSW;
        }

        function applyUpdates(): void {
            if (_updateSW.value !== undefined) {
                _updateSW.value();
            }
        }

        return {
            value: _value, ensureIsInitialized, update,
            updatesAreAvailable, setUpdatesAreAvailable, applyUpdates
        };
    });
}