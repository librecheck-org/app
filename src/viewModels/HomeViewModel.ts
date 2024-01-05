// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { reactive } from "vue";
import { useSystemStatusStore } from "@/stores";

export enum HomeViewState {
    None
}

class HomeViewData {
    state: HomeViewState = HomeViewState.None;
}

class HomeViewCommands {
    constructor(
        public updateClientCommand: Command) {
    }
}

export function useHomeViewModel(): ViewModel<HomeViewData, HomeViewCommands> {
    const _systemStatusStore = useSystemStatusStore();

    const data = reactive(new HomeViewData());

    async function initialize() {
    }

    function _canUpdateApp(): boolean {
        return _systemStatusStore.clientUpdatesAreAvailable;
    }

    async function _updateApp(): Promise<void> {
        _systemStatusStore.applyClientUpdates();
    }

    const _updateClientCommand = useCommand(_canUpdateApp, _updateApp);
    const commands = new HomeViewCommands(_updateClientCommand);

    return useViewModel({ data, commands, initialize });
}