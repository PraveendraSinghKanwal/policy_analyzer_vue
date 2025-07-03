<template>
  <div class="section" style="max-width: 400px;">
    <h2>Upload PDF</h2>
    <div class="actions">
      <button :disabled="loading" @click="triggerFile">Upload PDF</button>
      <input ref="fileInput" type="file" accept="application/pdf" style="display:none" @change="onFileChange" />
    </div>
    <StatusMessage :status="status" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import StatusMessage from './StatusMessage.vue';

const emit = defineEmits(['upload']);
const props = defineProps({ loading: Boolean, status: String });

const fileInput = ref(null);

function triggerFile() {
  fileInput.value.click();
}
function onFileChange(e) {
  const file = e.target.files[0];
  if (file) emit('upload', file);
}
</script> 