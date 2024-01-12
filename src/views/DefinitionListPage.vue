<template>
    <ion-page>
        <ion-content>
            <ion-grid>
                <ion-row>
                    <ion-col v-for="def in data.definitions" v-bind:key="def.uuid" size="12" size-sm="6" size-md="4"
                        size-lg="3">
                        <ion-card>
                            <ion-card-header>
                                <ion-card-title>{{ def.title }}</ion-card-title>
                                <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
                            </ion-card-header>

                            <ion-card-content>
                                Here's a small text description for the card content. Nothing more, nothing less.
                            </ion-card-content>

                            <ion-button :id="getOpenActionSheetId(def.uuid)" fill="clear">More</ion-button>
                            <ion-action-sheet :trigger="getOpenActionSheetId(def.uuid)" header="Actions"
                                :buttons="getActionSheetButtons(def.uuid)" @didDismiss="onActionSheetDidDismiss($event)" />
                        </ion-card>
                    </ion-col>
                </ion-row>
            </ion-grid>
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { ActionSheetButton, IonActionSheet, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonPage, IonRow } from "@ionic/vue";
import { getDefaultActionSheetButtons, onActionSheetDidDismiss } from "@/infrastructure";
import { useDefinitionListViewModel } from "@/viewModels";

const { data, commands } = useDefinitionListViewModel();
const { canExecute: canEdit } = commands.edit;
const { canExecute: canFill } = commands.fill;

function getOpenActionSheetId(definitionUuid: string): string {
    return `open-action-sheet-${definitionUuid}`;
}

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

    buttons.push({
        text: "Delete",
        role: "destructive",
    });

    return buttons;
}
</script>
