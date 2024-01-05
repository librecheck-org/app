// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import type { DefinitionDetails, DefinitionSummary, SubmissionDetails, SubmissionSummary } from "@/apiClients";

export enum ChangeStatus {
    Unchanged = 0,
    Updated = 1,
    Deleted = 2
}

export enum SyncStatus {
    RemoteOnly = 0,
    Synced = 1,
    WaitingForSync = 2,
}

export interface MergeableObject {
    changeStatus: ChangeStatus;
}

export function updateChangeStatus(obj: MergeableObject, newStatus: ChangeStatus): void {
    switch (obj.changeStatus) {
        case ChangeStatus.Unchanged:
        case ChangeStatus.Updated:
            obj.changeStatus = newStatus;
            break;

        case ChangeStatus.Deleted:
            throw new Error("A deleted object cannot be updated");

        default:
            obj.changeStatus = newStatus;
            break;
    }
}

export interface Definitions {
    get summaries(): DefinitionSummary[];
    get details(): Record<string, DefinitionDetails>;
    get workingCopies(): Record<string, DefinitionLocalChange>;
}

export interface Submissions {
    get summaries(): SubmissionSummary[];
    get details(): Record<string, SubmissionDetails>;
    get workingCopies(): Record<string, SubmissionLocalChange>;
}

export interface DefinitionLocalChange extends DefinitionDetails, MergeableObject {
    changeStatus: ChangeStatus;
}

export interface SubmissionLocalChange extends SubmissionDetails, MergeableObject {
    changeStatus: ChangeStatus;
    currentPageNumber: number;
}