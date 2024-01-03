<template>
    <ion-page>
        <ion-content>
            <ion-grid>
                <ion-row>
                    <ion-col v-for="sub in data.submissions" v-bind:key="sub.uuid">
                        <ion-card>
                            <ion-card-header>
                                <ion-card-title>{{ sub.definitionTitle }}</ion-card-title>
                                <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
                            </ion-card-header>

                            <ion-card-content>
                                Here's a small text description for the card content. Nothing more, nothing less.
                                {{ sub.timestamp }}
                            </ion-card-content>

                            <ion-button fill="clear" @click="editSubmissionDraft(sub.uuid)">Fill</ion-button>

                            <ion-button fill="clear" @click="editSubmissionDraft(sub.uuid)"
                                :disabled="!canEditSubmissionDraft" v-if="sub.hasWorkingCopy">Edit</ion-button>
                            <ion-button fill="clear" @click="deleteSubmissionDraft(sub.uuid)"
                                :disabled="!canDeleteSubmissionDraft" v-if="sub.hasWorkingCopy">Delete</ion-button>
                        </ion-card>
                    </ion-col>
                </ion-row>
            </ion-grid>
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonGrid, IonPage, IonRow } from "@ionic/vue";
import { useSubmissionListViewModel } from "@/viewModels";

const { data, commands } = useSubmissionListViewModel();
const { canExecute: canEditSubmissionDraft, execute: editSubmissionDraft } = commands.editSubmissionDraft;
const { canExecute: canDeleteSubmissionDraft, execute: deleteSubmissionDraft } = commands.deleteSubmissionDraft;
</script>
