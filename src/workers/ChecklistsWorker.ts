// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChecklistsApiClient, DefinitionDetails, DefinitionSummary, DefinitionSummaryPagedResult, SubmissionDetails, SubmissionSummary, SubmissionSummaryPagedResult } from "@/apiClients";
import { Definitions, StorageKey, Submissions, WorkerMessage } from "@/models";
import { getCurrentUser, initDefaultApiConfig } from "@/helpers";
import { isEqual } from "date-fns";
import { readFromStorage } from "@/infrastructure";

export const enum ChecklistsWorkerMessageType {
    Start = "start",
    DefinitionsDownloaded = "definitions_downloaded",
    SubmissionsDownloaded = "submissions_downloaded",
}

addEventListener("message", (ev) => {
    const msg = ev.data as WorkerMessage;
    if (msg.type === ChecklistsWorkerMessageType.Start) {
        Promise.resolve().then(async () => {
            await initDefaultApiConfig();
            await _downloadDefinitions();
            await _downloadSubmissions();
        });
    }
});

const _definitionsDownloadFrequency = 5 * 60 * 1000; // Five minutes
let _downloadingDefinitions = false;

async function _downloadDefinitions() {
    if (_downloadingDefinitions) {
        return;
    }
    try {
        _downloadingDefinitions = true;

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
            if (storedDefinition === undefined || !isEqual(storedDefinition?.timestamp, summary.timestamp)) {
                details[summary.uuid] = await checklistsApiClient.readDefinitionV1({
                    uuid: summary.uuid
                });
            } else {
                details[summary.uuid] = storedDefinition;
            }
        }

        self.postMessage(new WorkerMessage(
            ChecklistsWorkerMessageType.DefinitionsDownloaded,
            <Definitions>{ summaries, details }));

        setTimeout(() => {
            Promise.resolve().then(async () => await _downloadDefinitions());
        }, _definitionsDownloadFrequency);
    }
    catch (err) {
        console.warn("An error occurred while reading definitions", err);
    }
    finally {
        _downloadingDefinitions = false;
    }
}

const _submissionsDownloadFrequency = 5 * 60 * 1000; // Five minutes
let _downloadingSubmissions = false;

async function _downloadSubmissions() {
    if (_downloadingSubmissions) {
        return;
    }
    try {
        _downloadingSubmissions = true;

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
            if (storedSubmission === undefined || !isEqual(storedSubmission?.timestamp, summary.timestamp)) {
                details[summary.uuid] = await checklistsApiClient.readSubmissionV1({
                    uuid: summary.uuid
                });
            } else {
                details[summary.uuid] = storedSubmission;
            }
        }

        self.postMessage(new WorkerMessage(
            ChecklistsWorkerMessageType.SubmissionsDownloaded,
            <Submissions>{ summaries, details }));

        setTimeout(() => {
            Promise.resolve().then(async () => await _downloadSubmissions());
        }, _submissionsDownloadFrequency);
    }
    catch (err) {
        console.warn("An error occurred while reading submissions", err);
    }
    finally {
        _downloadingSubmissions = false;
    }
}