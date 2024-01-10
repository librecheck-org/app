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

            <ion-button slot="end" :disabled="!canForceSync" @click="forceSync" fill="clear" aria-label="Force sync">
                <ion-icon :icon="sync" aria-label="Sync is idle" slot="icon-only" color="medium"
                    v-if="systemStatusStore.checklistsSyncStatus == ChecklistsSyncStatus.Idle" />
                <ion-icon :icon="sync" aria-label="Sync is running" slot="icon-only" color="medium" class="lc-icon-spin"
                    v-if="systemStatusStore.checklistsSyncStatus == ChecklistsSyncStatus.Running" />
            </ion-button>
        </ion-item>
        <ion-item>
            <ion-label>Server v{{ systemStatusStore.value.serverVersion }}</ion-label>

            <ion-button slot="end" :disabled="true" fill="clear">
                <ion-icon :icon="heart" aria-label="Healthy connection" slot="icon-only" color="success"
                    v-if="systemStatusStore.serverConnectionStatus == ServerConnectionStatus.Healthy" />
                <ion-icon :icon="heartHalf" aria-label="Unhealthy connection" slot="icon-only" color="warning"
                    v-if="systemStatusStore.serverConnectionStatus == ServerConnectionStatus.Unhealthy" />
                <ion-icon :icon="heartDislike" aria-label="Disconnected" slot="icon-only" color="danger"
                    v-if="systemStatusStore.serverConnectionStatus == ServerConnectionStatus.Disconnected" />
            </ion-button>
        </ion-item>
    </ion-item-group>
</template>
  
<script setup lang="ts">
import { ChecklistsSyncStatus, ServerConnectionStatus } from "@/models";
import { IonButton, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, loadingController } from "@ionic/vue";
import { heart, heartDislike, heartHalf, sync } from "ionicons/icons";
import { Command } from "@/infrastructure";
import { onMounted } from "vue";
import { useSystemStatusStore } from "@/stores";

const props = defineProps<{
    updateClientCommand: Command,
    forceSyncCommand: Command,
}>();

const systemStatusStore = useSystemStatusStore();
const { canExecute: canUpdateClient, execute: _updateClient } = props.updateClientCommand;
const { canExecute: canForceSync, execute: forceSync } = props.forceSyncCommand;

async function updateClient() {
    const loading = await loadingController.create({
        message: "Updating...",
    });
    loading.present();
    await _updateClient();
}

onMounted(async () => await systemStatusStore.ensureIsInitialized());
</script>

<style>
.lc-icon-spin {
    animation-name: lc-icon-spin-animation;
    animation-duration: 1500ms;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
}

@keyframes lc-icon-spin-animation {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>