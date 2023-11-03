<template>
    <ion-split-pane when="xl" content-id="main-content">
        <ion-menu content-id="main-content">
            <ion-header>
                <ion-toolbar>
                    <ion-title>LibreCheck</ion-title>
                </ion-toolbar>
            </ion-header>
            <ion-content>
                <ion-list v-if="currentUser.value">
                    <ion-item>
                        <ion-avatar slot="start">
                            <img alt="Silhouette of a person's head"
                                src="https://ionicframework.com/docs/img/demos/avatar.svg" />
                        </ion-avatar>
                        <ion-label>Item Avatar {{ currentUser.value.emailAddress }}</ion-label>
                    </ion-item>

                    <ion-item-group>
                        <ion-item-divider>
                            <ion-label>Checklists</ion-label>
                        </ion-item-divider>
                        <ion-item button router-link="/submissions" :detail="true">
                            <ion-label>Submissions</ion-label>
                        </ion-item>
                        <ion-item button router-link="/definitions" :detail="true">
                            <ion-label>Definitions</ion-label>
                        </ion-item>
                    </ion-item-group>

                    <SystemStatusMenuItems :update-client-command="commands.updateClientCommand" />
                </ion-list>
            </ion-content>
        </ion-menu>

        <ion-page id="main-content">
            <ion-header>
                <ion-toolbar>
                    <ion-buttons slot="start">
                        <ion-menu-button />
                    </ion-buttons>
                    <ion-title>{{ router.currentRoute.value.name }}</ion-title>
                </ion-toolbar>
            </ion-header>

            <ion-content class="ion-padding">
                <ion-router-outlet />
            </ion-content>
        </ion-page>
    </ion-split-pane>
</template>
  
<script setup lang="ts">
import { IonAvatar, IonButtons, IonContent, IonHeader, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList, IonMenu, IonMenuButton, IonPage, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar } from "@ionic/vue";
import SystemStatusMenuItems from "@/components/SystemStatusMenuItems.vue";
import router from "@/router";
import { useCurrentUserStore } from "@/stores";
import { useHomeViewModel } from "@/viewModels/HomeViewModel";

const { commands } = useHomeViewModel();

const currentUser = useCurrentUserStore();
</script>
  