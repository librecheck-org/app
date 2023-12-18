// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Definitions, StorageKey } from "@/models";
import { defineIonicStore, useIonicStorage } from "@/infrastructure";
import { ref } from "vue";
import { DefinitionDetails } from "@/apiClients";

interface DefinitionStore {
    value: Definitions;

    ensureIsInitialized: () => Promise<void>;
    update: (value: Partial<Definitions> | undefined) => Promise<void>;
}

export function useDefinitionsStore(): DefinitionStore {
    const storageKey = StorageKey.Definitions;
    return defineIonicStore(storageKey, () => {
        const _value = ref<Definitions>({ summaries: [], details: {} });

        const { ensureIsInitialized: _ensureIsInitialized, update } = useIonicStorage(storageKey, _value);

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