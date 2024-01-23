// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, StorageKey, SubmissionWorkingCopy, Submissions, updateChangeStatus } from "@/models";
import { DefinitionDetails, SubmissionDetails, SubmissionSummary } from "@/apiClients";
import { MergeableObjectStore, useMergeableObjectStore } from "./shared";
import { Ref, ref } from "vue";
import { getCurrentDate, newUuid, unrefType } from "@/helpers";
import { definePersistentStore } from "@/infrastructure";

export interface SubmissionStore extends MergeableObjectStore<SubmissionSummary, SubmissionDetails, SubmissionWorkingCopy> {
}

export function useSubmissionStore(): SubmissionStore {
    const storageKey = StorageKey.Submissions;
    return definePersistentStore<SubmissionStore, Submissions>(storageKey, () => {

        function _createWorkingCopy(definition: DefinitionDetails): SubmissionWorkingCopy {
            return {
                uuid: newUuid(),
                definition: definition,
                contents: "{}",
                timestamp: getCurrentDate(),
                changeStatus: ChangeStatus.Placeholder,
                currentPageNumber: 0,
            };
        }

        function _mapDetailsToWorkingCopy(submission: SubmissionDetails, definition: DefinitionDetails): SubmissionWorkingCopy {
            return {
                uuid: submission.uuid,
                definition: definition,
                contents: submission.contents,
                timestamp: submission.timestamp,
                changeStatus: ChangeStatus.Placeholder,
                currentPageNumber: 0,
            };
        }

        function _mapWorkingCopyToDetails(workingCopy: SubmissionWorkingCopy): SubmissionDetails {
            return {
                uuid: workingCopy.uuid,
                definition: workingCopy.definition,
                contents: workingCopy.contents,
                timestamp: workingCopy.timestamp,
            };
        }

        const value = ref() as Ref<Submissions>;
        const {
            ensureIsInitialized: _ensureIsInitialized, read, update,
            ensureWorkingCopy, readWorkingCopy, updateWorkingCopy,
            readByUuid
        } = useMergeableObjectStore(
            storageKey, value, _createWorkingCopy, _mapDetailsToWorkingCopy, _mapWorkingCopyToDetails
        );

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
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
            ensureWorkingCopy, readWorkingCopy, updateWorkingCopy, deleteWorkingCopy,
            readByUuid
        };
    });
}