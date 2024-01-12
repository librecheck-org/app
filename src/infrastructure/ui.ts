// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Ref, onMounted, ref } from "vue";
import { ActionSheetButton } from "@ionic/vue";

export interface ViewModel<TData = object, TCommands = object> {
    data: TData;
    commands: TCommands;

    initialize(): Promise<void>;
}

export function useViewModel<TData = object, TCommands = object>(vm: ViewModel<TData, TCommands>) {
    onMounted(async () => await vm.initialize());
    return vm;
}

export interface Command {
    get isExecuting(): Ref<boolean>;

    canExecute(...args: any[]): boolean;
    execute(...args: any[]): Promise<void>;
}

type CanExecuteFunc = (...args: any[]) => boolean;
type ExecuteFunc = (...args: any[]) => Promise<void>;

export const useCommand = (canExecute: CanExecuteFunc, execute: ExecuteFunc): Command => {
    const isExecutingRef = ref(false);

    const canExecuteWrapper = (...args: any[]) => !isExecutingRef.value && canExecute(args);

    const executeWrapper = async (...args: any[]) => {
        if (canExecuteWrapper(args)) {
            try {
                isExecutingRef.value = true;
                await execute(args);
            } finally {
                isExecutingRef.value = false;
            }
        }
    };

    return { isExecuting: isExecutingRef, canExecute: canExecuteWrapper, execute: executeWrapper };
};

export interface ActionSheetCommand {
    command: Command;
    args?: any[] | undefined;
}

export function getDefaultActionSheetButtons(): ActionSheetButton[] {
    return [
        {
            // Ionic loads every button with "cancel" role as the bottom button.
            // Therefore, it is correct that this is the first button in the array.
            text: "Cancel",
            role: "cancel",
        }
    ];
}

export function onActionSheetDidDismiss(ev: CustomEvent) {
    const data = ev.detail?.data;
    if (data !== undefined && "command" in data) {
        const { command, args } = ev.detail.data;
        command.execute(...args);
    }
}