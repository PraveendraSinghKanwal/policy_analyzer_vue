<template>
  <div v-if="status" :class="['status-message', { error }]">{{ status }}</div>
</template>
<script setup>
defineProps({ status: String, error: Boolean });
</script>
<style scoped>
.status-message {
  margin-top: 12px;
  color: #1976d2;
}
.status-message.error {
  color: #d32f2f;
}
</style> 