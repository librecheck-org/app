<template>
    <ion-page>
        <ion-content class="ion-padding">
            <ion-label>SUBS</ion-label>
            <SurveyComponent :model="data.survey" v-if="data.survey" />
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { IonContent, IonLabel, IonPage } from "@ionic/vue";
import { useSubmissionEditorViewModel } from "@/viewModels";

import "survey-core/defaultV2.css";

const props = defineProps<{
    submissionUuid: string,
}>();

const { data } = useSubmissionEditorViewModel(props.submissionUuid);
</script>
  