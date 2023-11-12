// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, useCommand } from "@/infrastructure/Command";
import { ViewModel, useViewModel } from "@/infrastructure";
import { useDefinitionsStore, useSubmissionsStore } from "@/stores";
import { DefinitionSummary } from "@/apiClients";
import { Definitions } from "@/models";
import { reactive } from "vue";

export enum DefinitionListViewState {
    None
}

interface DefinitionListViewData {
    state: DefinitionListViewState;

    get definitions(): DefinitionSummary[];
}

class DefinitionListViewDataImpl implements DefinitionListViewData {
    constructor(private _definitions: Definitions) {
    }

    state: DefinitionListViewState = DefinitionListViewState.None;

    get definitions(): DefinitionSummary[] {
        return this._definitions.summaries;
    }
}

class DefinitionListViewCommands {
    constructor(
        public createSubmissionDraft: Command) {
    }
}

export function useDefinitionListViewModel(): ViewModel<DefinitionListViewData, DefinitionListViewCommands> {
    const _definitionsStore = useDefinitionsStore();
    const _submissionsStore = useSubmissionsStore();

    const data = reactive(new DefinitionListViewDataImpl(_definitionsStore.value));

    async function initialize() {
    }

    function _canUpdateApp(): boolean {
        return true;
    }

    async function _updateApp(definitionUuid: string): Promise<void> {
        await _submissionsStore.createDraft(definitionUuid);
    }

    const _updateClientCommand = useCommand(_canUpdateApp, _updateApp);
    const commands = new DefinitionListViewCommands(_updateClientCommand);

    return useViewModel({ data, commands, initialize });
}