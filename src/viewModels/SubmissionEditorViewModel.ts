// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, useCommand } from "@/infrastructure/Command";
import { SubmissionDraft, Submissions } from "@/models";
import { ViewModel, useViewModel } from "@/infrastructure";
import { PlainDarkPanelless } from "survey-core/themes/plain-dark-panelless";
import { SubmissionSummary } from "@/apiClients";
import { SurveyModel } from "survey-core";
import { reactive } from "vue";
import { useIonRouter } from "@ionic/vue";
import { useSubmissionsStore } from "@/stores";

export enum SubmissionEditorViewState {
    None
}

interface SubmissionEditorViewData {
    state: SubmissionEditorViewState;
    survey: SurveyModel | undefined;

    get submissions(): SubmissionSummary[];
}

class SubmissionEditorViewDataImpl implements SubmissionEditorViewData {
    constructor(private _submissions: Submissions) {
    }

    state: SubmissionEditorViewState = SubmissionEditorViewState.None;
    survey: SurveyModel | undefined;

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

    function _initializeSurvey(submissionDraft: SubmissionDraft): SurveyModel {
        const survey = new SurveyModel(JSON.parse(submissionDraft.definition.contents));
        survey.data = JSON.parse(submissionDraft.contents);
        survey.currentPageNo = submissionDraft.currentPageNumber;

        survey.onValueChanged.add(async (s: SurveyModel) => {
            submissionDraft.contents = JSON.stringify(s.data);
            await _submissionsStore.updateDraft(submissionDraft);
        });

        survey.onCurrentPageChanged.add(async (s: SurveyModel) => {
            submissionDraft.currentPageNumber = s.currentPageNo;
            await _submissionsStore.updateDraft(submissionDraft);
        });

        survey.applyTheme(PlainDarkPanelless);

        return survey;
    }

    async function initialize() {
        const submissionDraft = _submissionsStore.readDraft(submissionUuid);
        if (submissionDraft !== undefined) {
            data.survey = _initializeSurvey(submissionDraft);
        }
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