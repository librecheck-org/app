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

                            <ion-button fill="clear" @click="createSubmissionDraft(def.uuid)">Fill</ion-button>
                        </ion-card>
                    </ion-col>
                </ion-row>
            </ion-grid>
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonGrid, IonPage, IonRow } from "@ionic/vue";
import { useDefinitionListViewModel } from "@/viewModels";

const { data, commands } = useDefinitionListViewModel();
const { execute: createSubmissionDraft } = commands.createSubmissionDraft;
</script>
