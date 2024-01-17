<template>
    <ion-page>
        <ion-content class="ion-padding">
            <h2>{{ data.workingCopy?.title }}</h2>
            <div id="lc-json-editor" ref="editorElem"></div>

            <ion-fab slot="fixed" vertical="bottom" horizontal="end">
                <ion-fab-button @click="commands.save.execute()" :disabled="!commands.save.canExecute()">
                    <ion-icon :icon="save"></ion-icon>
                </ion-fab-button>
            </ion-fab>
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { IonContent, IonFab, IonFabButton, IonIcon, IonPage } from "@ionic/vue";
import { onBeforeMount, ref } from "vue";
import { save } from "ionicons/icons";
import { useDefinitionEditorViewModel } from "@/viewModels";

const props = defineProps<{
    definitionUuid: string,
}>();

const { data, commands, events, } = useDefinitionEditorViewModel(props.definitionUuid);

const editorElem = ref(null);
let editor: monaco.editor.IStandaloneCodeEditor | undefined;

events.onInitialized = async () => {
    console.log("contents", data.workingCopy?.contents);
    editor = monaco.editor.create(editorElem.value!, {
        value: data.workingCopy?.contents,
        language: "json",
        automaticLayout: true,
    });

    editor.onDidBlurEditorText(() => {
        data.workingCopy!.contents = editor!.getValue();
    });
};

onBeforeMount(() => {
    if (editor !== undefined) {
        editor.dispose();
    }
});
</script>

<style>
#lc-json-editor {
    width: 100%;
    height: 100%;
}
</style>