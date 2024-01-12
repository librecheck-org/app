// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { DefinitionStore, useDefinitionStore, useSubmissionStore } from "@/stores";
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
        public edit: Command,
        public fill: Command) {
    }
}

export function useDefinitionListViewModel(): ViewModel<DefinitionListViewData, DefinitionListViewCommands> {
    const _definitionStore = useDefinitionStore();
    const _submissionStore = useSubmissionStore();
    const _ionRouter = useIonRouter();

    const data = reactive(new DefinitionListViewDataImpl(_definitionStore));

    async function initialize() {
    }

    function _canEdit(): boolean {
        return true;
    }

    async function _edit(definitionUuid: string): Promise<void> {
        const workingCopy = await _definitionStore.createWorkingCopy(definitionUuid);
        _ionRouter.push("/definitions/" + workingCopy.uuid);
    }

    function _canFill(): boolean {
        return true;
    }

    async function _fill(definitionUuid: string): Promise<void> {
        const definition = _definitionStore.readByUuid(definitionUuid);
        if (definition !== undefined) {
            const submissionDraft = await _submissionStore.createWorkingCopy(definition);
            _ionRouter.push("/submissions/" + submissionDraft.uuid);
        }
    }

    const _editCommand = useCommand(_canEdit, _edit);
    const _fillCommand = useCommand(_canFill, _fill);
    const commands = new DefinitionListViewCommands(_editCommand, _fillCommand);

    return useViewModel({ data, commands, initialize });
}