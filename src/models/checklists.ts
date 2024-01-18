// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import type { DefinitionDetails, DefinitionSummary, SubmissionDetails, SubmissionSummary } from "@/apiClients";

/**
 * Message types which can be received or sent by checklists worker.
 */
export const enum SyncWorkerMessageType {
    /**
     * Starts the periodic sync of checklists data.
     */
    StartPeriodicSync = "start_periodic_sync",

    /**
     * Forces an immediate sync, which is executed immediately
     * or right after a periodic sync, if one is in progress.
     */
    ForceImmediateSync = "force_immediate_sync",

    /**
     * Event triggered when a sync operation starts.
     */
    SyncStarted = "sync_started",

    /**
     * Event triggered when a sync operation completes successfully
     * or it fails due to network errors.
     */
    SyncCompleted = "sync_completed",

    /**
     * Event triggered when a sync operation fails due to merge issues.
     */
    SyncFailed = "sync_failed",

    DefinitionsRead = "definitions_read",
    SubmissionsRead = "submissions_read",
}

/**
 * Change status used to perform synchronization.
 * Positive numbers must match with corresponding server-side enumeration,
 * while negative numbers can be used to represent special client statuses,
 * as they are not considered by the synchronization flow.
 */
export const enum ChangeStatus {
    /**
     * Placeholder status, assigned to a new object when it is created
     * but not yet saved by the user. For example, when a user creates a new definition,
     * change status of given definition is set to placeholder until the first save.
     */
    Placeholder = -1,

    /**
     * Object does not have any change that should be synchronized.
     */
    Unchanged = 0,

    /**
     * Object has been created, or updated, and it must be synchronized.
     */
    Updated = 1,

    /**
     * Object has been deleted and it must be synchronized.
     */
    Deleted = 2
}

export const enum SyncStatus {
    RemoteOnly = 0,
    Synced = 1,
    WaitingForSync = 2,
}

export interface MergeableObject {
    uuid: string;
    timestamp: Date;
    changeStatus: ChangeStatus;
}

export function updateChangeStatus(obj: MergeableObject, newStatus: ChangeStatus): void {
    switch (obj.changeStatus) {
        case ChangeStatus.Deleted:
            throw new Error("A deleted object cannot be updated");

        default:
            obj.changeStatus = newStatus;
            break;
    }
}

export interface MergeableObjects<TSummary, TDetails, TWorkingCopy extends MergeableObject> {
    get summaries(): TSummary[];
    get details(): Record<string, TDetails>;
    get workingCopies(): Record<string, TWorkingCopy>;
}

export type Definitions = MergeableObjects<DefinitionSummary, DefinitionDetails, DefinitionLocalChange>;

export type Submissions = MergeableObjects<SubmissionSummary, SubmissionDetails, SubmissionLocalChange>;

export interface DefinitionLocalChange extends DefinitionDetails, MergeableObject {
    changeStatus: ChangeStatus;
}

export interface SubmissionLocalChange extends SubmissionDetails, MergeableObject {
    changeStatus: ChangeStatus;
    currentPageNumber: number;
}