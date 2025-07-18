<template>
  <div class="download-row-group">
    <div class="download-btn-row">
      <button
        class="btn btn-success download-btn"
        :disabled="!enabled || !hasExcelFiles"
        @click="downloadExcelFiles"
      >
        Download Excel Files
      </button>
      <button
        class="btn btn-success download-btn"
        :disabled="!enabled || !hasSummaryFile"
        @click="downloadSummaryFile"
      >
        Download Summary File
      </button>
    </div>
    <div class="download-status-row">
      <div v-if="downloadStatus" class="download-status" :class="downloadStatus.type">
        {{ downloadStatus.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import JSZip from 'jszip';

const props = defineProps({ 
  enabled: Boolean,
  gapAnalyses: {
    type: Array,
    default: () => []
  },
  summaryFiles: {
    type: Array,
    default: () => []
  }
});

console.log('enabled:', props.enabled);
console.log('summaryFiles:', props.summaryFiles);
const hasExcelFiles = computed(() => props.gapAnalyses.length > 0);
const hasSummaryFile = computed(() => props.summaryFiles.length > 0);
console.log('hasSummaryFile:', hasSummaryFile.value);

const emit = defineEmits(['download']);

const downloadStatus = ref(null);

async function downloadExcelFiles() {
  if (!hasExcelFiles.value) return;
  try {
    downloadStatus.value = { type: 'info', message: 'Preparing download...' };
    const zip = new JSZip();
    for (const file of props.gapAnalyses) {
      zip.file(file.name, file.blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `excel_files_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    downloadStatus.value = { type: 'success', message: 'Excel files downloaded!' };
    setTimeout(() => { downloadStatus.value = null; }, 3000);
    emit('download');
  } catch (error) {
    console.error('Download error:', error);
    downloadStatus.value = { type: 'error', message: 'Error downloading Excel files.' };
    setTimeout(() => { downloadStatus.value = null; }, 5000);
  }
}

function downloadSummaryFile() {
  console.log('Download Summary File button clicked');
  console.log('hasSummaryFile:', hasSummaryFile.value);
  if (!hasSummaryFile.value) {
    console.log('No summary file available');
    return;
  }
  try {
    const file = props.summaryFiles[0];
    console.log('Attempting to download:', file);
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    downloadStatus.value = { type: 'success', message: 'Summary file downloaded!' };
    setTimeout(() => { downloadStatus.value = null; }, 3000);
    emit('download');
  } catch (error) {
    console.error('Download error:', error);
    downloadStatus.value = { type: 'error', message: 'Error downloading summary file.' };
    setTimeout(() => { downloadStatus.value = null; }, 5000);
  }
}
</script>

<style scoped>
.download-btn-row {
  display: flex;
  flex-direction: row;
  gap: 16px;
  margin-bottom: 12px;
}
.download-row-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.download-status-row {
  width: 100%;
  min-height: 0px;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}
.download-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s;
  height: 36px;
  white-space: nowrap;
  flex-shrink: 0;
}
.download-btn:not(:disabled):hover {
  background: #e0e0e0;
  box-shadow: none;
  transform: translateY(-1px);
}
.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.download-status {
  padding: 2px 2px;
  border-radius: 2px;
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
</style> 