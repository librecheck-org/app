<template>
    <ion-page>
        <ion-content class="ion-padding">
            <JsonEditorVue v-model="data.workingCopy.contents" v-bind="{/* local props & attrs */ }" />
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { IonContent, IonPage } from "@ionic/vue";
import JsonEditorVue from "json-editor-vue";
import { useDefinitionEditorViewModel } from "@/viewModels";

const props = defineProps<{
    definitionUuid: string,
}>();

const { data } = useDefinitionEditorViewModel(props.definitionUuid);
</script>
  