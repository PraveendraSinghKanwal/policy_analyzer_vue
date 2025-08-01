<template>
  <div class="download-row-group">
    <div class="download-btn-row">
      <button
        class="btn btn-success download-btn"
        :disabled="!enabled || !hasExcelFiles"
        @click="downloadExcelFiles"
      >
        <svg class="download-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
          <path d="M14 2V8H20" stroke="currentColor" stroke-width="2"/>
          <path d="M12 12L12 18M12 18L9 15M12 18L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Download Scoring and Gap Analysis
      </button>
      
      <!-- Gap Summary section with checkboxes -->
      <div class="gap-summary-section">
        <button
          class="btn btn-success download-btn"
          :disabled="!enabled || !hasSummaryFile || !hasSelectedSummaryFiles"
          @click="downloadSummaryFiles"
        >
          <svg class="download-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
            <path d="M14 2V8H20" stroke="currentColor" stroke-width="2"/>
            <path d="M12 12L12 18M12 18L9 15M12 18L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Download Gap Summary
        </button>
        
        <!-- Checkboxes container -->
        <div class="summary-checkboxes">
          <label class="checkbox-container" v-if="hasDocxFile">
            <input 
              type="checkbox" 
              v-model="selectedSummaryFiles.docx"
              @change="updateSelectedFiles"
            />
            <img src="/docx_download.jpeg" alt="DOCX" class="checkbox-icon" />
            <span class="checkbox-label">DOCX</span>
          </label>
          <label class="checkbox-container" v-if="hasPdfFile">
            <input 
              type="checkbox" 
              v-model="selectedSummaryFiles.pdf"
              @change="updateSelectedFiles"
            />
            <img src="/pdf_download.jpg" alt="PDF" class="checkbox-icon" />
            <span class="checkbox-label">PDF</span>
          </label>
        </div>
      </div>
      
      <div v-if="downloadStatus" class="download-status" :class="downloadStatus.type">
        {{ downloadStatus.message }}
      </div>
    </div>
    <!-- The download-status-row is now empty, so it can be removed or left empty -->
    <div class="download-status-row">
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

// Check if specific file types are available
const hasDocxFile = computed(() => 
  props.summaryFiles.some(file => file.name.toLowerCase().endsWith('.docx'))
);
const hasPdfFile = computed(() => 
  props.summaryFiles.some(file => file.name.toLowerCase().endsWith('.pdf'))
);

// Selected files state
const selectedSummaryFiles = ref({
  docx: false,
  pdf: false
});

// Check if any summary files are selected
const hasSelectedSummaryFiles = computed(() => 
  selectedSummaryFiles.value.docx || selectedSummaryFiles.value.pdf
);

// Update selected files when checkboxes change
function updateSelectedFiles() {
  console.log('Selected summary files:', selectedSummaryFiles.value);
}

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
    downloadStatus.value = { type: 'success', message: 'Analysis files downloaded!' };
    setTimeout(() => { downloadStatus.value = null; }, 3000);
    emit('download');
  } catch (error) {
    console.error('Download error:', error);
    downloadStatus.value = { type: 'error', message: 'Error downloading Excel files.' };
    setTimeout(() => { downloadStatus.value = null; }, 5000);
  }
}

async function downloadSummaryFiles() {
  console.log('Download Summary Files button clicked');
  console.log('hasSummaryFile:', hasSummaryFile.value);
  console.log('hasSelectedSummaryFiles:', hasSelectedSummaryFiles.value);
  
  if (!hasSummaryFile.value || !hasSelectedSummaryFiles.value) {
    console.log('No summary files selected');
    return;
  }
  
  try {
    downloadStatus.value = { type: 'info', message: 'Preparing download...' };
    
    const selectedFiles = [];
    
    // Get selected files
    if (selectedSummaryFiles.value.docx) {
      const docxFile = props.summaryFiles.find(file => file.name.toLowerCase().endsWith('.docx'));
      if (docxFile) selectedFiles.push(docxFile);
    }
    
    if (selectedSummaryFiles.value.pdf) {
      const pdfFile = props.summaryFiles.find(file => file.name.toLowerCase().endsWith('.pdf'));
      if (pdfFile) selectedFiles.push(pdfFile);
    }
    
    console.log('Selected files to download:', selectedFiles);
    
    if (selectedFiles.length === 1) {
      // Download single file
      const file = selectedFiles[0];
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      downloadStatus.value = { type: 'success', message: `${file.name} downloaded!` };
    } else if (selectedFiles.length > 1) {
      // Download multiple files as ZIP
      const zip = new JSZip();
      for (const file of selectedFiles) {
        zip.file(file.name, file.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gap_summary_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      downloadStatus.value = { type: 'success', message: 'Gap Summary files downloaded!' };
    }
    
    setTimeout(() => { downloadStatus.value = null; }, 3000);
    emit('download');
  } catch (error) {
    console.error('Download error:', error);
    downloadStatus.value = { type: 'error', message: 'Error downloading summary files.' };
    setTimeout(() => { downloadStatus.value = null; }, 5000);
  }
}
</script>

<style scoped>
.download-btn-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end; /* Aligns items to the bottom */
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
  justify-content: flex-end;
  align-items: flex-start;
}
.download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s;
  height: 36px;
  white-space: nowrap;
  flex-shrink: 0;
}
.download-btn:not(:disabled):hover {
  background: #7caaf5;
  box-shadow: none;
  transform: translateY(-1px);
}
.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.download-status {
  padding: 0px 4px 0px 4px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
  text-align: start;
  margin-left: 0px; /* Add some space between the button and the message */
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

.download-icon {
  flex-shrink: 0;
  stroke: currentColor;
}

/* Gap Summary section styling */
.gap-summary-section {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

/* Checkboxes container */
.summary-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0px;
  height: 36px; /* Match button height */
  justify-content: space-between;
}

/* Checkbox container */
.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  width: 45px;
  height: 16px;
  gap: 4px;
}

/* Hide default checkbox */
.checkbox-container input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

/* Custom checkbox styling */
.checkbox-container input[type="checkbox"]:checked + .checkbox-icon {
  border: 1px solid rgb(19, 0, 101);
  background-color: transparent;
  transform: scale(1.1);
}

.checkbox-container input[type="checkbox"]:not(:checked) + .checkbox-icon {
  border: 2px solid #e5e4e4;
  background-color: transparent;
}

/* Checkbox icon styling */
.checkbox-icon {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  transition: all 0.2s ease;
  object-fit: cover;
  cursor: pointer;
}

/* Checkbox label styling */
.checkbox-label {
  font-size: 10px;
  font-weight: 600;
  color: #6f6f6f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
}

.checkbox-container:hover .checkbox-icon {
  transform: scale(1.05);
  border-color: #350174;
}

.checkbox-container:hover .checkbox-label {
  color: #1e0070;
}

.checkbox-container input[type="checkbox"]:checked + .checkbox-icon {
  box-shadow: 0 0 5px rgba(40, 167, 69, 0.3);
}

.checkbox-container input[type="checkbox"]:checked ~ .checkbox-label {
  color: #090258;
  font-weight: 700;
}
</style> 