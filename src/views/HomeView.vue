<template>
  <div class="app-container">
    <div class="top-bar">
      <div class="top-bar-left">
        <span class="main-heading">{{ mainHeadingText }}</span>
      </div>
      <div class="top-bar-right">
        <img src="/amex-logo.jpg" alt="Amex GBT Logo" class="amex-logo" />
      </div>
    </div>
    <div class="action-bar">
      <div class="action-bar-right-group">
        <DownloadButtons
          :enabled="!!files"
          :gap-analyses="files?.gapAnalyses || []"
          :summary-files="files?.summaryFiles || []"
          @download="downloadActive"
        />
      </div>
    </div>
    
    <div class="main-content" v-if="files">
      <!-- Main Horizontal Tabs -->
      <div class="main-tabs-container">
        <div class="main-tabs">
          <button
            :class="{ 
              'main-tab': true,
              'active': activeCategory === 'gap' 
            }"
            @click="selectMainTab('gap')"
          >
            Content Extraction and Scoring and Gap Analysis
            <span v-if="files.totalScore !== undefined" class="score-badge">({{ files.totalScore }}%)</span>
          </button>
          <button
            :class="{ 
              'main-tab': true,
              'active': activeCategory === 'summary' 
            }"
            @click="selectMainTab('summary')"
          >
            Gap Summary
          </button>
        </div>
      </div>

      <!-- Content Area with Vertical Sub-tabs and Preview -->
      <div class="content-area">
        <!-- Vertical Sub-tabs (only for gap analysis) -->
        <div v-if="activeCategory === 'gap' && files.gapAnalyses.length > 0" 
             class="vertical-sub-tabs" 
             :style="{ 
               '--sub-tab-width': subTabWidth + 'px',
               width: 'var(--sub-tab-width)'
             }">
          <div class="resize-handle" @mousedown="startResize"></div>
          <div class="sub-tabs-container">
            <button
              v-for="(file, index) in files.gapAnalyses"
              :key="file.name"
              :class="{ 
                'vertical-sub-tab': true,
                'active': isFileActive(file, 'gap')
              }"
              @click="selectFile(file, 'gap')"
            >
              {{ getDisplayName(file.name) }}
              <span v-if="file.score !== undefined" class="score-badge">({{ file.score }}%)</span>
            </button>
          </div>
        </div>

        <!-- Content Preview Area -->
        <div class="preview-area">
          <div v-if="activeFile" class="preview-content">
            <!-- Excel Preview -->
            <div v-if="activeFile.type === 'gap'" class="excel-viewer">
              <ExcelPreview 
                :jsonData="activeFileJsonData" 
                :currentFileName="activeFile.file.name" 
              />
            </div>
            <!-- PDF Preview -->
            <div v-else-if="activeFile.type === 'summary' && activeFile.file.name && activeFile.file.name.toLowerCase().endsWith('.pdf')" class="pdf-viewer">
              <PdfViewer :pdfBlob="activeFile.file.blob" />
            </div>
            <!-- DOCX Preview -->
            <div v-else-if="activeFile.type === 'summary' && activeFile.file.name && activeFile.file.name.toLowerCase().endsWith('.docx')" class="docx-viewer">
              <DocxViewer :docxBlob="activeFile.file.blob" />
            </div>
            <div v-else class="no-file-viewer">
              <div style="color: #888;">No file selected for preview.</div>
            </div>
          </div>
          <!-- Show summary files directly when summary tab is active -->
          <div v-else-if="activeCategory === 'summary' && files.summaryFiles.length > 0" class="summary-content">
            <div v-for="(file, index) in files.summaryFiles" :key="file.name" class="summary-file">
              <div v-if="file.name.toLowerCase().endsWith('.pdf')" class="pdf-viewer">
                <PdfViewer :pdfBlob="file.blob" />
              </div>
              <div v-else-if="file.name.toLowerCase().endsWith('.docx')" class="docx-viewer">
                <DocxViewer :docxBlob="file.blob" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';
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
const activeCategory = ref('gap'); // Track active main tab
const excelJsonData = ref({}); // Store JSON data for each Excel file
const subTabWidth = ref(null); // Will be set from CSS variable
const isError = computed(() => status.value.toLowerCase().includes('fail'));

// Computed property to get JSON data for the active file
const activeFileJsonData = computed(() => {
  if (!activeFile.value || activeFile.value.type !== 'gap') return null;
  
  const fileName = activeFile.value.file.name;
  const jsonKeys = Object.keys(excelJsonData.value);
  
  // First try exact match (without extension)
  const fileNameWithoutExt = fileName.replace(/\.(xlsx|xls)$/i, '');
  if (excelJsonData.value[fileNameWithoutExt]) {
    return excelJsonData.value[fileNameWithoutExt];
  }
  
  // Try to find a matching JSON file by name similarity
  // Prioritize keys that are more similar to the filename
  const matchingKey = jsonKeys.find(key => {
    const keyLower = key.toLowerCase();
    const fileNameLower = fileNameWithoutExt.toLowerCase();
    
    // Exact match (case insensitive)
    if (keyLower === fileNameLower) return true;
    
    // Check if the key is a prefix of the filename (e.g., "Air_Travel" matches "Air_Travel2")
    if (fileNameLower.startsWith(keyLower + '_') || fileNameLower === keyLower) return true;
    
    // Check if the filename is a prefix of the key (e.g., "Air_Travel2" matches "Air_Travel2_Extended")
    if (keyLower.startsWith(fileNameLower + '_') || keyLower === fileNameLower) return true;
    
    return false;
  });
  
  if (matchingKey) {
    return excelJsonData.value[matchingKey];
  }
  
  return null;
});

