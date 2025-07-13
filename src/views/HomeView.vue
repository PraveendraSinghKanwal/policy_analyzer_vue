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
        />
      </div>
      <div class="action-bar-right">
        <DownloadButtons
          :enabled="!!activeFile"
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
          <div class="preview-toggle-bar">
            <button class="btn btn-secondary" @click="showSpreadsheetViewer = !showSpreadsheetViewer">
              {{ showSpreadsheetViewer ? 'Show Basic View' : 'Open in Spreadsheet Viewer' }}
            </button>
          </div>
          <div v-if="!showSpreadsheetViewer">
            <!-- Basic Solution Preview -->
            <div v-if="activeFile && (activeFile.type === 'standard' || activeFile.type === 'gap')" class="excel-viewer">
              <div class="file-name">{{ activeFile.file.name }}</div>
              <ExcelPreview :excelBlob="activeFile.file.blob" />
            </div>
            <div v-else-if="activeFile && activeFile.type === 'summary' && activeFile.file.type && activeFile.file.type.toLowerCase() === 'pdf'" class="pdf-viewer">
              <div class="file-name">{{ activeFile.file.name }}</div>
              <PdfViewer :key="activeFile.file.name" :pdfBlob="pdfBlobUnwrapped" />
              <div style="color: green; font-size: 12px;">[PdfViewer rendered]</div>
            </div>
            <div v-else-if="activeFile && activeFile.type === 'summary' && activeFile.file.type === 'docx'" class="docx-viewer">
              <div class="file-name">{{ activeFile.file.name }}</div>
              <DocxViewer :docxBlob="activeFile.file.blob" />
            </div>
            <div v-else class="no-file-viewer">
              <div style="color: #888;">No file selected for preview.</div>
            </div>
          </div>
          <div v-else>
            <div class="luckysheet-iframe-wrapper">
              <div v-if="iframeLoading && !iframeError" class="iframe-loading">
                <p>Loading spreadsheet viewer...</p>
              </div>
              <iframe
                ref="lsFrame"
                src="/luckysheet.html"
                sandbox="allow-scripts allow-same-origin"
                style="width:100%;height:400px;border:none;"
                @load="onIframeLoad"
                @error="onIframeError"
              ></iframe>
              <div v-if="iframeError" class="iframe-error">
                <p>Failed to load spreadsheet viewer. Please try again.</p>
                <button class="btn btn-secondary" @click="retryIframeLoad">Retry</button>
              </div>
            </div>
            <button class="btn btn-secondary" @click="showSpreadsheetViewer = false">Show Basic View</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue';
import ExcelPreview from '../components/ExcelPreview.vue';
import PdfViewer from '../components/PdfViewer.vue';
import DocxViewer from '../components/DocxViewer.vue';
import DownloadButtons from '../components/DownloadButtons.vue';
import UploadSection from '../components/UploadSection.vue';
import TabNavigation from '../components/TabNavigation.vue';
import { xlsxToLuckysheet } from '../utils/xlsxToLuckysheet';
import * as XLSX from 'xlsx';
import { uploadPdf } from '../services/api.js';
import logger from '../services/logger.js';

const files = ref(null); // { standardAnalyses: [], gapAnalyses: [], summaryFile: null }
const loading = ref(false);
const status = ref('');
const activeFile = ref(null);
const showSpreadsheetViewer = ref(false);
const luckysheetData = ref(null);
const lsFrame = ref(null);
const iframeError = ref(false);
const iframeLoading = ref(false);

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

async function handleShowSpreadsheetViewer() {
  try {
    if (!activeFile.value || !activeFile.value.file || !activeFile.value.file.blob) {
      console.error('No active file or blob available');
      return;
    }
    
    console.log('Processing file:', activeFile.value.file.name);
    const arrayBuffer = await activeFile.value.file.blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    console.log('Workbook sheets:', workbook.SheetNames);
    
    luckysheetData.value = xlsxToLuckysheet(workbook);
    console.log('Converted luckysheet data:', luckysheetData.value);
    
    await nextTick();
    
    // Data will be sent when iframe sends 'luckysheet-ready' message
    // This ensures the iframe is fully loaded before we try to send data
  } catch (error) {
    console.error('Error in handleShowSpreadsheetViewer:', error);
    iframeError.value = true;
    iframeLoading.value = false;
  }
}

