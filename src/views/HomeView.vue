<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">Policy Analyzer</h1>
    </header>
    <div class="container">
      <div class="section left-section">
        <h2>Upload PDF</h2>
        <div class="actions">
          <button :disabled="loading" @click="triggerFile">Upload PDF</button>
          <input ref="fileInput" type="file" accept="application/pdf" style="display:none" @change="onFileChange" />
        </div>
        <StatusMessage v-if="status" :status="status" :error="isError" />
        <ActionButtons
          :enabled="!!files"
          :active="activeView"
          @select="setActiveView"
        />
      </div>
      <div class="section right-section">
        <div class="section-header">
          <h2>View & Download</h2>
          <DownloadButtons
            :enabled="!!activeFile"
            @download="downloadActive"
          />
        </div>
        <div class="preview-scroll-container">
          <div v-if="activeView === 'summary' && summaryText !== null" class="summary-viewer">
            <strong>Summary</strong>
            <div class="summary-content">{{ summaryText }}</div>
          </div>
          <div v-else-if="activeView === 'standard' && files?.standard" class="excel-viewer">
            <strong>Standard Analysis</strong>
            <ExcelPreview :excelBlob="files.standard" />
          </div>
          <div v-else-if="activeView === 'gap' && files?.gap" class="excel-viewer">
            <strong>Gap Analysis</strong>
            <ExcelPreview :excelBlob="files.gap" />
          </div>
          <div v-else class="no-file-viewer">
            <div style="color: #888;">No file selected for preview.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ActionButtons from '../components/ActionButtons.vue';
import DownloadButtons from '../components/DownloadButtons.vue';
import StatusMessage from '../components/StatusMessage.vue';
import ExcelPreview from '../components/ExcelPreview.vue';
import { uploadPdf } from '../services/api.js';
import logger from '../services/logger.js';

const files = ref(null); // { standard: Blob, gap: Blob, summary: Blob }
const summaryText = ref(null);
const loading = ref(false);
const status = ref('');
const activeView = ref('standard');

const fileInput = ref(null);

const isError = computed(() => status.value.toLowerCase().includes('fail'));

const activeFile = computed(() => {
  if (!files.value) return null;
  if (activeView.value === 'standard') return files.value.standard;
  if (activeView.value === 'gap') return files.value.gap;
  if (activeView.value === 'summary') return files.value.summary;
  return null;
});

watch([activeView, files], async ([view, f]) => {
  if (view === 'summary' && f && f.summary) {
    summaryText.value = await blobToText(f.summary);
  }
});

function setActiveView(view) {
  activeView.value = view;
}

function triggerFile() {
  fileInput.value.click();
}
function onFileChange(e) {
  const file = e.target.files[0];
  if (file) handleUpload(file);
}

async function handleUpload(file) {
  loading.value = true;
  status.value = 'Uploading...';
  try {
    const result = await uploadPdf(file);
    files.value = result;
    summaryText.value = null;
    if (result.summary) {
      summaryText.value = await blobToText(result.summary);
    }
    status.value = 'Upload successful!';
    logger.info('Files uploaded', files.value);
  } catch (e) {
    status.value = 'Upload failed. Please try again.';
    logger.error('Upload failed', e);
  } finally {
    loading.value = false;
  }
}

function downloadActive() {
  if (!activeFile.value) return;
  const url = URL.createObjectURL(activeFile.value);
  let ext = 'xlsx';
  if (activeView.value === 'summary') ext = 'txt';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeView.value}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

function blobToText(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #1976d2;
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.app-title {
  margin: 0;
  text-align: center;
  font-size: 2rem;
  font-weight: 600;
}

.container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-section {
  max-width: 400px;
  min-width: 320px;
  width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
}

.right-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
}

.preview-scroll-container {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-x: auto;
  overflow-y: auto;
  padding-right: 4px;
}

.summary-content {
  margin-top: 12px;
  color: #222;
  white-space: pre-line;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
}

.no-file-viewer {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 16px;
  margin-bottom: 16px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 