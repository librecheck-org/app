import { onMounted } from "vue";

export interface ViewModel<TProps = object, TCommands = object> {
    props: TProps;
    commands: TCommands;

    initialize(): Promise<void>;
}

export function useViewModel<TProps = object, TCommands = object>(vm: ViewModel<TProps, TCommands>) {
    onMounted(async () => await vm.initialize());
    return vm;
}
