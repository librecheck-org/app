// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, DefinitionLocalChange, Definitions, StorageKey, updateChangeStatus } from "@/models";
import { PersistentStore, definePersistentStore, unrefType, usePersistentStore } from "@/infrastructure";
import { getCurrentDate, getRecordValues, newUuid } from "@/helpers";
import { DefinitionDetails } from "@/apiClients";
import { ref } from "vue";

export interface DefinitionStore extends PersistentStore<Definitions> {
    readByUuid(definitionUuid: string): DefinitionDetails | undefined;

    createWorkingCopy(definitionUuid: string | undefined): Promise<DefinitionLocalChange>;
    readWorkingCopy(definitionUuid: string): DefinitionLocalChange | undefined;
    updateWorkingCopy(workingCopy: DefinitionLocalChange): Promise<void>;
}

export function useDefinitionStore(): DefinitionStore {
    const storageKey = StorageKey.Definitions;
    return definePersistentStore<DefinitionStore, Definitions>(storageKey, () => {
        const value = ref<Definitions>({ summaries: [], details: {}, workingCopies: {} });

        const { ensureIsInitialized: _ensureIsInitialized, read, update } = usePersistentStore(storageKey, value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
        }

        function readByUuid(definitionUuid: string): DefinitionDetails | undefined {
            const details = value.value.details[definitionUuid];
            if (details !== undefined) {
                return details;
            }
            const workingCopy = readWorkingCopy(definitionUuid);
            if (workingCopy !== undefined) {
                return <DefinitionDetails>{
                    uuid: workingCopy.uuid,
                    title: workingCopy.title,
                    contents: workingCopy.contents,
                    timestamp: workingCopy.timestamp,
                };
            }
            return undefined;
        }

        async function createWorkingCopy(definitionUuid: string | undefined): Promise<DefinitionLocalChange> {
            let workingCopy: DefinitionLocalChange | undefined;
            if (definitionUuid === undefined) {
                // A completely new definition.
                workingCopy = <DefinitionLocalChange>{
                    uuid: newUuid(),
                    title: "New definition",
                    contents: "{}",
                    timestamp: getCurrentDate(),
                    changeStatus: ChangeStatus.Placeholder,
                };
            } else {
                workingCopy = readWorkingCopy(definitionUuid);
                if (workingCopy !== undefined) {
                    // A working copy already exists and it should not be created.
                    return workingCopy;
                }
                const definition = readByUuid(definitionUuid);
                if (definition === undefined) {
                    throw new Error(`Definition with UUID ${definitionUuid} does not exist`);
                }
                // Working copy is created from existing definition.
                workingCopy = <DefinitionLocalChange>{
                    uuid: definition.uuid,
                    title: definition.title,
                    contents: definition.contents,
                    timestamp: definition.timestamp,
                    changeStatus: ChangeStatus.Placeholder,
                };
            }
            await update({ workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => {
                return <Definitions>{ ...v, workingCopies: { ...v?.workingCopies, ...u.workingCopies } };
            });
            return workingCopy;
        }

        function readWorkingCopy(definitionUuid: string): DefinitionLocalChange | undefined {
            return value.value.workingCopies[definitionUuid];
        }

        async function updateWorkingCopy(workingCopy: DefinitionLocalChange): Promise<void> {
            // Definition title is set within JSON contents. Therefore, before saving,
            // it should be extracted and related property should be manually updated.
            const parsedContents = JSON.parse(workingCopy.contents);
            workingCopy.title = parsedContents["title"] ?? "Missing title";

            await update({ workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => {
                const wc = getRecordValues(u.workingCopies!)[0];
                wc.timestamp = getCurrentDate();
                updateChangeStatus(wc, ChangeStatus.Updated);
                return <Definitions>{ ...v, workingCopies: { ...v?.workingCopies, ...u.workingCopies } };
            });
        }

        return {
            value: unrefType(value), ensureIsInitialized, read, update,
            readByUuid,
            createWorkingCopy, readWorkingCopy, updateWorkingCopy
        };
    });
}