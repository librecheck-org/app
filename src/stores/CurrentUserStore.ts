// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { IamApiClient, UserDetails } from "@/apiClients";
import { PersistentStore, definePersistentStore, usePersistentStore } from "@/infrastructure";
import { computed, ref } from "vue";
import { StorageKey } from "@/models";
import { unrefType } from "@/helpers";

export interface CurrentUserStore extends PersistentStore<UserDetails | undefined> {
    get isAuthenticated(): boolean;

    refresh(): Promise<void>;
}

export function useCurrentUserStore(): CurrentUserStore {
    const storageKey = StorageKey.CurrentUser;
    return definePersistentStore<CurrentUserStore, UserDetails | undefined>(storageKey, () => {
        const value = ref<UserDetails | undefined>();
        const isAuthenticated = computed(() => value.value !== undefined);

        const { ensureIsInitialized, read, update } = usePersistentStore(storageKey, value);

        async function refresh(): Promise<void> {
            try {
                if (isAuthenticated.value) {
                    const iamApiClient = new IamApiClient();
                    const currentUser = await iamApiClient.getCurrentUserV1();
                    await update(currentUser);
                }
            }
            catch {
                console.warn("A non-blocking error occurred while refreshing current user details");
            }
        }

        return {
            value: unrefType(value), ensureIsInitialized, read, update,
            isAuthenticated: unrefType(isAuthenticated), refresh
        };
    });
}
