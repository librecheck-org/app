// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, ViewEvents, ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { DefinitionWorkingCopy } from "@/models";
import { reactive } from "vue";
import { useDefinitionStore } from "@/stores";

export enum DefinitionEditorViewState {
    None
}

interface DefinitionEditorViewData {
    get state(): DefinitionEditorViewState;
    get workingCopy(): DefinitionWorkingCopy | undefined;
}

class DefinitionEditorViewDataImpl implements DefinitionEditorViewData {
    constructor(public readonly workingCopy: DefinitionWorkingCopy | undefined) {
    }

    state: DefinitionEditorViewState = DefinitionEditorViewState.None;
}

class DefinitionEditorViewCommands {
    constructor(
        public save: Command) {
    }
}

export function useDefinitionEditorViewModel(definitionUuid: string): ViewModel<DefinitionEditorViewData, DefinitionEditorViewCommands, ViewEvents> {
    const _definitionStore = useDefinitionStore();

    const data = reactive(new DefinitionEditorViewDataImpl(undefined));

    async function initialize() {
        await _definitionStore.ensureIsInitialized();
        data.workingCopy = _definitionStore.readWorkingCopy(definitionUuid);
        if (data.workingCopy === undefined) {
            throw new Error("Given definition UUID does not have a working copy");
        }
    }

    function _canSave(): boolean {
        return data.workingCopy !== undefined;
    }

    async function _save(): Promise<void> {
        await _definitionStore.updateWorkingCopy(data.workingCopy!);
        data.workingCopy = _definitionStore.readWorkingCopy(definitionUuid);
    }

    const _saveCommand = useCommand(_canSave, _save);
    const commands = new DefinitionEditorViewCommands(_saveCommand);

    const events = new ViewEvents();

    return useViewModel({ data, commands, events, initialize });
}