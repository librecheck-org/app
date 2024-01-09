<template>
    <ion-item-group>
        <ion-item-divider>
            <ion-label>System status</ion-label>
        </ion-item-divider>
        <ion-item>
            <ion-label>Client v{{ systemStatusStore.value.clientVersion }}</ion-label>
            <ion-button id="update-client" slot="end" :disabled="!canUpdateClient" @click="updateClient"
                v-if="systemStatusStore.clientUpdatesAreAvailable">
                Update
            </ion-button>
            <ion-loading trigger="update-client" message="Updating..."> </ion-loading>
            <ion-icon :icon="sync" aria-label="Sync is idle" slot="end" color="medium"
                v-if="systemStatusStore.serverConnectionStatus == ServerConnectionStatus.Healthy" />
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
    </ion-item-group>
</template>
  
<script setup lang="ts">
import { IonButton, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonLoading } from "@ionic/vue";
import { heart, heartDislike, heartHalf, sync } from "ionicons/icons";
import { Command } from "@/infrastructure";
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
  