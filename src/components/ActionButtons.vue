<template>
  <div class="actions">
    <button :disabled="!enabled" :class="{active: active==='standard'}" @click="$emit('select', 'standard')">Standard Analysis</button>
    <button :disabled="!enabled" :class="{active: active==='gap'}" @click="$emit('select', 'gap')">Gap Analysis</button>
    <button :disabled="!enabled" :class="{active: active==='summary'}" @click="$emit('select', 'summary')">Summary</button>
  </div>
</template>
<script setup>
defineProps({ enabled: Boolean, active: String });
</script> 