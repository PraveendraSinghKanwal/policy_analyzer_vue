<template>
  <div class="download-buttons">
    <button :disabled="!enabled" @click="$emit('download')">Download</button>
  </div>
</template>
<script setup>
defineProps({ enabled: Boolean });
</script> 