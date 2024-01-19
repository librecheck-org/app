// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { PersistentStore, definePersistentStore, usePersistentStore } from "@/infrastructure";
import { StorageKey, Tokens } from "@/models";
import { ref } from "vue";
import { unrefType } from "@/helpers";

export interface TokenStore extends PersistentStore<Tokens | undefined> {
}

export function useTokenStore(): TokenStore {
    const storageKey = StorageKey.Tokens;
    return definePersistentStore<TokenStore, Tokens | undefined>(storageKey, () => {
        const value = ref<Tokens | undefined>();

        const { ensureIsInitialized, read, update } = usePersistentStore(storageKey, value);

        return { value: unrefType(value), ensureIsInitialized, read, update };
    });
}