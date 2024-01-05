// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { StorageKey, Tokens } from "@/models";
import { definePersistentStore, usePersistentStorage } from "@/infrastructure";
import { ref } from "vue";

export interface TokensStore {
    value: Tokens | undefined;

    ensureIsInitialized: () => Promise<void>;
    update: (value: Partial<Tokens | undefined> | undefined) => Promise<void>;
}

export function useTokensStore(): TokensStore {
    const storageKey = StorageKey.Tokens;
    return definePersistentStore(storageKey, () => {
        const value = ref<Tokens | undefined>();

        const { ensureIsInitialized, update } = usePersistentStorage(storageKey, value);

        return { value, ensureIsInitialized, update };
    });
}