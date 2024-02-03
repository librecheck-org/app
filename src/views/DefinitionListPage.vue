<template>
    <ion-page>
        <ion-content>
            <ion-grid>
                <ion-row>
                    <ion-col v-for="def in data.definitions" v-bind:key="def.uuid" size="12" size-sm="6" size-md="4"
                        size-lg="3">
                        <lc-clickable-card :actions="getActionSheetButtons(def.uuid)">
                            <ion-card-header>
                                <ion-card-title>{{ def.title }}</ion-card-title>
                                <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
                            </ion-card-header>
                            <ion-card-content>
                                <ion-list>
                                    <ion-item>
                                        <ion-icon aria-hidden="true" :icon="time" slot="start"></ion-icon>
                                        <ion-label color="medium">{{ intlFormat(def.timestamp) }}</ion-label>
                                    </ion-item>
                                </ion-list>
                            </ion-card-content>
                        </lc-clickable-card>
                    </ion-col>
                </ion-row>
            </ion-grid>

            <ion-fab slot="fixed" vertical="bottom" horizontal="end">
                <ion-fab-button @click="commands.add.execute()">
                    <ion-icon :icon="add"></ion-icon>
                </ion-fab-button>
            </ion-fab>
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { ActionSheetButton, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonIcon, IonItem, IonLabel, IonList, IonPage, IonRow } from "@ionic/vue";
import { add, time } from "ionicons/icons";
import LcClickableCard from "@/components/LcClickableCard.vue";
import { getDefaultActionSheetButtons } from "@/infrastructure";
import { intlFormat } from "date-fns";
import { useDefinitionListViewModel } from "@/viewModels";

const { data, commands } = useDefinitionListViewModel();
const { canExecute: canEdit } = commands.edit;
const { canExecute: canFill } = commands.fill;
const { canExecute: canDeleteObject } = commands.deleteObject;
const { canExecute: canDeleteWorkingCopy } = commands.deleteWorkingCopy;

function getActionSheetButtons(definitionUuid: string): ActionSheetButton[] {
    const buttons = getDefaultActionSheetButtons();
    if (canEdit(definitionUuid)) {
        buttons.push({
            text: "Edit",
            data: {
                command: commands.edit,
                args: [definitionUuid]
            },
        });
    }
    if (canFill(definitionUuid)) {
        buttons.push({
            text: "Fill",
            data: {
                command: commands.fill,
                args: [definitionUuid]
            },
        });
    }
    if (canDeleteWorkingCopy(definitionUuid)) {
        buttons.push({
            text: "Delete working copy",
            role: "destructive",
            data: {
                command: commands.deleteWorkingCopy,
                args: [definitionUuid]
            },
        });
    }
    if (canDeleteObject(definitionUuid)) {
        buttons.push({
            text: "Delete object",
            role: "destructive",
            data: {
                command: commands.deleteObject,
                args: [definitionUuid]
            },
        });
    }
    return buttons;
}
</script>

<style scoped>
ion-card ion-item {
    --padding-start: 0;
    --inner-padding-end: 0;
}
</style>