// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Definitions, StorageKey } from "@/models";
import { definePersistentStore, usePersistentStorage } from "@/infrastructure";
import { DefinitionDetails } from "@/apiClients";
import { ref } from "vue";

export interface DefinitionStore {
    value: Definitions;

    ensureIsInitialized: () => Promise<void>;
    update: (value: Partial<Definitions> | undefined) => Promise<void>;
    readDefinition(definitionUuid: string): DefinitionDetails | undefined;
}

export function useDefinitionsStore(): DefinitionStore {
    const storageKey = StorageKey.Definitions;
    return definePersistentStore(storageKey, () => {
        const _value = ref<Definitions>({ summaries: [], details: {}, workingCopies: {} });

        const { ensureIsInitialized: _ensureIsInitialized, update } = usePersistentStorage(storageKey, _value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
        }

        function readDefinition(definitionUuid: string): DefinitionDetails | undefined {
            return _value.value.details[definitionUuid];
        }

        return {
            value: _value, ensureIsInitialized, update,
            readDefinition
        };
    });
}