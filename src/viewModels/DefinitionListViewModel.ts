// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { DefinitionStore, useDefinitionsStore, useSubmissionStore } from "@/stores";
import { DefinitionSummary } from "@/apiClients";
import { reactive } from "vue";
import { useIonRouter } from "@ionic/vue";

export enum DefinitionListViewState {
    None
}

interface DefinitionListViewData {
    state: DefinitionListViewState;

    get definitions(): DefinitionSummary[];
}

class DefinitionListViewDataImpl implements DefinitionListViewData {
    constructor(private _definitionStore: DefinitionStore) {
    }

    state: DefinitionListViewState = DefinitionListViewState.None;

    get definitions(): DefinitionSummary[] {
        return this._definitionStore.value.summaries;
    }
}

class DefinitionListViewCommands {
    constructor(
        public createSubmissionDraft: Command) {
    }
}

export function useDefinitionListViewModel(): ViewModel<DefinitionListViewData, DefinitionListViewCommands> {
    const _definitionStore = useDefinitionsStore();
    const _submissionStore = useSubmissionStore();
    const _ionRouter = useIonRouter();

    const data = reactive(new DefinitionListViewDataImpl(_definitionStore));

    async function initialize() {
    }

    function _canCreateSubmissionDraft(): boolean {
        return true;
    }

    async function _createSubmissionDraft(definitionUuid: string): Promise<void> {
        const definition = _definitionStore.readDefinition(definitionUuid);
        if (definition !== undefined) {
            const submissionDraft = await _submissionStore.createDraft(definition);
            _ionRouter.push("/submissions/" + submissionDraft.uuid);
        }
    }

    const _createSubmissionDraftCommand = useCommand(_canCreateSubmissionDraft, _createSubmissionDraft);
    const commands = new DefinitionListViewCommands(_createSubmissionDraftCommand);

    return useViewModel({ data, commands, initialize });
}