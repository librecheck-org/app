// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, StorageKey, SubmissionLocalChange, Submissions, updateChangeStatus } from "@/models";
import { definePersistentStore, usePersistentStorage } from "@/infrastructure";
import { getCurrentDate, newUuid } from "@/helpers";
import { DefinitionDetails } from "@/apiClients";
import { ref } from "vue";

export interface SubmissionStore {
    value: Submissions;

    ensureIsInitialized: () => Promise<void>;
    update: (value: Partial<Submissions> | undefined) => Promise<void>;

    createDraft(definition: DefinitionDetails): Promise<SubmissionLocalChange>;
    readDraft(submissionUuid: string): SubmissionLocalChange | undefined;
    updateDraft(submissionDraft: SubmissionLocalChange): Promise<void>;
    deleteDraft(submissionUuid: string): Promise<void>;
}

export function useSubmissionStore(): SubmissionStore {
    const storageKey = StorageKey.Submissions;
    return definePersistentStore(storageKey, () => {
        const _value = ref<Submissions>({ summaries: [], details: {}, workingCopies: {} });

        const { ensureIsInitialized: _ensureIsInitialized, update } = usePersistentStorage(storageKey, _value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
        }

        async function createDraft(definition: DefinitionDetails): Promise<SubmissionLocalChange> {
            const draft = <SubmissionLocalChange>{
                uuid: newUuid(),
                definition: definition,
                contents: "{}",
                timestamp: getCurrentDate(),
                changeStatus: ChangeStatus.Updated,
                currentPageNumber: 0,
            };
            await update({ workingCopies: { ..._value.value.workingCopies, [draft.uuid]: draft } });
            return draft;
        }

        function readDraft(submissionUuid: string): SubmissionLocalChange | undefined {
            return _value.value.workingCopies[submissionUuid];
        }

        async function updateDraft(submissionDraft: SubmissionLocalChange): Promise<void> {
            const submissions = _value.value.workingCopies;
            submissionDraft.timestamp = getCurrentDate();
            updateChangeStatus(submissionDraft, ChangeStatus.Updated);
            submissions[submissionDraft.uuid] = submissionDraft;
            await update({ workingCopies: submissions });
        }

        async function deleteDraft(submissionUuid: string): Promise<void> {
            const submissions = _value.value.workingCopies;
            const submissionDraft = readDraft(submissionUuid);
            if (submissionDraft === undefined) {
                return;
            }
            submissionDraft.timestamp = getCurrentDate();
            updateChangeStatus(submissionDraft, ChangeStatus.Deleted);
            submissions[submissionUuid] = submissionDraft;
            await update({ workingCopies: submissions });
        }

        return {
            value: _value, ensureIsInitialized, update,
            createDraft, readDraft, updateDraft, deleteDraft
        };
    });
}