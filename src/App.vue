<template>
  <!-- <Detector />
  <SteamdbAnalyzer /> -->
  <Detector v-if="site === 'steamgifts'" />
  <SteamdbAnalyzer v-else-if="site === 'steamdb'" />
</template>

<script lang="ts" setup>
import { inject, onMounted, ref } from "vue";

import Detector from "./components/Detector.vue";
import SteamdbAnalyzer from "./components/SteamdbAnalyzer.vue";

const site = ref("");

onMounted(() => {
  const url: string = inject("url")!;
  if (url.includes("www.steamgifts.com")) {
    site.value = "steamgifts";
  } else if (url.includes("steamdb.info")) {
    site.value = "steamdb";
  }
});
</script>
