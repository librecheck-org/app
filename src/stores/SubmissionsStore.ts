// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { StorageKey, SubmissionDraft, Submissions } from "@/models";
import { defineIonicStore, useIonicStorage } from "@/infrastructure";
import { getCurrentDate, newUuid } from "@/helpers";
import { DefinitionDetails } from "@/apiClients";
import { ref } from "vue";

interface SubmissionStore {
    value: Submissions;

    ensureIsInitialized: () => Promise<void>;
    update: (value: Partial<Submissions> | undefined) => Promise<void>;

    createDraft(definition: DefinitionDetails): Promise<SubmissionDraft>;
    readDraft(submissionUuid: string): SubmissionDraft | undefined;
    updateDraft(submissionDraft: SubmissionDraft): Promise<void>;
}

export function useSubmissionsStore(): SubmissionStore {
    const storageKey = StorageKey.Submissions;
    return defineIonicStore(storageKey, () => {
        const _value = ref<Submissions>({ summaries: [], details: {}, drafts: {} });

        const { ensureIsInitialized: _ensureIsInitialized, update } = useIonicStorage(storageKey, _value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
        }

        async function createDraft(definition: DefinitionDetails): Promise<SubmissionDraft> {
            const draft = <SubmissionDraft>{
                uuid: newUuid(),
                definition: definition,
                contents: "{}",
                timestamp: getCurrentDate(),
                currentPageNumber: 0,
            };
            await update({ drafts: { ..._value.value.drafts, [draft.uuid]: draft } });
            return draft;
        }

        function readDraft(submissionUuid: string): SubmissionDraft | undefined {
            return _value.value.drafts[submissionUuid];
        }

        async function updateDraft(submissionDraft: SubmissionDraft): Promise<void> {
            const drafts = _value.value.drafts;
            submissionDraft.timestamp = getCurrentDate();
            drafts[submissionDraft.uuid] = submissionDraft;
            await update({ drafts: drafts });
        }

        return {
            value: _value, ensureIsInitialized, update,
            createDraft, readDraft, updateDraft
        };
    });
}