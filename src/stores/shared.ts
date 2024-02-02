// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, MergeableObjects, ObjectDetails, StorageKey, WorkingCopy, updateChangeStatus } from "@/models";
import { PersistentStore, usePersistentStore } from "@/infrastructure";
import { getCurrentDate, getRecordPairs, getRecordValues, unrefType } from "@/helpers";
import { Ref } from "vue";

export interface MergeableObjectStore<TSummary, TDetails extends ObjectDetails, TWorkingCopy extends WorkingCopy> extends PersistentStore<MergeableObjects<TSummary, TDetails, TWorkingCopy>> {
    ensureWorkingCopy(objectUuid: string | undefined, ...args: any[]): Promise<TWorkingCopy>;
    readWorkingCopy(objectUuid: string): TWorkingCopy | undefined;
    updateWorkingCopy(workingCopy: TWorkingCopy): Promise<void>;
    deleteWorkingCopy(objectUuid: string): Promise<void>;

    readObject(objectUuid: string): TDetails | undefined;
    deleteObject(objectUuid: string): Promise<void>;
}

export function useMergeableObjectStore<TSummary, TDetails extends ObjectDetails, TWorkingCopy extends WorkingCopy>(
    storageKey: StorageKey,
    value: Ref<MergeableObjects<TSummary, TDetails, TWorkingCopy>>,
    createWorkingCopy: (...args: any[]) => TWorkingCopy,
    mapDetailsToWorkingCopy: (details: TDetails, ...args: any[]) => TWorkingCopy
): MergeableObjectStore<TSummary, TDetails, TWorkingCopy> {

    type TObjects = MergeableObjects<TSummary, TDetails, TWorkingCopy>;

    value.value = { summaries: [], details: {}, workingCopies: {} };
    const { ensureIsInitialized, read, update } = usePersistentStore(storageKey, value);

    function _mapWorkingCopyToDetails(workingCopy: TWorkingCopy): TDetails {
        return <TDetails><unknown>{ ...workingCopy };
    }

    function _readDetails(objectUuid: string): TDetails | undefined {
        return value.value.details[objectUuid];
    }

    /**
     * Ensures that a working copy for given object is available and it is fresh.
     * @param objectUuid Object UUID.
     * @param args Additional arguments that will be passed to creation and mapping functions.
     * @returns A fresh working copy.
     */
    async function ensureWorkingCopy(objectUuid: string | undefined, ...args: any[]): Promise<TWorkingCopy> {
        let workingCopy: TWorkingCopy | undefined;
        if (objectUuid === undefined) {
            // A completely new object must be created.
            // This is the case when something is being added (e.g. a new definition).
            workingCopy = createWorkingCopy(...args);
        } else {
            workingCopy = readWorkingCopy(objectUuid);
            const details = _readDetails(objectUuid);
            if (details === undefined) {
                throw new Error(`Object with ${objectUuid} UUID does not have any details`);
            }
            if (workingCopy !== undefined && (workingCopy.changeStatus > ChangeStatus.Unchanged || details.timestamp <= workingCopy.timestamp)) {
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
            workingCopy = mapDetailsToWorkingCopy(details, ...args);
        }
        await update({ workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => {
            return <TObjects>{ ...v, workingCopies: { ...v?.workingCopies, ...u.workingCopies } };
        });
        return workingCopy;
    }

    /**
     * Reads the working copy related to object with given UUID.
     * @param objectUuid Object UUID.
     * @returns The working copy, if it exists.
     */
    function readWorkingCopy(objectUuid: string): TWorkingCopy | undefined {
        return value.value.workingCopies[objectUuid];
    }

    /**
     * Replaces the stored working copy with given new working copy.
     * @param workingCopy New working copy.
     */
    async function updateWorkingCopy(workingCopy: TWorkingCopy): Promise<void> {
        update({ workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => updateWorkingCopyCore(v, u, ChangeStatus.Updated));
    }

    /**
     * Deletes the working copy related to object with given UUID.
     * Generally, this does not imply that object is deleted: only its working copy is.
     * However, if object has not been synchronized yet, working copy deletion
     * also implies object deletion, since it does exist server-side.
     * @param objectUuid Object UUID.
     */
    async function deleteWorkingCopy(objectUuid: string): Promise<void> {
        await update({ workingCopies: { [objectUuid]: <TWorkingCopy>{} } }, deleteWorkingCopyCore);
    }

    /**
     * Reads the details related to given object UUID.
     * If a working copy exists and it is newer than stored details,
     * then working copy is mapped to details and it is returned.
     * Otherwise, stored details are returned, if available.
     * @param objectUuid Object UUID.
     * @returns Object details.
     */
    function readObject(objectUuid: string): TDetails | undefined {
        const workingCopy = readWorkingCopy(objectUuid);
        const details = _readDetails(objectUuid);
        if (workingCopy === undefined) {
            return details;
        }
        if (details === undefined || workingCopy.timestamp >= details.timestamp) {
            return _mapWorkingCopyToDetails(workingCopy);
        }
        return details;
    }

    async function deleteObject(objectUuid: string): Promise<void> {
        const workingCopy = await ensureWorkingCopy(objectUuid);
        update({ workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => updateWorkingCopyCore(v, u, ChangeStatus.Deleted));
    }

    return {
        value: unrefType(value), ensureIsInitialized, read, update,
        ensureWorkingCopy, readWorkingCopy, updateWorkingCopy, deleteWorkingCopy,
        readObject, deleteObject
    };
}

export function updateWorkingCopyCore<TWorkingCopy extends WorkingCopy>(
    v: MergeableObjects<any, any, TWorkingCopy>,
    u: Partial<MergeableObjects<any, any, TWorkingCopy>>,
    changeStatus: ChangeStatus
): MergeableObjects<any, any, TWorkingCopy> {
    const wc = getRecordValues(u.workingCopies!)[0];
    wc.timestamp = getCurrentDate();
    updateChangeStatus(wc, changeStatus);
    return { ...v, workingCopies: { ...v?.workingCopies, ...u.workingCopies } };
}

export function deleteWorkingCopyCore<TWorkingCopy extends WorkingCopy>(
    v: MergeableObjects<any, any, TWorkingCopy>,
    u: Partial<MergeableObjects<any, any, TWorkingCopy>>
): MergeableObjects<any, any, TWorkingCopy> {
    const wc = getRecordPairs(u.workingCopies!)[0];
    delete v.workingCopies[wc.key];
    return { ...v };
}