// Computed property for the main heading text
const mainHeadingText = computed(() => {
  if (files.value && files.value.uploadedFileName) {
    // Remove file extension from the filename (handles multiple dots)
    const fileNameWithoutExtension = files.value.uploadedFileName.replace(/\.(pdf|docx)$/i, '');
    return `Policy Assist for ${fileNameWithoutExtension}`;
  }
  return 'Policy Assist';
});

// Debug: Log activeFile changes
watch(activeFile, (newVal) => {
  console.log('Active file changed:', newVal);
  if (newVal && newVal.type === 'gap') {
    console.log('Active file name:', newVal.file.name);
    const fileNameWithoutExt = newVal.file.name.replace(/\.(xlsx|xls)$/i, '');
    console.log('File name without extension:', fileNameWithoutExt);
    console.log('Available JSON keys:', Object.keys(excelJsonData.value));
    console.log('JSON data for active file:', excelJsonData.value[newVal.file.name]);
    
    // Try to find a matching JSON file
    const fileName = newVal.file.name;
    const jsonKeys = Object.keys(excelJsonData.value);
    
    // Check exact match first
    if (excelJsonData.value[fileNameWithoutExt]) {
      console.log('Found exact match for:', fileNameWithoutExt);
      console.log('Exact match JSON data:', excelJsonData.value[fileNameWithoutExt]);
    } else {
      // Try improved matching logic
      const matchingKey = jsonKeys.find(key => {
        const keyLower = key.toLowerCase();
        const fileNameLower = fileNameWithoutExt.toLowerCase();
        
        if (keyLower === fileNameLower) return true;
        if (fileNameLower.startsWith(keyLower + '_') || fileNameLower === keyLower) return true;
        if (keyLower.startsWith(fileNameLower + '_') || keyLower === fileNameLower) return true;
        return false;
      });
      
      if (matchingKey) {
        console.log('Found matching JSON key:', matchingKey);
        console.log('Matching JSON data:', excelJsonData.value[matchingKey]);
      } else {
        console.log('No matching JSON key found for file:', fileName);
      }
    }
  }
}, { immediate: true });

// Debug: Log excelJsonData changes
watch(excelJsonData, (newVal) => {
  console.log('excelJsonData updated:', newVal);
}, { deep: true });

// Debug: Log activeFileJsonData changes
watch(activeFileJsonData, (newVal) => {
  console.log('activeFileJsonData computed value:', newVal);
}, { immediate: true });

// Only set files if initialUploadedFile is present and backend data is passed
onBeforeMount(async () => {
  if (window.history.state && window.history.state.back !== undefined && window.history.state.backendResult) {
    files.value = window.history.state.backendResult;
    
    // Store the uploaded file name for display in heading
    if (window.history.state.uploadedFile) {
      files.value.uploadedFileName = window.history.state.uploadedFile.name;
    }
    
    // Use the JSON data from the ZIP response
    if (files.value.excelJsonData) {
      excelJsonData.value = files.value.excelJsonData;
      console.log('Loaded JSON data from ZIP response:', excelJsonData.value);
    }
    
    // Set default active category and file
    if (Array.isArray(files.value.gapAnalyses) && files.value.gapAnalyses.length > 0) {
      activeCategory.value = 'gap';
      activeFile.value = { type: 'gap', file: files.value.gapAnalyses[0] };
    } else if (Array.isArray(files.value.summaryFiles) && files.value.summaryFiles.length > 0) {
      activeCategory.value = 'summary';
      activeFile.value = null; // Summary shows all files directly
    }
  }
  
  // Initialize sub-tab width from CSS variable
  nextTick(() => {
    const element = document.querySelector('.vertical-sub-tabs');
    if (element) {
      const defaultWidth = parseInt(getComputedStyle(element).getPropertyValue('--sub-tab-default-width')) || 280;
      subTabWidth.value = defaultWidth;
    } else {
      subTabWidth.value = 280; // Fallback
    }
  });
});

const router = useRouter();

// If user navigates directly to /main, push a history entry for landing page so back button works
onMounted(() => {
  if (window.history.state && window.history.state.back === undefined) {
    router.replace({ path: '/', replace: true });
    router.push({ name: 'Main', state: { uploadedFile: props.initialUploadedFile } });
  }
});

// Main tab selection
function selectMainTab(category) {
  activeCategory.value = category;
  
  if (category === 'gap' && files.value.gapAnalyses.length > 0) {
    // Auto-select first file in gap analysis
    selectFile(files.value.gapAnalyses[0], 'gap');
  } else if (category === 'summary') {
    // Clear active file for summary tab
    activeFile.value = null;
  }
}

