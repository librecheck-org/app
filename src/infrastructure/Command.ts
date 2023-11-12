import { ComputedRef, Ref, computed, ref } from "vue";

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