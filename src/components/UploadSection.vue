<template>
  <div class="upload-single-btn">
    <button class="btn-upload-pdf" :disabled="props.loading" @click="triggerFileInput">
      <img src="/pdf.png" alt="PDF" class="pdf-icon" />
    </button>
    <input 
      ref="fileInput" 
      type="file" 
      accept="application/pdf" 
      style="display: none" 
      @change="handleFileSelect" 
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
const props = defineProps({ loading: Boolean });
const emit = defineEmits(['file-selected']);
const fileInput = ref(null);

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    emit('file-selected', { file });
  }
}
</script>

<style scoped>
.upload-single-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  /* Remove padding-left and padding-top */
}

.btn-upload-pdf {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  max-width: 40px;
  max-height: 40px;
  padding: 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
  box-shadow: var(--shadow-sm);
}
.btn-upload-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pdf-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  margin: 0;
  display: block;
}
</style> 