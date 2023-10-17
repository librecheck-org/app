<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-title>LibreCheck</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <ion-list :inset="true">
                <ion-list-header>
                    <ion-label>Login</ion-label>
                </ion-list-header>
                <ion-item>
                    <ion-input label="Email address" label-placement="stacked" type="email" placeholder="email@domain.com"
                        v-model="emailAddress" />
                </ion-item>
                <ion-item>
                    <ion-input label="Auth code" label-placement="stacked" type="text" placeholder="ABCD1234" />
                </ion-item>

                <ion-item>
                    <ion-input label="Input with placeholder" placeholder="Enter company name"></ion-input>
                </ion-item>

                <ion-item>
                    <ion-input label="Input with value" value="121 S Pinckney St #300"></ion-input>
                </ion-item>

                <ion-item>
                    <ion-input label="Readonly input" value="Madison" :readonly="true"></ion-input>
                </ion-item>

                <ion-item>
                    <ion-input label="Disabled input" value="53703" :disabled="true"></ion-input>
                </ion-item>

            </ion-list>

            <ion-button @click="login()">Default</ion-button>
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonItem, IonList, IonButton, IonListHeader, IonLabel } from '@ionic/vue';
import { AppInfoApiClient, Configuration } from '@/apiClients';

const httpConfig = new Configuration({ basePath: "http://localhost:8100" });
const appInfoApiClient = new AppInfoApiClient(httpConfig);

let emailAddress: string

await appInfoApiClient.getAppVersion();

function login() {
    console.log(emailAddress);
}

</script>
  