// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ComputedRef, Ref, computed, onMounted, ref } from "vue";

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
    get canExecute(): ComputedRef<boolean>;

    execute(...args: any[]): Promise<void>;
}

export const useCommand = (canExecute: () => boolean, execute: (...args: any[]) => Promise<void>): Command => {
    const isExecutingRef = ref(false);

    const canExecuteWrapper = () => !isExecutingRef.value && canExecute();
    const canExecuteCmp = computed(canExecuteWrapper);

    const executeWrapper = async (...args: any[]) => {
        if (canExecuteWrapper()) {
            try {
                isExecutingRef.value = true;
                await execute(args);
            } finally {
                isExecutingRef.value = false;
            }
        }
    };

    return { isExecuting: isExecutingRef, canExecute: canExecuteCmp, execute: executeWrapper };
};
