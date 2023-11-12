// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { StorageKey, Tokens } from "@/models";
import { computed, ref } from "vue";
import { defineIonicStore, useIonicStorage } from "@/infrastructure";
import { UserDetails } from "@/apiClients";

export * from "./DefinitionsStore";
export * from "./SubmissionsStore";
export * from "./SystemStatusStore";

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