watch(showSpreadsheetViewer, (val) => {
  if (val) {
    iframeError.value = false;
    iframeLoading.value = true;
    handleShowSpreadsheetViewer();
    
    // Set a timeout to handle iframe loading issues
    setTimeout(() => {
      if (iframeLoading.value) {
        iframeError.value = true;
        iframeLoading.value = false;
      }
    }, 10000); // 10 second timeout
  }
});

// Watch for active file changes to update spreadsheet
watch(activeFile, (newFile) => {
  if (newFile && showSpreadsheetViewer.value) {
    // Update spreadsheet when file changes
    handleShowSpreadsheetViewer();
  }
});

function onIframeLoad() {
  iframeError.value = false;
  iframeLoading.value = false;
}

function onIframeError() {
  iframeError.value = true;
  iframeLoading.value = false;
}

function retryIframeLoad() {
  iframeError.value = false;
  iframeLoading.value = true;
  if (lsFrame.value) {
    lsFrame.value.src = lsFrame.value.src;
  }
}

// Handle messages from iframe
function handleIframeMessage(event) {
  console.log('Parent received message:', event.data);
  if (event.data && event.data.type === 'luckysheet-ready') {
    console.log('Iframe is ready, sending data:', luckysheetData.value);
    // Iframe is ready, we can send data
    if (luckysheetData.value && lsFrame.value && lsFrame.value.contentWindow) {
      const serializedData = JSON.parse(JSON.stringify(luckysheetData.value));
      console.log('Sending serialized data:', serializedData);
      lsFrame.value.contentWindow.postMessage({ luckysheetData: serializedData }, '*');
    } else {
      console.error('Missing data or iframe not ready:', {
        hasData: !!luckysheetData.value,
        hasFrame: !!lsFrame.value,
        hasContentWindow: !!(lsFrame.value && lsFrame.value.contentWindow)
      });
    }
  } else if (event.data && event.data.type === 'save-spreadsheet-data') {
    console.log('Received save request with data:', event.data.data);
    handleSaveSpreadsheetData(event.data.data);
  }
}

onMounted(() => {
  window.addEventListener('message', handleIframeMessage);
});

onUnmounted(() => {
  window.removeEventListener('message', handleIframeMessage);
});

// Function to handle saving spreadsheet data
async function handleSaveSpreadsheetData(data) {
  try {
    // Convert data back to Excel format
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.value?.file?.name || 'updated_spreadsheet.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Send success message back to iframe
    if (lsFrame.value && lsFrame.value.contentWindow) {
      lsFrame.value.contentWindow.postMessage({ 
        type: 'save-success',
        message: 'File saved successfully!' 
      }, '*');
    }
    
    console.log('Spreadsheet saved successfully');
  } catch (error) {
    console.error('Error saving spreadsheet:', error);
    // Send error message back to iframe
    if (lsFrame.value && lsFrame.value.contentWindow) {
      lsFrame.value.contentWindow.postMessage({ 
        type: 'save-error',
        message: 'Error saving file: ' + error.message 
      }, '*');
    }
  }
}

async function handleUpload(file) {
  loading.value = true;
  status.value = 'Uploading...';
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
  font-size: calc(var(--font-size-2xl) * 1.04);
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 1px;
}
.top-bar-right {
  display: flex;
  align-items: center;
}
.amex-logo {
  height: 36px;
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
  padding: 24px;
  overflow: hidden;
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

.preview-toggle-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.spreadsheet-viewer-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  background: #f8fafc;
  border: 1px dashed #bcd;
  border-radius: 8px;
  padding: 32px 0;
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
.luckysheet-iframe-wrapper {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: var(--shadow-md, 0 2px 8px rgba(0,0,0,0.04));
  margin-bottom: 12px;
  position: relative;
}

.iframe-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.iframe-error p {
  margin: 0 0 16px 0;
  color: #666;
}

.iframe-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.iframe-loading p {
  margin: 0;
  color: #666;
}
</style> 