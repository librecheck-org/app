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

        function _mapDetailsToWorkingCopy(definition: DefinitionDetails): DefinitionWorkingCopy {
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
            ensureWorkingCopy, readWorkingCopy, updateWorkingCopy: _updateWorkingCopy, deleteWorkingCopy,
            readObject, deleteObject
        } = useMergeableObjectStore(
            storageKey, value, _createWorkingCopy, _mapDetailsToWorkingCopy
        );

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
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
            ensureWorkingCopy, readWorkingCopy, updateWorkingCopy, deleteWorkingCopy,
            readObject, deleteObject
        };
    });
}