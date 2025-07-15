<template>
  <div class="app-container">
    <div class="top-bar">
      <div class="top-bar-left">
        <span class="main-heading">Policy Assist</span>
      </div>
      <div class="top-bar-right">
        <img src="/amex-logo.jpg" alt="Amex GBT Logo" class="amex-logo" />
      </div>
    </div>
    <div class="action-bar">
      <div class="action-bar-left">
        <UploadSection
          :loading="loading"
          :status="status"
          :error="isError"
          @file-selected="handleFileSelected"
          @clear-status="clearStatus"
        />
      </div>
      <div class="action-bar-right">
        <DownloadButtons
          :enabled="!!files"
          :standard-analyses="files?.standardAnalyses || []"
          :gap-analyses="files?.gapAnalyses || []"
          :summary-file="files?.summaryFile || null"
          @download="downloadActive"
        />
      </div>
    </div>
    <div class="main-scrollable">
      <!-- Upper Section: Tab Navigation -->
      <div class="upper-section">
        <div class="tab-section">
          <TabNavigation
            v-if="files"
            :enabled="!!files"
            :active-file="activeFile"
            :standard-analyses="files.standardAnalyses"
            :gap-analyses="files.gapAnalyses"
            :summary-file="files.summaryFile"
            @select-file="setActiveFile"
          />
        </div>
      </div>
      <!-- Lower Section: File Preview -->
      <div class="lower-section">
        <div class="preview-content">
          <div v-if="activeFile">
            <!-- Basic Solution Preview -->
            <div v-if="activeFile && (activeFile.type === 'standard' || activeFile.type === 'gap')" class="excel-viewer">
              <!-- <div class="file-name">{{ activeFile.file.name }}</div> -->
              <ExcelPreview :excelBlob="activeFile.file.blob" />
            </div>
            <div v-else-if="activeFile && activeFile.type === 'summary' && activeFile.file.type && activeFile.file.type.toLowerCase() === 'pdf'" class="pdf-viewer">
              <!-- <div class="file-name">{{ activeFile.file.name }}</div> -->
              <PdfViewer :key="activeFile.file.name" :pdfBlob="pdfBlobUnwrapped" />
              <div style="color: green; font-size: 12px;">[PdfViewer rendered]</div>
            </div>
            <div v-else-if="activeFile && activeFile.type === 'summary' && activeFile.file.type === 'docx'" class="docx-viewer">
              <!-- <div class="file-name">{{ activeFile.file.name }}</div> -->
              <DocxViewer :docxBlob="activeFile.file.blob" />
            </div>
            <div v-else class="no-file-viewer">
              <div style="color: #888;">No file selected for preview.</div>
            </div>
          </div>
          <div v-else>
            <div class="no-file-viewer">
              <div style="color: #888;">No file selected for preview.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import ExcelPreview from '../components/ExcelPreview.vue';
import PdfViewer from '../components/PdfViewer.vue';
import DocxViewer from '../components/DocxViewer.vue';
import DownloadButtons from '../components/DownloadButtons.vue';
import UploadSection from '../components/UploadSection.vue';
import TabNavigation from '../components/TabNavigation.vue';
import { uploadPdf } from '../services/api.js';
import logger from '../services/logger.js';

const files = ref(null); // { standardAnalyses: [], gapAnalyses: [], summaryFile: null }
const loading = ref(false);
const status = ref('');
const activeFile = ref(null);

const fileInput = ref(null);

const isError = computed(() => status.value.toLowerCase().includes('fail'));

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

function handleFileSelected(data) {
  if (data.error) {
    status.value = data.error;
    return;
  }
  if (data.file) {
    handleUpload(data.file);
  }
}



async function handleUpload(file) {
  loading.value = true;
  status.value = `Uploading ${file.name}!!`;
  activeFile.value = null;
  try {
    const result = await uploadPdf(file);
    files.value = result;
    if (result.standardAnalyses.length > 0) {
      activeFile.value = { type: 'standard', file: result.standardAnalyses[0] };
    } else if (result.gapAnalyses.length > 0) {
      activeFile.value = { type: 'gap', file: result.gapAnalyses[0] };
    } else if (result.summaryFile) {
      activeFile.value = { type: 'summary', file: result.summaryFile };
    }
    status.value = `Successfully uploaded ${file.name}`;
    logger.info('Files uploaded', files.value);
  } catch (e) {
    status.value = `Upload failed for ${file.name}. Please try again.`;
    logger.error('Upload failed', e);
  } finally {
    loading.value = false;
  }
}

function downloadActive() {
  // This function is now handled by the DownloadButtons component
  // It's kept for backward compatibility but the actual download logic
  // is now in the DownloadButtons component
  console.log('Download requested from parent component');
}

function clearStatus() {
  status.value = '';
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-6) * 0.6) calc(var(--spacing-8) * 0.6) calc(var(--spacing-4) * 0.6) calc(var(--spacing-8) * 0.6);
  background: none;
  box-shadow: none;
  min-height: 49px;
  max-height: 62px;
}
.top-bar-left {
  display: flex;
  align-items: center;
}
.main-heading {
  font-size: calc(var(--font-size-2xl) * 1);
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 1px;
}
.top-bar-right {
  display: flex;
  align-items: center;
}
.amex-logo {
  height: 30px;
  width: auto;
  object-fit: contain;
}
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-6);
  padding: var(--spacing-2) var(--spacing-8) var(--spacing-2) var(--spacing-8);
  background: #fafbfc;
  border-bottom: 1px solid var(--gray-200);
}
.action-bar-left {
  display: flex;
  align-items: center;
}
.action-bar-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.main-scrollable {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.upper-section {
  flex-shrink: 0;
}
.lower-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f5;
}
.preview-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px;
  /* overflow: hidden; */
}

.file-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 0px;
  font-style: italic;
}

.excel-viewer,
.pdf-viewer,
.docx-viewer {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 5px;
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




.upload-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
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