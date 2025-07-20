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
      <!-- UploadSection removed -->
      <div class="action-bar-right-group">
        <DownloadButtons
          :enabled="!!files"
          :gap-analyses="files?.gapAnalyses || []"
          :summary-files="files?.summaryFiles || []"
          @download="downloadActive"
        />
      </div>
    </div>
    <div class="main-scrollable" v-if="files">
      <!-- Upper Section: Tab Navigation -->
      <div class="upper-section">
        <div class="tab-section">
          <TabNavigation
            :enabled="!!files"
            :active-file="activeFile"
            :gap-analyses="files.gapAnalyses"
            :summary-files="files.summaryFiles"
            :total-score="files.totalScore"
            @select-file="setActiveFile"
          />
        </div>
      </div>
      <!-- Lower Section: File Preview -->
      <div class="lower-section">
        <div class="preview-content">
          <div v-if="activeFile">
            <!-- Basic Solution Preview -->
            <div v-if="activeFile.type === 'gap'" class="excel-viewer">
              <ExcelPreview :excelBlob="activeFile.file.blob" />
            </div>
            <div v-else-if="activeFile.type === 'summary' && activeFile.file.name && activeFile.file.name.toLowerCase().endsWith('.pdf')" class="pdf-viewer">
              <PdfViewer :pdfBlob="activeFile.file.blob" />
              <div style="color: green; font-size: 12px;">[PdfViewer rendered]</div>
            </div>
            <div v-else-if="activeFile.type === 'summary' && activeFile.file.name && activeFile.file.name.toLowerCase().endsWith('.docx')" class="docx-viewer">
              <DocxViewer :docxBlob="activeFile.file.blob" />
            </div>
            <div v-else class="no-file-viewer">
              <div style="color: #888;">No file selected for preview.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
const props = defineProps({
  initialUploadedFile: File
});
import ExcelPreview from '../components/ExcelPreview.vue';
import PdfViewer from '../components/PdfViewer.vue';
import DocxViewer from '../components/DocxViewer.vue';
import DownloadButtons from '../components/DownloadButtons.vue';
import TabNavigation from '../components/TabNavigation.vue';
import logger from '../services/logger.js';

const files = ref(null); // { standardAnalyses: [], gapAnalyses: [], summaryFile: null }
const status = ref('');
const activeFile = ref(null);
const isError = computed(() => status.value.toLowerCase().includes('fail'));

// Only set files if initialUploadedFile is present and backend data is passed
onBeforeMount(() => {
  if (window.history.state && window.history.state.back !== undefined && window.history.state.backendResult) {
    files.value = window.history.state.backendResult;
    // Set default active file
    if (Array.isArray(files.value.gapAnalyses) && files.value.gapAnalyses.length > 0) {
      activeFile.value = { type: 'gap', file: files.value.gapAnalyses[0] };
    } else if (Array.isArray(files.value.summaryFiles) && files.value.summaryFiles.length > 0) {
      activeFile.value = { type: 'summary', file: files.value.summaryFiles[0] };
    }
  }
});

const router = useRouter();

// If user navigates directly to /main, push a history entry for landing page so back button works
onMounted(() => {
  if (window.history.state && window.history.state.back === undefined) {
    router.replace({ path: '/', replace: true });
    router.push({ name: 'Main', state: { uploadedFile: props.initialUploadedFile } });
  }
});

function setActiveFile(fileInfo) {
  activeFile.value = fileInfo;
}

function downloadActive() {
  // This function is now handled by the DownloadButtons component
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #E8F0F9;
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
  overflow: visible; /* Allow logo to overflow */
}
.top-bar-left {
  display: flex;
  align-items: center;
}
.main-heading {
  font-size: calc(var(--font-size-2xl) * 1);
  font-weight: 700;
  color: rgb(14, 13, 78);
  letter-spacing: 1px;
}
.top-bar-right {
  display: flex;
  align-items: center;
}
.amex-logo {
  height: 80px;
  width: auto;
  object-fit: contain;
  margin: 10px 20px -48px 1px; /* Overlap into action-bar */
  border-radius: 10px;
  z-index: 2;
  position: relative;
}
.action-bar {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: var(--spacing-2) var(--spacing-8) var(--spacing-2) var(--spacing-8);
  background: transparent;
  border-bottom: 1px solid var(--gray-200);
  min-height: 60px;
  box-sizing: border-box;
}
.action-bar-right-group {
  display: flex;
  align-items: flex-end;
}
/* Remove .action-bar-left and .action-bar-right if not used */
.action-bar-left, .action-bar-right {
  display: none;
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
  background: #E8F0F9;
}
.tab-section {
  background: #E8F0F9;
}
.lower-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #E8F0F9;
}
.preview-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px;
  /* overflow: hidden; */
  background: #ffffff;
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