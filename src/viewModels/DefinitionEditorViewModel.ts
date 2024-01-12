// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { DefinitionLocalChange } from "@/models";
import { reactive } from "vue";
import { useDefinitionStore } from "@/stores";

export enum DefinitionEditorViewState {
    None
}

interface DefinitionEditorViewData {
    get state(): DefinitionEditorViewState;
    get workingCopy(): DefinitionLocalChange | undefined;
}

class DefinitionEditorViewDataImpl implements DefinitionEditorViewData {
    constructor(private _workingCopy: DefinitionLocalChange | undefined) {
        this.workingCopy = _workingCopy;
    }

    state: DefinitionEditorViewState = DefinitionEditorViewState.None;
    workingCopy: DefinitionLocalChange | undefined;
}

class DefinitionEditorViewCommands {
    constructor(
        public save: Command) {
    }
}

export function useDefinitionEditorViewModel(definitionUuid: string): ViewModel<DefinitionEditorViewData, DefinitionEditorViewCommands> {
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
        return true;
    }

    async function _save(): Promise<void> {
    }

    const _saveCommand = useCommand(_canSave, _save);
    const commands = new DefinitionEditorViewCommands(_saveCommand);

    return useViewModel({ data, commands, initialize });
}