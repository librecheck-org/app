// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Command, ViewEvents, ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { CurrentUserStore, useCurrentUserStore, useSystemStatusStore } from "@/stores";
import { ChecklistsSyncStatus } from "@/models";
import { UserDetails } from "@/apiClients";
import { reactive } from "vue";

export enum HomeViewState {
    None
}

interface HomeViewData {
    state: HomeViewState;

    get currentUser(): UserDetails | undefined;
}

class HomeViewDataImpl implements HomeViewData {
    constructor(private readonly _currentUseStore: CurrentUserStore) {
    }

    state: HomeViewState = HomeViewState.None;

    get currentUser() {
        return this._currentUseStore.value;
    }
}

class HomeViewCommands {
    constructor(
        public updateClientCommand: Command,
        public forceSyncCommand: Command) {
    }
}

export function useHomeViewModel(): ViewModel<HomeViewData, HomeViewCommands, ViewEvents> {
    const _currentUserStore = useCurrentUserStore();
    const _systemStatusStore = useSystemStatusStore();

    const data = reactive(new HomeViewDataImpl(_currentUserStore));

    async function initialize() {
        await _currentUserStore.refresh();
    }

    function _canUpdateApp(): boolean {
        return _systemStatusStore.clientUpdatesAreAvailable;
    }

    async function _updateApp(): Promise<void> {
        _systemStatusStore.applyClientUpdates();
    }

    function _canForceSync(): boolean {
        return _systemStatusStore.checklistsSyncStatus == ChecklistsSyncStatus.Idle;
    }

    async function _forceSync(): Promise<void> {
        _systemStatusStore.forceChecklistsSync();
    }

    const _updateClientCommand = useCommand(_canUpdateApp, _updateApp);
    const _forceSyncCommand = useCommand(_canForceSync, _forceSync);
    const commands = new HomeViewCommands(_updateClientCommand, _forceSyncCommand);

    const events = new ViewEvents();

    return useViewModel({ data, commands, events, initialize });
}