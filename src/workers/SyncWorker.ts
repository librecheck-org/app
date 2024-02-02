// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { BroadcastChannelName, ChangeStatus, DefinitionWorkingCopy, Definitions, GenericWorkerMessageType, LockName, MergeableObjects, StorageKey, SubmissionWorkingCopy, Submissions, SyncWorkerMessageType, WorkerMessage, WorkingCopy } from "@/models";
import { ChecklistsApiClient, DefinitionChange, DefinitionDetails, DefinitionSummary, DefinitionSummaryPagedResult, SubmissionChange, SubmissionDetails, SubmissionSummary, SubmissionSummaryPagedResult } from "@/apiClients";
import { isEqual as areDatesEqual, compareAsc as compareDatesAsc, subDays } from "date-fns";
import { createBroadcastChannel, getCurrentUser, readFromStorage, updateStorage } from "@/infrastructure";
import { deleteWorkingCopyCore, updateWorkingCopyCore } from "@/stores/shared";
import { fireAndForget, getRecordValues, newUuid } from "@/helpers";
import { initializeWorker, scheduleNextExecution } from "./shared";

addEventListener("message", (ev) => {
    const msg = ev.data as WorkerMessage;
    fireAndForget(async () => await _handleMessage(msg));
});

async function _handleMessage(msg: WorkerMessage): Promise<void> {
    switch (msg.type) {
        case GenericWorkerMessageType.Initialize:
            await initializeWorker();
            break;

        case SyncWorkerMessageType.StartPeriodicSync:
            await _syncChecklistsData();
            break;

        case SyncWorkerMessageType.ForceImmediateSync:
            await _syncChecklistsDataCore();
            break;
    }
}

async function _syncChecklistsData() {
    try {
        await _syncChecklistsDataCore();
    }
    finally {
        scheduleNextExecution(_syncChecklistsData, 2 * 60 * 1000 /* Two minutes */);
    }
}

async function _syncChecklistsDataCore() {
    const lockOptions: LockOptions = { mode: "exclusive", ifAvailable: true };
    await navigator.locks.request(LockName.SyncChecklistsData, lockOptions, async (lock) => {
        if (lock === null) {
            // Another worker instance is already synchronizing checklists data
            // and this instance should not do it now.
            return;
        }
        _triggerSyncStartedEvent();
        await _readChecklistsData();
        await _updateChecklistsData();
        await _deleteAllStaleChecklistsWorkingCopies();
        _triggerSyncCompletedEvent();
    });
}

const _syncEventsChannel = createBroadcastChannel(BroadcastChannelName.SyncEvents);

function _triggerSyncStartedEvent() {
    _syncEventsChannel.postMessage(new WorkerMessage(SyncWorkerMessageType.SyncStarted, {}));
}

function _triggerSyncCompletedEvent() {
    _syncEventsChannel.postMessage(new WorkerMessage(SyncWorkerMessageType.SyncCompleted, {}));
}

async function _readChecklistsData() {
    await _readDefinitions();
    await _readSubmissions();
}

async function _readDefinitions() {
    try {
        const currentUser = await getCurrentUser();
        if (currentUser === undefined) {
            console.debug("User is not authenticated, definitions cannot be read");
            return;
        }

        const storedDefinitions = await readFromStorage<Definitions>(StorageKey.Definitions);

        const checklistsApiClient = new ChecklistsApiClient();

        const summaries: DefinitionSummary[] = [];
        const details: Record<string, DefinitionDetails> = {};

        const pageSize = 10;
        let pageNumber = 0;
        let pagedData: DefinitionSummaryPagedResult;
        do {
            pagedData = await checklistsApiClient.readDefinitionsV1({
                pageSize: pageSize,
                pageNumber: pageNumber++,
            });
            summaries.push(...pagedData.items);
        } while (pagedData.pageSize < pageSize);

        for (const summary of summaries) {
            const storedDefinition = storedDefinitions?.details[summary.uuid];

            // If definition details are missing from client storage,
            // or if stored definition details have a timestamp which is different
            // from the one read from server, then they should be read using the API.
            if (storedDefinition === undefined || !areDatesEqual(storedDefinition?.timestamp, summary.timestamp)) {
                details[summary.uuid] = await checklistsApiClient.readDefinitionV1({
                    uuid: summary.uuid
                });
            } else {
                details[summary.uuid] = storedDefinition;
            }
        }

        self.postMessage(new WorkerMessage(
            SyncWorkerMessageType.DefinitionsRead,
            <Definitions>{ summaries, details }));
    }
    catch (err) {
        console.warn("An error occurred while reading definitions", err);
    }
}

async function _readSubmissions() {
    try {
        const currentUser = await getCurrentUser();
        if (currentUser === undefined) {
            console.debug("User is not authenticated, submissions cannot be read");
            return;
        }

        const storedSubmissions = await readFromStorage<Submissions>(StorageKey.Submissions);

        const checklistsApiClient = new ChecklistsApiClient();

        const summaries: SubmissionSummary[] = [];
        const details: Record<string, SubmissionDetails> = {};

        const pageSize = 10;
        let pageNumber = 0;
        let pagedData: SubmissionSummaryPagedResult;
        do {
            pagedData = await checklistsApiClient.readSubmissionsV1({
                pageSize: pageSize,
                pageNumber: pageNumber++,
            });
            summaries.push(...pagedData.items);
        } while (pagedData.pageSize < pageSize);

        for (const summary of summaries) {
            const storedSubmission = storedSubmissions?.details[summary.uuid];

            // If submission details are missing from client storage,
            // or if stored submission details have a timestamp which is different
            // from the one read from server, then they should be read using the API.
            if (storedSubmission === undefined || !areDatesEqual(storedSubmission?.timestamp, summary.timestamp)) {
                details[summary.uuid] = await checklistsApiClient.readSubmissionV1({
                    uuid: summary.uuid
                });
            } else {
                details[summary.uuid] = storedSubmission;
            }
        }

        self.postMessage(new WorkerMessage(
            SyncWorkerMessageType.SubmissionsRead,
            <Submissions>{ summaries, details }));
    }
    catch (err) {
        console.warn("An error occurred while reading submissions", err);
    }
}

