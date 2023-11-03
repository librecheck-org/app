<template>
    <ion-split-pane when="xl" content-id="main-content">
        <ion-menu content-id="main-content">
            <ion-header>
                <ion-toolbar>
                    <ion-title>LibreCheck</ion-title>
                </ion-toolbar>
            </ion-header>
            <ion-content>
                <ion-list>
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
                    <ion-title>Login</ion-title>
                    <ion-progress-bar type="indeterminate" v-if="isBusy"></ion-progress-bar>
                </ion-toolbar>
            </ion-header>
            <ion-content class="ion-padding">
                <ion-grid>
                    <ion-row>
                        <ion-col v-bind="columnSizes">
                            <h1>Login</h1>
                        </ion-col>
                    </ion-row>
                    <ion-row>
                        <ion-col v-bind="columnSizes">
                            <ion-input label="Email address" label-placement="stacked" type="email"
                                placeholder="email@domain.com" v-model="data.emailAddress"
                                :disabled="data.state != LoginViewState.EmailAddressCollection" />
                        </ion-col>
                    </ion-row>
                    <ion-row v-if="data.state == LoginViewState.EmailAddressCollection">
                        <ion-col v-bind="columnSizes">
                            <ion-button @click="requestAuthCode()" :disabled="!canRequestAuthCode" expand="block">
                                Send auth code
                            </ion-button>
                        </ion-col>
                    </ion-row>
                    <ion-row v-if="data.state == LoginViewState.AuthCodeCollection">
                        <ion-col v-bind="columnSizes">
                            <ion-input label="Auth code" label-placement="stacked" type="text" placeholder="ABCD1234"
                                v-model="data.authCode" :disabled="data.state != LoginViewState.AuthCodeCollection" />
                        </ion-col>
                    </ion-row>
                    <ion-row v-if="data.state == LoginViewState.AuthCodeCollection">
                        <ion-col v-bind="columnSizes">
                            <ion-button @click="verifyAuthCode()" :disabled="!canVerifyAuthCode" expand="block">
                                Verify auth code
                            </ion-button>
                        </ion-col>
                    </ion-row>
                </ion-grid>

                <ion-toast :is-open="data.state == LoginViewState.LoginSucceeded"
                    message="Login succeeded, redirecting to Home" :duration="5000" />
            </ion-content>
        </ion-page>
    </ion-split-pane>
</template>
  
<script setup lang="ts">
import { IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonList, IonMenu, IonMenuButton, IonPage, IonProgressBar, IonRow, IonSplitPane, IonTitle, IonToast, IonToolbar } from "@ionic/vue";
import { LoginViewState, useLoginViewModel } from "@/viewModels";
import SystemStatusMenuItems from "@/components/SystemStatusMenuItems.vue";
import { computed } from "vue";

const columnSizes = {
    "size": "12",
    "size-md": "8",
    "offset-md": "2",
    "size-lg": "6",
    "offset-lg": "3",
    "size-xl": "4",
    "offset-xl": "4"
};

const { data, commands } = useLoginViewModel();
const { canExecute: canRequestAuthCode, execute: requestAuthCode } = commands.requestAuthCodeCommand;
const { canExecute: canVerifyAuthCode, execute: verifyAuthCode } = commands.verifyAuthCodeCommand;

const isBusy = computed(() => {
    return commands.requestAuthCodeCommand.isExecuting.value
        || commands.verifyAuthCodeCommand.isExecuting.value;
});
</script>
  