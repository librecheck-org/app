// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { computed, ref } from "vue";
import { definePersistentStore, usePersistentStorage } from "@/infrastructure";
import { GenericStore } from "./shared";
import { StorageKey } from "@/models";
import { UserDetails } from "@/apiClients";

export interface CurrentUserStore extends GenericStore<UserDetails> {
    get isAuthenticated(): boolean;
}

export function useCurrentUserStore(): CurrentUserStore {
    const storageKey = StorageKey.CurrentUser;
    return definePersistentStore<CurrentUserStore>(storageKey, () => {
        const value = ref<UserDetails | undefined>();
        const isAuthenticated = computed(() => value.value !== undefined);

        const { ensureIsInitialized, read, update } = usePersistentStorage(storageKey, value);

        return {
            value, ensureIsInitialized, read, update,
            isAuthenticated
        };
    });
}
