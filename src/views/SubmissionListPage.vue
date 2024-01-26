<template>
    <ion-page>
        <ion-content>
            <ion-grid>
                <ion-row>
                    <ion-col v-for="sub in data.submissions" v-bind:key="sub.uuid" size="12" size-sm="6" size-md="4"
                        size-lg="3">
                        <lc-clickable-card :actions="getActionSheetButtons(sub.uuid)">
                            <ion-card-header>
                                <ion-card-title>{{ sub.definitionTitle }}</ion-card-title>
                                <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
                            </ion-card-header>
                            <ion-card-content>
                                Here's a small text description for the card content. Nothing more, nothing less.
                                {{ sub.timestamp }}
                            </ion-card-content>
                        </lc-clickable-card>
                    </ion-col>
                </ion-row>
            </ion-grid>
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { ActionSheetButton, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonPage, IonRow } from "@ionic/vue";
import LcClickableCard from "@/components/LcClickableCard.vue";
import { getDefaultActionSheetButtons } from "@/infrastructure";
import { useSubmissionListViewModel } from "@/viewModels";

const { data, commands } = useSubmissionListViewModel();
const { canExecute: canFill } = commands.fill;
const { canExecute: canDeleteObject } = commands.deleteObject;
const { canExecute: canDeleteWorkingCopy } = commands.deleteWorkingCopy;

function getActionSheetButtons(submissionUuid: string): ActionSheetButton[] {
    const buttons = getDefaultActionSheetButtons();
    if (canFill(submissionUuid)) {
        buttons.push({
            text: "Fill",
            data: {
                command: commands.fill,
                args: [submissionUuid]
            },
        });
    }
    if (canDeleteWorkingCopy(submissionUuid)) {
        buttons.push({
            text: "Delete working copy",
            role: "destructive",
            data: {
                command: commands.deleteWorkingCopy,
                args: [submissionUuid]
            },
        });
    }
    if (canDeleteObject(submissionUuid)) {
        buttons.push({
            text: "Delete object",
            role: "destructive",
            data: {
                command: commands.deleteObject,
                args: [submissionUuid]
            },
        });
    }
    return buttons;
}
</script>
