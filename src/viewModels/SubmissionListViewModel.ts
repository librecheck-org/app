// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, useCommand } from "@/infrastructure/Command";
import { SubmissionStore, useSubmissionsStore } from "@/stores";
import { ViewModel, useViewModel } from "@/infrastructure";
import { SubmissionDraft } from "@/models";
import { SubmissionSummary } from "@/apiClients";
import { reactive } from "vue";
import { useIonRouter } from "@ionic/vue";

export enum SubmissionListViewState {
    None
}

interface SubmissionListViewData {
    state: SubmissionListViewState;

    get submissions(): SubmissionSummary[];
    get drafts(): SubmissionDraft[];
}

class SubmissionListViewDataImpl implements SubmissionListViewData {
    constructor(private _submissionStore: SubmissionStore) {
    }

    state: SubmissionListViewState = SubmissionListViewState.None;

    get submissions(): SubmissionSummary[] {
        return this._submissionStore.value.summaries;
    }

    get drafts(): SubmissionDraft[] {
        return Object.entries(this._submissionStore.value.drafts).map((kv) => kv[1]);
    }
}

class SubmissionListViewCommands {
    constructor(
        public editSubmissionDraft: Command) {
    }
}

export function useSubmissionListViewModel(): ViewModel<SubmissionListViewData, SubmissionListViewCommands> {
    const _submissionsStore = useSubmissionsStore();
    const _ionRouter = useIonRouter();

    const data = reactive(new SubmissionListViewDataImpl(_submissionsStore));

    async function initialize() {
    }

    function _canEditSubmissionDraft(): boolean {
        return true;
    }

    async function _editSubmissionDraft(submissionUuid: string): Promise<void> {
        _ionRouter.push("/submissions/" + submissionUuid);
    }

    const _editSubmissionDraftCommand = useCommand(_canEditSubmissionDraft, _editSubmissionDraft);
    const commands = new SubmissionListViewCommands(_editSubmissionDraftCommand);

    return useViewModel({ data, commands, initialize });
}