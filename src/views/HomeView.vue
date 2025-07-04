<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">Policy Analyzer</h1>
    </header>
    <div class="container">
      <div class="section left-section">
        <div class="actions upload-actions">
          <button :disabled="loading" @click="triggerFile" class="upload-btn">Upload PDF</button>
          <StatusMessage v-if="status" :status="status" :error="isError" />
          <input ref="fileInput" type="file" accept="application/pdf" style="display:none" @change="onFileChange" />
        </div>
        <FileButtons
          v-if="files"
          :enabled="!!files"
          :active-file="activeFile"
          :standard-analyses="files.standardAnalyses"
          :gap-analyses="files.gapAnalyses"
          :summary-file="files.summaryFile"
          @select="setActiveFile"
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
          <!-- Excel Preview -->
          <div v-if="activeFile && (activeFile.type === 'standard' || activeFile.type === 'gap')" class="excel-viewer">
            <strong>{{ getFileTypeTitle(activeFile.type) }}</strong>
            <div class="file-name">{{ activeFile.file.name }}</div>
            <ExcelPreview :excelBlob="activeFile.file.blob" />
          </div>
          
          <!-- PDF Preview -->
          <div v-else-if="activeFile && activeFile.type === 'summary' && activeFile.file.type && activeFile.file.type.toLowerCase() === 'pdf'" class="pdf-viewer">
            <strong>Summary (PDF)</strong>
            <div class="file-name">{{ activeFile.file.name }}</div>
            <PdfViewer :key="activeFile.file.name" :pdfBlob="pdfBlobUnwrapped" />
            <div style="color: green; font-size: 12px;">[PdfViewer rendered]</div>
          </div>
          
          <!-- DOCX Preview -->
          <div v-else-if="activeFile && activeFile.type === 'summary' && activeFile.file.type === 'docx'" class="docx-viewer">
            <strong>Summary (DOCX)</strong>
            <div class="file-name">{{ activeFile.file.name }}</div>
            <DocxViewer :docxBlob="activeFile.file.blob" />
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
import FileButtons from '../components/FileButtons.vue';
import DownloadButtons from '../components/DownloadButtons.vue';
import StatusMessage from '../components/StatusMessage.vue';
import ExcelPreview from '../components/ExcelPreview.vue';
import PdfViewer from '../components/PdfViewer.vue';
import DocxViewer from '../components/DocxViewer.vue';
import { uploadPdf } from '../services/api.js';
import logger from '../services/logger.js';

const files = ref(null); // { standardAnalyses: [], gapAnalyses: [], summaryFile: null }
const loading = ref(false);
const status = ref('');
const activeFile = ref(null);

const fileInput = ref(null);

const isError = computed(() => status.value.toLowerCase().includes('fail'));

// Unwrap the PDF blob from Vue's proxy if needed
const pdfBlobUnwrapped = computed(() => {
  const blob = activeFile.value?.file?.blob;
  if (blob instanceof Blob) return blob;
  if (blob && blob.__v_raw) return blob.__v_raw;
  return blob;
});

function getFileTypeTitle(type) {
  if (type === 'standard') return 'Standard Analysis';
  if (type === 'gap') return 'Gap Analysis';
  return 'Summary';
}

function setActiveFile(fileInfo) {
  activeFile.value = fileInfo;
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
  activeFile.value = null;
  
  try {
    const result = await uploadPdf(file);
    files.value = result;
    
    // Auto-select first available file
    if (result.standardAnalyses.length > 0) {
      activeFile.value = { type: 'standard', file: result.standardAnalyses[0] };
    } else if (result.gapAnalyses.length > 0) {
      activeFile.value = { type: 'gap', file: result.gapAnalyses[0] };
    } else if (result.summaryFile) {
      activeFile.value = { type: 'summary', file: result.summaryFile };
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
  
  const url = URL.createObjectURL(activeFile.value.file.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = activeFile.value.file.name;
  a.click();
  URL.revokeObjectURL(url);
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
  padding: 24px;
  overflow-y: auto;
}

.right-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;
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

.file-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
  font-style: italic;
}

.excel-viewer,
.pdf-viewer,
.docx-viewer {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 16px;
  margin-bottom: 16px;
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

.actions {
  margin-bottom: 20px;
}

.upload-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.upload-btn {
  width: 160px;
  min-width: 120px;
  max-width: 200px;
  padding: 12px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upload-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.status-message {
  margin: 0;
  min-width: 120px;
  text-align: left;
}
</style> 