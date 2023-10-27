<template>
    <ion-page>
        <ion-content class="ion-padding">
            <ion-label>SUBS</ion-label>
            <ion-button @click="updateEmailAddress"></ion-button>
        </ion-content>
    </ion-page>
</template>
  
<script setup lang="ts">
import { useCurrentUserStore } from '@/stores';
import { IonPage, IonLabel, IonContent, IonButton } from '@ionic/vue';

const currentUser = useCurrentUserStore();

async function updateEmailAddress() {
    await currentUser.update({emailAddress: new Date().getSeconds().toString()});
}

</script>
  