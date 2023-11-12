// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChecklistsApiClient, DefinitionDetails, DefinitionSummary, DefinitionSummaryPagedResult } from "@/apiClients";
import { Definitions, StorageKey, WorkerMessage } from "@/models";
import { getCurrentUser, initDefaultApiConfig } from "@/helpers";
import { isEqual } from "date-fns";
import { readFromStorage } from "@/infrastructure";

export const enum ChecklistsWorkerMessageType {
    Start = "start",
    DefinitionsDownloaded = "definitions_downloaded"
}

addEventListener("message", async (ev) => {
    const msg = ev.data as WorkerMessage;
    if (msg.type === ChecklistsWorkerMessageType.Start) {
        await initDefaultApiConfig();
        await _downloadDefinitions();
    }
});

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

        for (let i = 0; i < summaries.length; ++i) {
            const { uuid: definitionUuid, timestamp: definitionTimestamp } = summaries[i];
            const storedDefinition = storedDefinitions?.details[definitionUuid];

            // If definition details are missing from client storage,
            // or if stored definition details  have a timestamp which is different
            // from the one read from server, then they should be read using the API.
            if (storedDefinition === undefined || !isEqual(storedDefinition?.timestamp, definitionTimestamp)) {
                details[definitionUuid] = await checklistsApiClient.readDefinitionV1({
                    uuid: definitionUuid
                });
            } else {
                details[definitionUuid] = storedDefinition;
            }
        }

        self.postMessage(new WorkerMessage(
            ChecklistsWorkerMessageType.DefinitionsDownloaded,
            <Definitions>{ summaries, details }));
    }
    catch (err) {
        console.warn("An error occurred while reading definitions", err);
    }
    finally {
        _downloadingDefinitions = false;
    }
}