async function _updateChecklistsData() {
    try {
        const currentUser = await getCurrentUser();
        if (currentUser === undefined) {
            console.debug("User is not authenticated, changeset cannot be merged");
            return;
        }

        const storedDefinitions = await readFromStorage<Definitions>(StorageKey.Definitions);
        const storedSubmissions = await readFromStorage<Submissions>(StorageKey.Submissions);

        const definitionChanges = _mapDefinitionWorkingCopiesToChanges(storedDefinitions?.workingCopies);
        const submissionChanges = _mapSubmissionWorkingCopiesToChanges(storedSubmissions?.workingCopies);

        const definitionsHaveChanges = definitionChanges.length > 0;
        const submissionsHaveChanges = submissionChanges.length > 0;

        if (!definitionsHaveChanges && !submissionsHaveChanges) {
            console.info("There are no changes to be sent");
            return;
        }

        const checklistsApiClient = new ChecklistsApiClient();
        await checklistsApiClient.mergeChangesetV1({
            mergeChangesetCommand: {
                uuid: newUuid(),
                definitionChanges: definitionChanges,
                submissionChanges: submissionChanges,
            }
        });

        if (definitionsHaveChanges) {
            await _resetChangeStatus(StorageKey.Definitions, definitionChanges);
            await _readDefinitions();
        }
        if (submissionsHaveChanges) {
            await _resetChangeStatus(StorageKey.Submissions, submissionChanges);
            await _readSubmissions();
        }
    }
    catch (err) {
        console.warn("An error occurred while updating definitions and submissions", err);
    }
}

function _mapDefinitionWorkingCopiesToChanges(workingCopies: Record<string, DefinitionWorkingCopy> | undefined): DefinitionChange[] {
    return getRecordValues(workingCopies ?? {})
        .filter(x => x.changeStatus > ChangeStatus.Unchanged /* Not Unchanged and not internal negative statuses */)
        .map(x => <DefinitionChange>{
            uuid: x.uuid,
            timestamp: x.timestamp,
            changeStatus: x.changeStatus,
            contents: x.contents,
        });
}

function _mapSubmissionWorkingCopiesToChanges(workingCopies: Record<string, SubmissionWorkingCopy> | undefined): SubmissionChange[] {
    return getRecordValues(workingCopies ?? {})
        .filter(x => x.changeStatus > ChangeStatus.Unchanged /* Not Unchanged and not internal negative statuses */)
        .map(x => <SubmissionChange>{
            uuid: x.uuid,
            timestamp: x.timestamp,
            changeStatus: x.changeStatus,
            definitionUuid: x.definition.uuid,
            contents: x.contents,
        });
}

async function _resetChangeStatus<TWorkingCopy extends WorkingCopy>(key: StorageKey, changes: TWorkingCopy[]) {
    const updates = { workingCopies: Object.fromEntries(changes.map(c => [c.uuid, c])) };
    await updateStorage<MergeableObjects<any, any, TWorkingCopy>>(key, updates, _resetChangeStatusCore);
}

export function _resetChangeStatusCore<TWorkingCopy extends WorkingCopy>(
    v: MergeableObjects<any, any, TWorkingCopy>,
    u: Partial<MergeableObjects<any, any, TWorkingCopy>>
): MergeableObjects<any, any, TWorkingCopy> {
    const changes = getRecordValues(u.workingCopies!);
    for (const change of changes) {
        const workingCopy = v.workingCopies[change.uuid];
        if (areDatesEqual(workingCopy.timestamp, change.timestamp)) {
            const updates = { workingCopies: { [workingCopy.uuid]: workingCopy } };
            if (workingCopy.changeStatus == ChangeStatus.Deleted) {
                v = deleteWorkingCopyCore(v, updates);
            }
            else {
                v = updateWorkingCopyCore(v, updates, ChangeStatus.Unchanged);
            }
        }
    }
    return v;
}

async function _deleteAllStaleChecklistsWorkingCopies() {
    await _deleteStaleChecklistsWorkingCopies<DefinitionWorkingCopy>(StorageKey.Definitions);
    await _deleteStaleChecklistsWorkingCopies<SubmissionWorkingCopy>(StorageKey.Submissions);
}

async function _deleteStaleChecklistsWorkingCopies<TWorkingCopy extends WorkingCopy>(key: StorageKey) {
    await updateStorage<MergeableObjects<any, any, TWorkingCopy>>(key, {}, _deleteStaleChecklistsWorkingCopiesCore);
}

function _deleteStaleChecklistsWorkingCopiesCore<TWorkingCopy extends WorkingCopy>(
    v: MergeableObjects<any, any, TWorkingCopy>
): MergeableObjects<any, any, TWorkingCopy> {
    const workingCopies = getRecordValues(v.workingCopies);
    const threshold = subDays(new Date(), 1);
    for (const workingCopy of workingCopies) {
        if (workingCopy.changeStatus <= ChangeStatus.Unchanged && compareDatesAsc(workingCopy.timestamp, threshold) == -1) {
            const updates = { workingCopies: { [workingCopy.uuid]: workingCopy } };
            v = deleteWorkingCopyCore(v, updates);
        }
    }
    return v;
}