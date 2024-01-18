// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, DefinitionLocalChange, Definitions, StorageKey } from "@/models";
import { PersistentStore, definePersistentStore, unrefType } from "@/infrastructure";
import { Ref, ref } from "vue";
import { getCurrentDate, newUuid } from "@/helpers";
import { DefinitionDetails } from "@/apiClients";
import { useMergeableObjectStore } from "./shared";

export interface DefinitionStore extends PersistentStore<Definitions> {
    readByUuid(definitionUuid: string): DefinitionDetails | undefined;

    createWorkingCopy(definitionUuid: string | undefined): Promise<DefinitionLocalChange>;
    readWorkingCopy(definitionUuid: string): DefinitionLocalChange | undefined;
    updateWorkingCopy(workingCopy: DefinitionLocalChange): Promise<void>;
}

export function useDefinitionStore(): DefinitionStore {
    const storageKey = StorageKey.Definitions;
    return definePersistentStore<DefinitionStore, Definitions>(storageKey, () => {

        function _createNewWorkingCopy(): DefinitionLocalChange {
            return {
                uuid: newUuid(),
                title: "New definition",
                contents: "{}",
                timestamp: getCurrentDate(),
                changeStatus: ChangeStatus.Placeholder,
            };
        }

        function _mapToWorkingCopy(definitionUuid: string): DefinitionLocalChange {
            const definition = readByUuid(definitionUuid);
            if (definition === undefined) {
                throw new Error(`Definition with UUID ${definitionUuid} does not exist`);
            }
            return {
                uuid: definition.uuid,
                title: definition.title,
                contents: definition.contents,
                timestamp: definition.timestamp,
                changeStatus: ChangeStatus.Placeholder,
            };
        }

        const value = ref() as Ref<Definitions>;
        const {
            ensureIsInitialized: _ensureIsInitialized, read, update,
            createWorkingCopy, readWorkingCopy, updateWorkingCopy: _updateWorkingCopy
        } = useMergeableObjectStore(
            storageKey, value, _createNewWorkingCopy, _mapToWorkingCopy
        );

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

        async function updateWorkingCopy(workingCopy: DefinitionLocalChange): Promise<void> {
            // Definition title is set within JSON contents. Therefore, before saving,
            // it should be extracted and related property should be manually updated.
            const parsedContents = JSON.parse(workingCopy.contents);
            workingCopy.title = parsedContents["title"] ?? "Missing title";

            await _updateWorkingCopy(workingCopy);
        }

        return {
            value: unrefType(value), ensureIsInitialized, read, update,
            readByUuid,
            createWorkingCopy, readWorkingCopy, updateWorkingCopy
        };
    });
}