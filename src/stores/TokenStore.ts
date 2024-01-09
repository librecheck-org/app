// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { StorageKey, Tokens } from "@/models";
import { definePersistentStore, usePersistentStorage } from "@/infrastructure";
import { GenericStore } from "./shared";
import { ref } from "vue";

export interface TokenStore extends GenericStore<Tokens> {
}

export function useTokenStore(): TokenStore {
    const storageKey = StorageKey.Tokens;
    return definePersistentStore<TokenStore>(storageKey, () => {
        const value = ref<Tokens | undefined>();

        const { ensureIsInitialized, read, update } = usePersistentStorage(storageKey, value);

        return { value, ensureIsInitialized, read, update };
    });
}