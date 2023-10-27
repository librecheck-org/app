import { UserDetails } from '@/apiClients';
import { defineIonicStore, useIonicStorage } from '@/infrastructure';
import { StorageKey, Tokens } from '@/models';
import { computed, ref } from 'vue';

export function useTokensStore() {
    const storageKey = StorageKey.Tokens;
    return defineIonicStore(storageKey, () => {
        const value = ref<Tokens | undefined>();

        const { ensureIsInitialized, update } = useIonicStorage(storageKey, value);

        return { value, ensureIsInitialized, update };
    });
}

export function useCurrentUserStore() {
    const storageKey = StorageKey.CurrentUser;
    return defineIonicStore(storageKey, () => {
        const value = ref<UserDetails | undefined>();        
        const isAuthenticated = computed(() => value.value !== undefined);

        const { ensureIsInitialized, update } = useIonicStorage(storageKey, value);

        return { value, isAuthenticated, ensureIsInitialized, update };
    });
}