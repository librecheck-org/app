<template>
    <ion-list-header>
        <ion-label>System status</ion-label>
    </ion-list-header>
    <ion-item>
        <ion-label>Client v{{ appInfoStore.value.clientVersion }}</ion-label>
        <ion-button slot="end">Update</ion-button>
    </ion-item>
    <ion-item>
        <ion-label>Server v{{ appInfoStore.value.serverVersion }}</ion-label>
        <ion-icon :icon="heart" aria-label="Healthy connection" slot="end" color="success"
            v-if="appInfoStore.serverConnectionStatus == ServerConnectionStatus.Healthy" />
        <ion-icon :icon="heartHalf" aria-label="Unhealthy connection" slot="end" color="warning"
            v-if="appInfoStore.serverConnectionStatus == ServerConnectionStatus.Unhealthy" />
        <ion-icon :icon="heartDislike" aria-label="Disconnected" slot="end" color="danger"
            v-if="appInfoStore.serverConnectionStatus == ServerConnectionStatus.Disconnected" />
    </ion-item>
</template>
  
<script setup lang="ts">
import { IonButton, IonIcon, IonItem, IonLabel, IonListHeader } from "@ionic/vue";
import { heart, heartDislike, heartHalf } from "ionicons/icons";
import { ServerConnectionStatus } from "@/models";
import { onMounted } from "vue";
import { useAppInfoStore } from "@/stores";

const appInfoStore = useAppInfoStore();

onMounted(async () => await appInfoStore.ensureIsInitialized());
</script>
  
<style scoped></style>
  