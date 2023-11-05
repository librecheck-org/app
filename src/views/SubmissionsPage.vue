<template>
    <ion-page>
        <ion-content class="ion-padding">
            <ion-label>SUBS</ion-label>
            <ion-button @click="updateEmailAddress"></ion-button>
            <SurveyComponent :model="survey" />
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { IonButton, IonContent, IonLabel, IonPage } from "@ionic/vue";
import { Model } from "survey-core";
import { PlainDarkPanelless } from "survey-core/themes/plain-dark-panelless";
import { useCurrentUserStore } from "@/stores";

import "survey-core/defaultV2.css";

const currentUser = useCurrentUserStore();

const surveyJson = {
    elements: [{
        name: "FirstName",
        title: "Enter your first name:",
        type: "text"
    }, {
        name: "LastName",
        title: "Enter your last name:",
        type: "text"
    }]
};
const survey = new Model(surveyJson);
survey.applyTheme(PlainDarkPanelless);

async function updateEmailAddress() {
    await currentUser.update({ emailAddress: new Date().getSeconds().toString() });
}

</script>
  