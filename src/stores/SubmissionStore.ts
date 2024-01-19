// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, StorageKey, SubmissionLocalChange, Submissions, updateChangeStatus } from "@/models";
import { PersistentStore, definePersistentStore, usePersistentStore } from "@/infrastructure";
import { getCurrentDate, newUuid, unrefType } from "@/helpers";
import { DefinitionDetails } from "@/apiClients";
import { ref } from "vue";

export interface SubmissionStore extends PersistentStore<Submissions> {
    createWorkingCopy(definition: DefinitionDetails): Promise<SubmissionLocalChange>;
    readWorkingCopy(submissionUuid: string): SubmissionLocalChange | undefined;
    updateWorkingCopy(submissionDraft: SubmissionLocalChange): Promise<void>;
    deleteWorkingCopy(submissionUuid: string): Promise<void>;
}

export function useSubmissionStore(): SubmissionStore {
    const storageKey = StorageKey.Submissions;
    return definePersistentStore<SubmissionStore, Submissions>(storageKey, () => {
        const value = ref<Submissions>({ summaries: [], details: {}, workingCopies: {} });

        const { ensureIsInitialized: _ensureIsInitialized, read, update } = usePersistentStore(storageKey, value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
        }

        async function createWorkingCopy(definition: DefinitionDetails): Promise<SubmissionLocalChange> {
            const workingCopy = <SubmissionLocalChange>{
                uuid: newUuid(),
                definition: definition,
                contents: "{}",
                timestamp: getCurrentDate(),
                changeStatus: ChangeStatus.Updated,
                currentPageNumber: 0,
            };
            await update({ workingCopies: { ...value.value.workingCopies, [workingCopy.uuid]: workingCopy } });
            return workingCopy;
        }

        function readWorkingCopy(submissionUuid: string): SubmissionLocalChange | undefined {
            return value.value.workingCopies[submissionUuid];
        }

        async function updateWorkingCopy(submissionDraft: SubmissionLocalChange): Promise<void> {
            const submissions = value.value.workingCopies;
            submissionDraft.timestamp = getCurrentDate();
            updateChangeStatus(submissionDraft, ChangeStatus.Updated);
            submissions[submissionDraft.uuid] = submissionDraft;
            await update({ workingCopies: submissions });
        }

        async function deleteWorkingCopy(submissionUuid: string): Promise<void> {
            const submissions = value.value.workingCopies;
            const submissionDraft = readWorkingCopy(submissionUuid);
            if (submissionDraft === undefined) {
                return;
            }
            submissionDraft.timestamp = getCurrentDate();
            updateChangeStatus(submissionDraft, ChangeStatus.Deleted);
            submissions[submissionUuid] = submissionDraft;
            await update({ workingCopies: submissions });
        }

        return {
            value: unrefType(value), ensureIsInitialized, read, update,
            createWorkingCopy, readWorkingCopy, updateWorkingCopy, deleteWorkingCopy
        };
    });
}