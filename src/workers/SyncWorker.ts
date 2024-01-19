// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { BroadcastChannelName, ChangeStatus, DefinitionLocalChange, Definitions, GenericWorkerMessageType, LockName, MergeableObject, MergeableObjects, StorageKey, SubmissionLocalChange, Submissions, SyncWorkerMessageType, WorkerMessage, updateChangeStatus } from "@/models";
import { ChecklistsApiClient, DefinitionChange, DefinitionDetails, DefinitionSummary, DefinitionSummaryPagedResult, SubmissionChange, SubmissionDetails, SubmissionSummary, SubmissionSummaryPagedResult } from "@/apiClients";
import { createBroadcastChannel, getCurrentUser, readFromStorage, updateStorage } from "@/infrastructure";
import { fireAndForget, getRecordValues, newUuid } from "@/helpers";
import { initializeWorker, scheduleNextExecution } from "./shared";
import { isEqual as areDatesEqual } from "date-fns";

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

let _readingDefinitions = false;
let _readingSubmissions = false;

async function _readDefinitions() {
    if (_readingDefinitions) {
        return;
    }
    try {
        _readingDefinitions = true;

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
    finally {
        _readingDefinitions = false;
    }
}

async function _readSubmissions() {
    if (_readingSubmissions) {
        return;
    }
    try {
        _readingSubmissions = true;

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
    finally {
        _readingSubmissions = false;
    }
}

async function _updateChecklistsData() {
    await _mergeChangeset();
}

async function _mergeChangeset() {
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

function _mapDefinitionWorkingCopiesToChanges(workingCopies: Record<string, DefinitionLocalChange> | undefined): DefinitionChange[] {
    return getRecordValues(workingCopies ?? {})
        .filter(x => x.changeStatus > ChangeStatus.Unchanged /* Not Unchanged and not internal negative statuses */)
        .map(x => <DefinitionChange>{
            uuid: x.uuid,
            timestamp: x.timestamp,
            changeStatus: x.changeStatus,
            contents: x.contents,
        });
}

function _mapSubmissionWorkingCopiesToChanges(workingCopies: Record<string, SubmissionLocalChange> | undefined): SubmissionChange[] {
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

async function _resetChangeStatus<TWorkingCopy extends MergeableObject>(key: StorageKey, changes: TWorkingCopy[]) {
    for (const change of changes) {
        const storedObjects = await readFromStorage<MergeableObjects<any, any, TWorkingCopy>>(key);
        if (storedObjects === undefined) {
            return;
        }
        const workingCopy = storedObjects.workingCopies[change.uuid];
        if (areDatesEqual(workingCopy.timestamp, change.timestamp)) {
            await updateStorage<MergeableObjects<any, any, TWorkingCopy>>(key, { workingCopies: { [workingCopy.uuid]: workingCopy } }, (v, u) => {
                const wc = getRecordValues(u.workingCopies!)[0];
                updateChangeStatus(wc, ChangeStatus.Unchanged);
                return <MergeableObjects<any, any, TWorkingCopy>>{ ...v, workingCopies: { ...v?.workingCopies, ...u.workingCopies } };
            });
        }
    }
}