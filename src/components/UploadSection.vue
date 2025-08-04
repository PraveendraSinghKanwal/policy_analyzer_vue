<template>
  <div class="upload-single-btn">
    <button class="btn-upload-pdf" :disabled="props.loading" @click="triggerFileInput">
      <!-- <img src="/pdf_upload.webp" alt="Upload" class="pdf-icon" /> -->
      <img src="/pdf_upload.jpg" alt="Upload" class="pdf-icon" />
    </button>
    <input 
      ref="fileInput" 
      type="file" 
      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      style="display: none" 
      @change="handleFileSelect" 
    />
    <!-- Upload Status Message -->
    <div v-if="uploadStatus" class="upload-status">
      <div class="status-content" :class="statusClass">
        <span v-if="props.loading" class="spinner"></span>
        <span class="status-text">{{ uploadStatus }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
const props = defineProps({ 
  loading: Boolean,
  status: String,
  error: Boolean
});
const emit = defineEmits(['file-selected', 'clear-status']);
const fileInput = ref(null);

const uploadStatus = computed(() => {
  if (props.loading && props.status) {
    return props.status;
  }
  if (!props.loading && props.status && !props.error) {
    return props.status;
  }
  if (!props.loading && props.status && props.error) {
    return props.status;
  }
  return '';
});

const statusClass = computed(() => {
  if (props.loading) return 'status-loading';
  if (props.error) return 'status-error';
  return 'status-success';
});

// Auto-hide success messages after 3 seconds
watch(() => props.status, (newStatus, oldStatus) => {
  if (newStatus && !props.loading && !props.error && newStatus !== oldStatus) {
    setTimeout(() => {
      // Clear the status by emitting an event to parent
      emit('clear-status');
    }, 3000);
  }
});

function validateFileType(file) {
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const validExtensions = ['.pdf', '.docx'];
  
  const isValidType = validTypes.includes(file.type);
  const isValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  return isValidType || isValidExtension;
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file && validateFileType(file)) {
    emit('file-selected', { file });
  } else if (file) {
    // Reset input if invalid file type
    event.target.value = '';
  }
}
</script>

<style scoped>
.upload-single-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.btn-upload-pdf {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
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

.upload-status {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid;
  transition: all 0.3s ease;
}

.status-loading {
  background: #f8f9fa;
  border-left-color: var(--primary-color);
}

.status-success {
  background: #f0f9ff;
  border-left-color: #10b981;
}

.status-error {
  background: #fef2f2;
  border-left-color: #ef4444;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
}

.status-loading .status-text {
  color: #333;
}

.status-success .status-text {
  color: #065f46;
}

.status-error .status-text {
  color: #991b1b;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e3e3e3;
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 