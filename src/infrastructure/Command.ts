import { ComputedRef, Ref, computed, ref } from "vue";

export interface Command {
    get isExecuting(): Ref<boolean>;
    get canExecute(): ComputedRef<boolean>;

    execute(): Promise<void>;
}

export const useCommand = (canExecute: () => boolean, execute: () => Promise<void>): Command => {
    const isExecutingRef = ref(false);

    const canExecuteWrapper = () => !isExecutingRef.value && canExecute();
    const canExecuteCmp = computed(canExecuteWrapper);

    const executeWrapper = async () => {
        if (canExecuteWrapper()) {
            try {
                isExecutingRef.value = true;
                await execute();
            } finally {
                isExecutingRef.value = false;
            }
        }
    }

    return { isExecuting: isExecutingRef, canExecute: canExecuteCmp, execute: executeWrapper };
}