// File selection from vertical sub-tabs
function selectFile(file, category) {
  activeFile.value = { type: category, file };
}

// Check if file is active
function isFileActive(file, category) {
  return activeFile.value && 
         activeFile.value.type === category && 
         activeFile.value.file.name === file.name;
}

// Get display name for files
function getDisplayName(filename) {
  // Remove the prefix and extension for display
  let displayName = filename;

  if (filename.startsWith('Gap_analyses_')) {
    displayName = filename.replace('Gap_analyses_', '');
  }

  // Remove file extension
  displayName = displayName.replace(/\.(xlsx|xls|pdf|docx)$/i, '');

  // Replace underscores with spaces and capitalize
  displayName = displayName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return displayName.trim() || filename;
}

// Resize functionality for vertical sub-tabs
function startResize(event) {
  event.preventDefault();
  
  const startX = event.clientX;
  const startWidth = subTabWidth.value;
  
  function onMouseMove(e) {
    const newWidth = startWidth + (e.clientX - startX);
    
    // Get CSS variable constraints
    const element = event.target.closest('.vertical-sub-tabs');
    const minWidth = parseInt(getComputedStyle(element).getPropertyValue('--sub-tab-min-width')) || 200;
    const maxWidth = parseInt(getComputedStyle(element).getPropertyValue('--sub-tab-max-width')) || 400;
    
    subTabWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth));
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function setActiveFile(fileInfo) {
  activeFile.value = fileInfo;
}

// Function to update CSS variables for sub-tab width constraints
function updateSubTabConstraints(minWidth = 200, maxWidth = 400, defaultWidth = 280) {
  const element = document.querySelector('.vertical-sub-tabs');
  if (element) {
    element.style.setProperty('--sub-tab-min-width', minWidth + 'px');
    element.style.setProperty('--sub-tab-max-width', maxWidth + 'px');
    element.style.setProperty('--sub-tab-default-width', defaultWidth + 'px');
    
    // Update current width if it's outside new constraints
    if (subTabWidth.value < minWidth) {
      subTabWidth.value = minWidth;
    } else if (subTabWidth.value > maxWidth) {
      subTabWidth.value = maxWidth;
    }
    
    // If current width is null or undefined, set to default
    if (subTabWidth.value === null || subTabWidth.value === undefined) {
      subTabWidth.value = defaultWidth;
    }
  }
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
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #E8F0F9;
}

.main-tabs-container {
  flex-shrink: 0;
  background: #E8F0F9;
  border-bottom: 1px solid #ccc;
}

.main-tabs {
  display: flex;
  background: #E8F0F9;
}

.main-tab {
  flex: 1;
  padding: 12px 16px;
  background: white;
  border: none;
  border-bottom: 3px solid transparent;
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.main-tab:hover:not(:disabled) {
  background: #f5f5f5;
  color: #1976d2;
}

.main-tab.active {
  color: #0c0e4e;
  border-bottom-color: #020651;
  background: white;
  font-weight: 600;
}

.content-area {
  flex: 1;
  display: flex;
  min-height: 0;
  background: #E8F0F9;
}

.vertical-sub-tabs {
  --sub-tab-min-width: 20px;
  --sub-tab-default-width: 200px;
  --sub-tab-max-width: 400px;
  --sub-tab-width: var(--sub-tab-default-width);
  
  flex-shrink: 0;
  background: white;
  border-right: 1px solid #ccc;
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--sub-tab-width);
  min-width: var(--sub-tab-min-width);
  max-width: var(--sub-tab-max-width);
}

.resize-handle {
  position: absolute;
  right: -3px;
  top: 0;
  bottom: 0;
  width: 6px;
  background: transparent;
  cursor: col-resize;
  z-index: 10;
}

.resize-handle:hover {
  background: rgba(25, 118, 210, 0.1);
}

.sub-tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  overflow-y: auto;
}

.vertical-sub-tab {
  padding: 12px 16px;
  background: white;
  border: none;
  border-left: 3px solid transparent;
  color: #666;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vertical-sub-tab:hover:not(:disabled) {
  background: #f5f5f5;
  color: #1976d2;
}

.vertical-sub-tab.active {
  color: #0c0e4e;
  border-left-color: #020651;
  background: #f8f9fa;
  font-weight: 600;
}

.preview-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0; /* Allow shrinking */
  background: white;
  overflow: hidden; /* Let children handle overflow */
}

.preview-content {
  flex: 1;
  min-height: 0;
  min-width: 0; /* Allow shrinking */
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: #ffffff;
  overflow-x: auto; /* Enable horizontal scroll */
  overflow-y: auto; /* Keep vertical scroll */
}

.summary-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.summary-file {
  margin-bottom: 20px;
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
  overflow-x: auto; /* Enable horizontal scroll for Excel viewer */
  min-width: 0; /* Allow shrinking */
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

.score-badge {
  margin-left: 4px;
  color: #222c5a;
  font-weight: 700;
  font-size: 0.85em;
}

</style> 