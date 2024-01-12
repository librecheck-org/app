// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, SyncStatus } from "@/models";
import { Command, ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { SubmissionStore, useSubmissionStore } from "@/stores";
import { compareDesc as compareDatesDesc } from "date-fns";
import { getRecordValues } from "@/helpers";
import { reactive } from "vue";
import { useIonRouter } from "@ionic/vue";

export enum SubmissionListViewState {
    None
}

interface Submission {
    get uuid(): string;
    get timestamp(): Date;
    get definitionTitle(): string;
    get hasWorkingCopy(): boolean;
    get syncStatus(): SyncStatus;
}

interface SubmissionListViewData {
    state: SubmissionListViewState;

    get submissions(): Submission[];
}

class SubmissionListViewDataImpl implements SubmissionListViewData {
    constructor(private _submissionStore: SubmissionStore) {
    }

    state: SubmissionListViewState = SubmissionListViewState.None;

    get submissions(): Submission[] {
        const storedSubmissions = this._submissionStore.value;

        const mappedSummaries = new Map<string, Submission>(
            storedSubmissions.summaries
                .map(x => <Submission>{
                    uuid: x.uuid,
                    timestamp: x.timestamp,
                    definitionTitle: x.definition.title,
                    hasWorkingCopy: false,
                    syncStatus: SyncStatus.RemoteOnly,
                })
                .map(x => [x.uuid, x]));

        const mappedWorkingCopies = new Map<string, Submission>(
            getRecordValues(storedSubmissions.workingCopies)
                .filter(x => x.changeStatus != ChangeStatus.Deleted)
                .map(x => <Submission>{
                    uuid: x.uuid,
                    timestamp: x.timestamp,
                    definitionTitle: x.definition.title,
                    hasWorkingCopy: true,
                    syncStatus: x.changeStatus == ChangeStatus.Unchanged
                        ? SyncStatus.Synced
                        : SyncStatus.WaitingForSync,
                })
                .map(x => [x.uuid, x]));

        const submissions: Submission[] = [];

        submissions.push(...mappedWorkingCopies.values());
        submissions.push(...new Array(...mappedSummaries.values()).filter(x => !mappedWorkingCopies.has(x.uuid)));

        return submissions.toSorted((x, y) => compareDatesDesc(x.timestamp, y.timestamp));
    }
}

class SubmissionListViewCommands {
    constructor(
        public editSubmissionDraft: Command,
        public deleteSubmissionDraft: Command) {
    }
}

export function useSubmissionListViewModel(): ViewModel<SubmissionListViewData, SubmissionListViewCommands> {
    const _submissionStore = useSubmissionStore();
    const _ionRouter = useIonRouter();

    const data = reactive(new SubmissionListViewDataImpl(_submissionStore));

    async function initialize() {
    }

    function _canEditSubmissionDraft(): boolean {
        return true;
    }

    async function _editSubmissionDraft(submissionUuid: string): Promise<void> {
        _ionRouter.push("/submissions/" + submissionUuid);
    }

    function _canDeleteSubmissionDraft(): boolean {
        return true;
    }

    async function _deleteSubmissionDraft(submissionUuid: string): Promise<void> {
        await _submissionStore.deleteWorkingCopy(submissionUuid);
    }

    const _editSubmissionDraftCommand = useCommand(_canEditSubmissionDraft, _editSubmissionDraft);
    const _deleteSubmissionDraftCommand = useCommand(_canDeleteSubmissionDraft, _deleteSubmissionDraft);
    const commands = new SubmissionListViewCommands(_editSubmissionDraftCommand, _deleteSubmissionDraftCommand);

    return useViewModel({ data, commands, initialize });
}