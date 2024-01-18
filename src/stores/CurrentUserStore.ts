// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { PersistentStore, definePersistentStore, unrefType, usePersistentStore } from "@/infrastructure";
import { computed, ref } from "vue";
import { StorageKey } from "@/models";
import { UserDetails } from "@/apiClients";

export interface CurrentUserStore extends PersistentStore<UserDetails> {
    get isAuthenticated(): boolean;
}

export function useCurrentUserStore(): CurrentUserStore {
    const storageKey = StorageKey.CurrentUser;
    return definePersistentStore<CurrentUserStore, UserDetails>(storageKey, () => {
        const value = ref<UserDetails | undefined>();
        const isAuthenticated = computed(() => value.value !== undefined);

        const { ensureIsInitialized, read, update } = usePersistentStore(storageKey, value);

        return {
            value: unrefType(value), ensureIsInitialized, read, update,
            isAuthenticated: unrefType(isAuthenticated)
        };
    });
}
