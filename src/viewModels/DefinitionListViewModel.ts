// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ChangeStatus, SyncStatus } from "@/models";
import { Command, ViewEvents, ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { DefinitionStore, useDefinitionStore, useSubmissionStore } from "@/stores";
import { DefinitionSummary } from "@/apiClients";
import { compareDesc as compareDatesDesc } from "date-fns";
import { getRecordValues } from "@/helpers";
import { reactive } from "vue";
import { useIonRouter } from "@ionic/vue";

export enum DefinitionListViewState {
    None
}

interface Definition {
    get uuid(): string;
    get timestamp(): Date;
    get title(): string;
    get hasWorkingCopy(): boolean;
    get syncStatus(): SyncStatus;
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
        const storedDefinitions = this._definitionStore.value;

        const mappedSummaries = new Map<string, Definition>(
            storedDefinitions.summaries
                .map(x => <Definition>{
                    uuid: x.uuid,
                    timestamp: x.timestamp,
                    title: x.title,
                    hasWorkingCopy: false,
                    syncStatus: SyncStatus.RemoteOnly,
                })
                .map(x => [x.uuid, x]));

        const mappedWorkingCopies = new Map<string, Definition>(
            getRecordValues(storedDefinitions.workingCopies)
                .filter(x => x.changeStatus >= ChangeStatus.Unchanged && x.changeStatus != ChangeStatus.Deleted)
                .map(x => <Definition>{
                    uuid: x.uuid,
                    timestamp: x.timestamp,
                    title: x.title,
                    hasWorkingCopy: true,
                    syncStatus: x.changeStatus == ChangeStatus.Unchanged
                        ? SyncStatus.Synced
                        : SyncStatus.WaitingForSync,
                })
                .map(x => [x.uuid, x]));

        const definitions: Definition[] = [];

        definitions.push(...mappedWorkingCopies.values());
        definitions.push(...new Array(...mappedSummaries.values()).filter(x => !mappedWorkingCopies.has(x.uuid)));

        return definitions.toSorted((x, y) => compareDatesDesc(x.timestamp, y.timestamp));
    }
}

class DefinitionListViewCommands {
    constructor(
        public add: Command,
        public edit: Command,
        public fill: Command,
        public deleteObject: Command,
        public deleteWorkingCopy: Command) {
    }
}

export function useDefinitionListViewModel(): ViewModel<DefinitionListViewData, DefinitionListViewCommands, ViewEvents> {
    const _definitionStore = useDefinitionStore();
    const _submissionStore = useSubmissionStore();
    const _ionRouter = useIonRouter();

    const data = reactive(new DefinitionListViewDataImpl(_definitionStore));

    async function initialize() {
    }

    function _canAdd(): boolean {
        return true;
    }

    async function _add(): Promise<void> {
        const workingCopy = await _definitionStore.ensureWorkingCopy(undefined);
        _ionRouter.push("/definitions/" + workingCopy.uuid);
    }

    function _canEdit(): boolean {
        return true;
    }

    async function _edit(definitionUuid: string): Promise<void> {
        const workingCopy = await _definitionStore.ensureWorkingCopy(definitionUuid);
        _ionRouter.push("/definitions/" + workingCopy.uuid);
    }

    function _canFill(): boolean {
        return true;
    }

    async function _fill(definitionUuid: string): Promise<void> {
        const definition = _definitionStore.readObject(definitionUuid);
        if (definition !== undefined) {
            const workingCopy = await _submissionStore.ensureWorkingCopy(undefined, definition);
            _ionRouter.push("/submissions/" + workingCopy.uuid);
        }
    }

    function _canDeleteObject(definitionUuid: string): boolean {
        const definition = _definitionStore.readObject(definitionUuid);
        return definition?.uuid != null;
    }

    async function _deleteObject(definitionUuid: string): Promise<void> {
        await _definitionStore.deleteObject(definitionUuid);
    }

    function _canDeleteWorkingCopy(definitionUuid: string): boolean {
        const workingCopy = _definitionStore.readWorkingCopy(definitionUuid);
        return workingCopy !== undefined;
    }

    async function _deleteWorkingCopy(definitionUuid: string): Promise<void> {
        await _definitionStore.deleteWorkingCopy(definitionUuid);
    }

    const _addCommand = useCommand(_canAdd, _add);
    const _editCommand = useCommand(_canEdit, _edit);
    const _fillCommand = useCommand(_canFill, _fill);
    const _deleteObjectCommand = useCommand(_canDeleteObject, _deleteObject);
    const _deleteWorkingCopyCommand = useCommand(_canDeleteWorkingCopy, _deleteWorkingCopy);
    const commands = new DefinitionListViewCommands(_addCommand, _editCommand, _fillCommand, _deleteObjectCommand, _deleteWorkingCopyCommand);

    const events = new ViewEvents();

    return useViewModel({ data, commands, events, initialize });
}