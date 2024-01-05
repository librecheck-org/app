// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { computed, ref } from "vue";
import { definePersistentStore, usePersistentStorage } from "@/infrastructure";
import { StorageKey } from "@/models";
import { UserDetails } from "@/apiClients";

export interface CurrentUserStore {
    value: UserDetails | undefined;

    get isAuthenticated(): boolean;

    ensureIsInitialized: () => Promise<void>;
    update: (value: Partial<UserDetails | undefined> | undefined) => Promise<void>;
}

export function useCurrentUserStore(): CurrentUserStore {
    const storageKey = StorageKey.CurrentUser;
    return definePersistentStore(storageKey, () => {
        const value = ref<UserDetails | undefined>();
        const isAuthenticated = computed(() => value.value !== undefined);

        const { ensureIsInitialized, update } = usePersistentStorage(storageKey, value);

        return { value, isAuthenticated, ensureIsInitialized, update };
    });
}
