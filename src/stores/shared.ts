// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, MergeableObjects, ObjectDetails, StorageKey, WorkingCopy, updateChangeStatus } from "@/models";
import { PersistentStore, usePersistentStore } from "@/infrastructure";
import { getCurrentDate, getRecordValues, unrefType } from "@/helpers";
import { Ref } from "vue";

export interface MergeableObjectStore<TSummary, TDetails extends ObjectDetails, TWorkingCopy extends WorkingCopy> extends PersistentStore<MergeableObjects<TSummary, TDetails, TWorkingCopy>> {
    ensureWorkingCopy(objectUuid: string | undefined, ...args: any[]): Promise<TWorkingCopy>;
    readWorkingCopy(objectUuid: string): TWorkingCopy | undefined;
    updateWorkingCopy(workingCopy: TWorkingCopy): Promise<void>;
}

export function useMergeableObjectStore<TSummary, TDetails extends ObjectDetails, TWorkingCopy extends WorkingCopy>(
    storageKey: StorageKey,
    value: Ref<MergeableObjects<TSummary, TDetails, TWorkingCopy>>,
    createWorkingCopy: (...args: any[]) => TWorkingCopy,
    mapToWorkingCopy: (objectUuid: string, ...args: any[]) => TWorkingCopy
): MergeableObjectStore<TSummary, TDetails, TWorkingCopy> {

    type TObjects = MergeableObjects<TSummary, TDetails, TWorkingCopy>;

    value.value = { summaries: [], details: {}, workingCopies: {} };
    const { ensureIsInitialized, read, update } = usePersistentStore(storageKey, value);

    async function ensureWorkingCopy(objectUuid: string | undefined, ...args: any[]): Promise<TWorkingCopy> {
        let workingCopy: TWorkingCopy | undefined;
        if (objectUuid === undefined) {
            // A completely new object must be created.
            // This is the case when something is being added (e.g. a new definition).
            workingCopy = createWorkingCopy(...args);
        } else {
            workingCopy = readWorkingCopy(objectUuid);
            const existingObject = value.value.details[objectUuid];
            if (workingCopy !== undefined && (workingCopy.changeStatus > ChangeStatus.Unchanged || existingObject.timestamp <= workingCopy.timestamp)) {
                // A working copy already exists with changes. When working copy has changes
                // and it is stale, that might be a conflict and a new working copy should not be created
                // in order not to lose local changes.
                return workingCopy;
            }
            // A new working copy is created from an existing object. This case maps to two scenarios.
            //
            // The first one is the easier one: on this device, the object is being edited
            // for the first time and a new working copy has to be created from it.
            //
            // The second one involves more steps. 
            // 1) A working copy was created on this device, but it was not changed at all,
            //    or its changes have successfully been sent to the server.
            // 2) On another device, the same object has been changed and its changes have been sent.
            // 3) The synchronization worker has brought those changes to this device.
            // 4) The object is going to be edited now, but its working copy is stale,
            //    since existing object timestamp is greater than working copy one:
            //    therefore, working copy must be created again from received object. 
            workingCopy = mapToWorkingCopy(objectUuid, ...args);
        }
        await update({ workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => {
            return <TObjects>{ ...v, workingCopies: { ...v?.workingCopies, ...u.workingCopies } };
        });
        return workingCopy;
    }

    function readWorkingCopy(objectUuid: string): TWorkingCopy | undefined {
        return value.value.workingCopies[objectUuid];
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
        ensureWorkingCopy, readWorkingCopy, updateWorkingCopy
    };
}
