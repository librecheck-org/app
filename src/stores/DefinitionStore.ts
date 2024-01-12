// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, DefinitionLocalChange, Definitions, StorageKey } from "@/models";
import { definePersistentStore, usePersistentStorage } from "@/infrastructure";
import { getCurrentDate, newUuid } from "@/helpers";
import { DefinitionDetails } from "@/apiClients";
import { GenericStore } from "./shared";
import { ref } from "vue";

export interface DefinitionStore extends GenericStore<Definitions> {
    readByUuid(definitionUuid: string): DefinitionDetails | undefined;

    createWorkingCopy(definitionUuid: string | undefined): Promise<DefinitionLocalChange>;
    readWorkingCopy(definitionUuid: string): DefinitionLocalChange | undefined;
}

export function useDefinitionStore(): DefinitionStore {
    const storageKey = StorageKey.Definitions;
    return definePersistentStore<DefinitionStore>(storageKey, () => {
        const value = ref<Definitions>({ summaries: [], details: {}, workingCopies: {} });

        const { ensureIsInitialized: _ensureIsInitialized, read, update } = usePersistentStorage(storageKey, value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
        }

        function readByUuid(definitionUuid: string): DefinitionDetails | undefined {
            return value.value.details[definitionUuid];
        }

        async function createWorkingCopy(definitionUuid: string | undefined): Promise<DefinitionLocalChange> {
            let workingCopy = readWorkingCopy(definitionUuid);
            if (workingCopy !== undefined) {
                return workingCopy;
            }
            const definition = readByUuid(definitionUuid);
            workingCopy = <DefinitionLocalChange>{
                uuid: definition?.uuid ?? newUuid(),
                title: definition?.title ?? "New definition",
                contents: definition?.contents ?? "{}",
                timestamp: definition?.timestamp ?? getCurrentDate(),
                changeStatus: ChangeStatus.Unchanged,
            };
            await update({ workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => {
                return <Definitions>{ ...v, workingCopies: { ...v?.workingCopies, ...u.workingCopies } };
            });
            return workingCopy;
        }

        function readWorkingCopy(definitionUuid: string): DefinitionLocalChange | undefined {
            return value.value.workingCopies[definitionUuid];
        }

        return {
            value, ensureIsInitialized, read, update,
            readByUuid,
            createWorkingCopy, readWorkingCopy
        };
    });
}