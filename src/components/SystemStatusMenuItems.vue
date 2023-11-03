<template>
    <ion-list-header>
        <ion-label>System status</ion-label>
    </ion-list-header>
    <ion-item>
        <ion-label>Client v{{ systemStatusStore.value.clientVersion }}</ion-label>
        <ion-button slot="end" :disabled="!canUpdateClient" @click="updateClient"
            v-if="systemStatusStore.clientUpdatesAreAvailable">
            Update
        </ion-button>
    </ion-item>
    <ion-item>
        <ion-label>Server v{{ systemStatusStore.value.serverVersion }}</ion-label>
        <ion-icon :icon="heart" aria-label="Healthy connection" slot="end" color="success"
            v-if="systemStatusStore.serverConnectionStatus == ServerConnectionStatus.Healthy" />
        <ion-icon :icon="heartHalf" aria-label="Unhealthy connection" slot="end" color="warning"
            v-if="systemStatusStore.serverConnectionStatus == ServerConnectionStatus.Unhealthy" />
        <ion-icon :icon="heartDislike" aria-label="Disconnected" slot="end" color="danger"
            v-if="systemStatusStore.serverConnectionStatus == ServerConnectionStatus.Disconnected" />
    </ion-item>
</template>
  
<script setup lang="ts">
import { IonButton, IonIcon, IonItem, IonLabel, IonListHeader } from "@ionic/vue";
import { heart, heartDislike, heartHalf } from "ionicons/icons";
import { Command } from "@/infrastructure/Command";
import { ServerConnectionStatus } from "@/models";
import { onMounted } from "vue";
import { useSystemStatusStore } from "@/stores";

const props = defineProps<{
    updateClientCommand: Command,
}>();

const systemStatusStore = useSystemStatusStore();
const { canExecute: canUpdateClient, execute: updateClient } = props.updateClientCommand;

onMounted(async () => await systemStatusStore.ensureIsInitialized());
</script>
  
<style scoped></style>
  