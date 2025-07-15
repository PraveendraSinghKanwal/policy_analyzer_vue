<template>
  <div class="download-compact" v-if="enabled && hasFiles">
    <button 
      :disabled="!enabled || !hasSelectedFiles" 
      @click="handleDownload"
      class="btn btn-success download-btn"
      :class="{ 'btn-disabled': !hasSelectedFiles }"
    >
      <img src="/excel-download.jpg" alt="Download"  />
      <span class="btn-text"></span>
    </button>
    <div class="checkbox-col">
      <label class="selector-item" :class="{ disabled: !hasStandardFiles }">
        <input 
          type="checkbox" 
          v-model="selectedTypes.standard" 
          :disabled="!hasStandardFiles"
          class="selector-input"
        >
        <!-- <span class="selector-label">CE&S <span class="file-count" v-if="standardCount > 0">{{ standardCount }}</span></span> -->
        <span class="selector-label">CE&S </span> 
      </label>
      <label class="selector-item" :class="{ disabled: !hasGapFiles }">
        <input 
          type="checkbox" 
          v-model="selectedTypes.gap" 
          :disabled="!hasGapFiles"
          class="selector-input"
        >
        <!--<span class="selector-label">Gap <span class="file-count" v-if="gapCount > 0">{{ gapCount }}</span></span> -->
        <span class="selector-label">Gap</span>
      </label>
      <label class="selector-item" :class="{ disabled: !hasSummaryFile }">
        <input 
          type="checkbox" 
          v-model="selectedTypes.summary" 
          :disabled="!hasSummaryFile"
          class="selector-input"
        >
        <!-- <span class="selector-label">Summary <span class="file-count" v-if="hasSummaryFile">1</span></span> -->
        <span class="selector-label">Summary</span>
      </label>
    </div>
  </div>
  <div v-if="downloadStatus" class="download-status" :class="downloadStatus.type">
    {{ downloadStatus.message }}
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import JSZip from 'jszip';

const props = defineProps({ 
  enabled: Boolean,
  standardAnalyses: {
    type: Array,
    default: () => []
  },
  gapAnalyses: {
    type: Array,
    default: () => []
  },
  summaryFile: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['download']);

// Reactive state
const selectedTypes = ref({
  standard: true, // Default to selected
  gap: false,
  summary: false
});

const downloadStatus = ref(null);

// Computed properties
const hasFiles = computed(() => {
  return props.standardAnalyses.length > 0 || 
         props.gapAnalyses.length > 0 || 
         props.summaryFile !== null;
});

const hasStandardFiles = computed(() => props.standardAnalyses.length > 0);
const hasGapFiles = computed(() => props.gapAnalyses.length > 0);
const hasSummaryFile = computed(() => props.summaryFile !== null);

const standardCount = computed(() => props.standardAnalyses.length);
const gapCount = computed(() => props.gapAnalyses.length);

const hasSelectedFiles = computed(() => {
  return (selectedTypes.value.standard && hasStandardFiles.value) ||
         (selectedTypes.value.gap && hasGapFiles.value) ||
         (selectedTypes.value.summary && hasSummaryFile.value);
});

// Watch for file changes and auto-select available types
watch(() => [props.standardAnalyses, props.gapAnalyses, props.summaryFile], () => {
  // Auto-select standard analyses if available
  if (hasStandardFiles.value && !selectedTypes.value.standard) {
    selectedTypes.value.standard = true;
  }
  
  // Auto-select other types if they become available and user had them selected before
  if (hasGapFiles.value && selectedTypes.value.gap) {
    selectedTypes.value.gap = true;
  }
  
  if (hasSummaryFile.value && selectedTypes.value.summary) {
    selectedTypes.value.summary = true;
  }
}, { immediate: true });

// Handle download
async function handleDownload() {
  if (!hasSelectedFiles.value) return;
  
  try {
    downloadStatus.value = { type: 'info', message: 'Preparing download...' };
    
    const zip = new JSZip();
    let fileCount = 0;
    
    // Add standard analyses
    if (selectedTypes.value.standard && hasStandardFiles.value) {
      for (const file of props.standardAnalyses) {
        zip.file(file.name, file.blob);
        fileCount++;
      }
    }
    
    // Add gap analyses
    if (selectedTypes.value.gap && hasGapFiles.value) {
      for (const file of props.gapAnalyses) {
        zip.file(file.name, file.blob);
        fileCount++;
      }
    }
    
    // Add summary file
    if (selectedTypes.value.summary && hasSummaryFile.value) {
      zip.file(props.summaryFile.name, props.summaryFile.blob);
      fileCount++;
    }
    
    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policy_analysis_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    downloadStatus.value = { 
      type: 'success', 
      message: `Successfully downloaded ${fileCount} file${fileCount !== 1 ? 's' : ''}!` 
    };
    
    // Clear status after 3 seconds
    setTimeout(() => {
      downloadStatus.value = null;
    }, 3000);
    
    // Emit download event for parent component
    emit('download');
    
  } catch (error) {
    console.error('Download error:', error);
    downloadStatus.value = { 
      type: 'error', 
      message: 'Error downloading files. Please try again.' 
    };
    
    // Clear error after 5 seconds
    setTimeout(() => {
      downloadStatus.value = null;
    }, 5000);
  }
}
</script>

<style scoped>
.download-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  align-items: flex-end;
}

.download-compact {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  height: auto;
  justify-content: flex-end;
  min-width: 0;
  width: auto;
  margin-left: 0;
}

.download-btn-col {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.checkbox-col {
  display: flex;
  flex-direction: column;
  gap: 0px;
  align-items: flex-start;
  justify-content: flex-start;
}

.selector-item {
  display: flex;
  align-items: center;
  gap: 0px;
  cursor: pointer;
  padding: 0px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 0.6rem;
  font-weight: 500;
  color: #495057;
  background: white;
  border: 1px solid #dee2e6;
  min-width: 60px;
  justify-content: flex-end;
  position: relative;
}

.selector-item:hover:not(.disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.selector-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8f9fa;
}

.selector-input {
  display: none;
}

.selector-input:checked + .selector-label {
  color: #28a745;
  font-weight: 600;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  white-space: nowrap;
  font-size: 0.4rem;
}

.selector-item:has(.selector-input:checked) {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.file-count {
  background: #6c757d;
  color: white;
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.selector-item:has(.selector-input:checked) .file-count {
  background: #28a745;
}

.download-btn {
  display: flex;
  align-items: flex-start;
  gap: 0px;
  padding: 0px 0px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s;
  height: 32px;
  white-space: nowrap;
  flex-shrink: 0;
}

.download-btn:not(:disabled):hover {
  /* Remove green background and box-shadow */
  background: none !important;
  box-shadow: none !important;
  transform: translateY(-1px);
}

.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-text {
  white-space: nowrap;
}

.download-status {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.download-status.info {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.download-status.success {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.download-status.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.download-btn img[alt="Download"] {
  width: 48px;
  height: 48px;
  object-fit: contain;
  display: block;
}

@media (max-width: 768px) {
  .download-section {
    min-width: auto;
    width: 100%;
  }
  
  .download-compact {
    flex-direction: column;
    height: auto;
    gap: 8px;
    padding: 12px;
  }
  
  .file-selectors {
    width: 100%;
    justify-content: center;
    gap: 6px;
  }
  
  .selector-item {
    min-width: 50px;
    font-size: 11px;
  }
  
  .download-btn {
    width: 100%;
    justify-content: center;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .file-selectors {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .selector-item {
    min-width: 45px;
    font-size: 10px;
    padding: 3px 6px;
  }
}
</style> 