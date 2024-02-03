<template>
  <ion-card :id="componentId" class="ion-activatable">
    <ion-ripple-effect />
    <slot />
    <ion-action-sheet header="Actions" :trigger="componentId" :buttons="props.actions"
      @didDismiss="onActionSheetDidDismiss($event)" />
  </ion-card>
</template>

<script setup lang="ts">
import { ActionSheetButton, IonActionSheet, IonCard, IonRippleEffect } from "@ionic/vue";
import { getComponentId, onActionSheetDidDismiss } from "@/infrastructure";

const props = defineProps({
  actions: Array<ActionSheetButton>,
});

const componentId = getComponentId("lc-clickable-card");

</script>

<style scoped>
ion-card {
  --background-hover-opacity: .04;
  --transition: opacity 15ms linear, background-color 15ms linear;
  --ion-item-background: transparent;

  cursor: pointer;
  height: 15em;
  position: relative;
  overflow: hidden;
}

ion-card::after {
  /* Style copied from ion-item */
  inset: 0px;
  position: absolute;
  content: "";
  transition: var(--transition);
  z-index: -1;
  opacity: 0;
}

ion-card:hover::after {
  /* Style copied from ion-item */
  background: currentColor;
  opacity: var(--background-hover-opacity);
}
</style>
