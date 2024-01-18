// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, MergeableObject, MergeableObjects, StorageKey, updateChangeStatus } from "@/models";
import { PersistentStore, unrefType, usePersistentStore } from "@/infrastructure";
import { getCurrentDate, getRecordValues } from "@/helpers";
import { Ref } from "vue";

export interface MergeableObjectStore<TSummary, TDetails, TWorkingCopy extends MergeableObject> extends PersistentStore<MergeableObjects<TSummary, TDetails, TWorkingCopy>> {
    createWorkingCopy(objectUuid: string | undefined): Promise<TWorkingCopy>;
    readWorkingCopy(objectUuid: string): TWorkingCopy | undefined;
    updateWorkingCopy(workingCopy: TWorkingCopy): Promise<void>;
}

export function useMergeableObjectStore<TSummary, TDetails, TWorkingCopy extends MergeableObject>(
    storageKey: StorageKey,
    value: Ref<MergeableObjects<TSummary, TDetails, TWorkingCopy>>,
    createNewWorkingCopy: () => TWorkingCopy,
    mapToWorkingCopy: (objectUuid: string) => TWorkingCopy
): MergeableObjectStore<TSummary, TDetails, TWorkingCopy> {

    type TObjects = MergeableObjects<TSummary, TDetails, TWorkingCopy>;

    value.value = { summaries: [], details: {}, workingCopies: {} };
    const { ensureIsInitialized, read, update } = usePersistentStore(storageKey, value);

    async function createWorkingCopy(definitionUuid: string | undefined): Promise<TWorkingCopy> {
        let workingCopy: TWorkingCopy | undefined;
        if (definitionUuid === undefined) {
            // A completely new object.
            workingCopy = createNewWorkingCopy();
        } else {
            workingCopy = readWorkingCopy(definitionUuid);
            if (workingCopy !== undefined) {
                // A working copy already exists and it should not be created.
                return workingCopy;
            }
            // Working copy is created from existing object.
            workingCopy = mapToWorkingCopy(definitionUuid);
        }
        await update({ workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => {
            return <TObjects>{ ...v, workingCopies: { ...v?.workingCopies, ...u.workingCopies } };
        });
        return workingCopy;
    }

    function readWorkingCopy(definitionUuid: string): TWorkingCopy | undefined {
        return value.value.workingCopies[definitionUuid];
    }

    async function updateWorkingCopy(workingCopy: TWorkingCopy): Promise<void> {
        await update({ workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => {
            const wc = getRecordValues(u.workingCopies!)[0];
            wc.timestamp = getCurrentDate();
            updateChangeStatus(wc, ChangeStatus.Updated);
            return <TObjects>{ ...v, workingCopies: { ...v?.workingCopies, ...u.workingCopies } };
        });
    }

    return {
        value: unrefType(value), ensureIsInitialized, read, update,
        createWorkingCopy, readWorkingCopy, updateWorkingCopy
    };
}
