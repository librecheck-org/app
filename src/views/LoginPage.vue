<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-title>LibreCheck</ion-title>
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
                            placeholder="email@domain.com" v-model="props.emailAddress"
                            :disabled="props.state != LoginViewState.EmailAddressCollection" />
                    </ion-col>
                </ion-row>
                <ion-row v-if="props.state == LoginViewState.EmailAddressCollection">
                    <ion-col v-bind="columnSizes">
                        <ion-button @click="requestAuthCode()" :disabled="!canRequestAuthCode" expand="block">
                            Send auth code
                        </ion-button>
                    </ion-col>
                </ion-row>
                <ion-row v-if="props.state == LoginViewState.AuthCodeCollection">
                    <ion-col v-bind="columnSizes">
                        <ion-input label="Auth code" label-placement="stacked" type="text" placeholder="ABCD1234"
                            v-model="props.authCode" :disabled="props.state != LoginViewState.AuthCodeCollection" />
                    </ion-col>
                </ion-row>
                <ion-row v-if="props.state == LoginViewState.AuthCodeCollection">
                    <ion-col v-bind="columnSizes">
                        <ion-button @click="verifyAuthCode()" :disabled="!canVerifyAuthCode" expand="block">
                            Verify auth code
                        </ion-button>
                    </ion-col>
                </ion-row>
            </ion-grid>

            <ion-toast :is-open="props.state == LoginViewState.LoginSucceeded"
                message="Login succeeded, redirecting to Home" :duration="5000" />
        </ion-content>

        <ion-footer>
            <span v-if="props.apiVersion">
                <small>API version {{ props.apiVersion.version }}</small>
            </span>
        </ion-footer>
    </ion-page>
</template>
  
<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonFooter, IonProgressBar, IonGrid, IonRow, IonCol, IonToast } from '@ionic/vue';
import { useLoginViewModel, LoginViewState } from '@/viewModels';
import { computed } from 'vue';

const columnSizes = {
    "size": "12",
    "size-md": "8",
    "offset-md": "2",
    "size-lg": "6",
    "offset-lg": "3",
    "size-xl": "4",
    "offset-xl": "4"
};

const { props, commands } = useLoginViewModel();
const { canExecute: canRequestAuthCode, execute: requestAuthCode } = commands.requestAuthCodeCommand;
const { canExecute: canVerifyAuthCode, execute: verifyAuthCode } = commands.verifyAuthCodeCommand;

const isBusy = computed(() => {
    return commands.requestAuthCodeCommand.isExecuting.value
        || commands.verifyAuthCodeCommand.isExecuting.value;
});
</script>
  