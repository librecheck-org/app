// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Definitions, StorageKey } from "@/models";
import { definePersistentStore, usePersistentStorage } from "@/infrastructure";
import { DefinitionDetails } from "@/apiClients";
import { ref } from "vue";
import { GenericStore } from "./shared";

export interface DefinitionStore extends GenericStore<Definitions> {
    readDefinition(definitionUuid: string): DefinitionDetails | undefined;
}

export function useDefinitionsStore(): DefinitionStore {
    const storageKey = StorageKey.Definitions;
    return definePersistentStore<DefinitionStore>(storageKey, () => {
        const value = ref<Definitions>({ summaries: [], details: {}, workingCopies: {} });

        const { ensureIsInitialized: _ensureIsInitialized, read, update } = usePersistentStorage(storageKey, value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
        }

        function readDefinition(definitionUuid: string): DefinitionDetails | undefined {
            return value.value.details[definitionUuid];
        }

        return {
            value, ensureIsInitialized, read, update,
            readDefinition
        };
    });
}