// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, DefinitionWorkingCopy, Definitions, StorageKey } from "@/models";
import { DefinitionDetails, DefinitionSummary } from "@/apiClients";
import { MergeableObjectStore, useMergeableObjectStore } from "./shared";
import { Ref, ref } from "vue";
import { getCurrentDate, newUuid, unrefType } from "@/helpers";
import { definePersistentStore } from "@/infrastructure";

export interface DefinitionStore extends MergeableObjectStore<DefinitionSummary, DefinitionDetails, DefinitionWorkingCopy> {
    readByUuid(definitionUuid: string): DefinitionDetails | undefined;
}

export function useDefinitionStore(): DefinitionStore {
    const storageKey = StorageKey.Definitions;
    return definePersistentStore<DefinitionStore, Definitions>(storageKey, () => {

        function _createWorkingCopy(): DefinitionWorkingCopy {
            return {
                uuid: newUuid(),
                title: "New definition",
                contents: "{}",
                timestamp: getCurrentDate(),
                changeStatus: ChangeStatus.Placeholder,
            };
        }

        function _mapToWorkingCopy(definitionUuid: string): DefinitionWorkingCopy {
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
            ensureWorkingCopy, readWorkingCopy, updateWorkingCopy: _updateWorkingCopy
        } = useMergeableObjectStore(
            storageKey, value, _createWorkingCopy, _mapToWorkingCopy
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

        async function updateWorkingCopy(workingCopy: DefinitionWorkingCopy): Promise<void> {
            // Definition title is set within JSON contents. Therefore, before saving,
            // it should be extracted and related property should be manually updated.
            const parsedContents = JSON.parse(workingCopy.contents);
            workingCopy.title = parsedContents["title"] ?? "Missing title";

            await _updateWorkingCopy(workingCopy);
        }

        return {
            value: unrefType(value), ensureIsInitialized, read, update,
            readByUuid,
            ensureWorkingCopy, readWorkingCopy, updateWorkingCopy
        };
    });
}