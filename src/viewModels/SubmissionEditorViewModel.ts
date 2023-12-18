// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, useCommand } from "@/infrastructure/Command";
import { DefinitionSummary, SubmissionSummary } from "@/apiClients";
import { ViewModel, useViewModel } from "@/infrastructure";
import { Model } from "survey-core";
import { PlainDarkPanelless } from "survey-core/themes/plain-dark-panelless";
import { Submissions } from "@/models";
import { reactive } from "vue";
import { useIonRouter } from "@ionic/vue";
import { useSubmissionsStore } from "@/stores";

export enum SubmissionEditorViewState {
    None
}

interface SubmissionEditorViewData {
    state: SubmissionEditorViewState;
    survey: Model | undefined;

    get definitions(): DefinitionSummary[];
}

class SubmissionEditorViewDataImpl implements SubmissionEditorViewData {
    constructor(private _submissions: Submissions) {
    }

    state: SubmissionEditorViewState = SubmissionEditorViewState.None;
    survey: Model | undefined;

    get submissions(): SubmissionSummary[] {
        return this._submissions.summaries;
    }
}

class SubmissionEditorViewCommands {
    constructor(
        public createSubmissionDraft: Command) {
    }
}

export function useSubmissionEditorViewModel(submissionUuid: string): ViewModel<SubmissionEditorViewData, SubmissionEditorViewCommands> {
    const _submissionsStore = useSubmissionsStore();
    const _ionRouter = useIonRouter();

    const data = reactive(new SubmissionEditorViewDataImpl(_submissionsStore.value));

    async function initialize() {
        const submissionDraft = _submissionsStore.readDraft(submissionUuid);
        data.survey = new Model(submissionDraft.definition.contents);
        data.survey.applyTheme(PlainDarkPanelless);
    }

    function _canCreateSubmissionDraft(): boolean {
        return true;
    }

    async function _createSubmissionDraft(definitionUuid: string): Promise<void> {
        const submissionDraft = await _submissionsStore.createDraft(definitionUuid);
        _ionRouter.push("/submissions/" + submissionDraft.uuid);
    }

    const _createSubmissionDraftCommand = useCommand(_canCreateSubmissionDraft, _createSubmissionDraft);
    const commands = new SubmissionEditorViewCommands(_createSubmissionDraftCommand);

    return useViewModel({ data, commands, initialize });
}