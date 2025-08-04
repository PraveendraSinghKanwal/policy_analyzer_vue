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
              'active': activeCategory === 'summary' 
            }"
            @click="selectMainTab('summary')"
          >
            Gap Summary
          </button>
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
        </div>
      </div>

      <!-- Content Area with Vertical Sub-tabs and Preview -->
      <div class="content-area">
        <!-- Vertical Sub-tabs (for both summary and gap analysis) -->
        <div v-if="scoreData.gapAnalyses && scoreData.gapAnalyses.length > 0" 
             class="vertical-sub-tabs" 
             :style="{ 
               '--sub-tab-width': subTabWidth + 'px',
               width: 'var(--sub-tab-width)'
             }">
          <div class="resize-handle" @mousedown="startResize"></div>
          <div class="sub-tabs-container">
            <div
              v-for="(file, index) in scoreData.gapAnalyses"
              :key="file.name"
              class="vertical-sub-tab-container"
            >
              <button
              :class="{ 
                'vertical-sub-tab': true,
                  'active': isFileActive(file, activeCategory)
              }"
                @click="selectFile(file, activeCategory)"
            >
                <span class="file-name">{{ getDisplayName(file.name) }}</span>
              <span v-if="file.score !== undefined" class="score-badge">({{ file.score }}%)</span>
            </button>
                             <!-- Navigation button for Gap Summary -->
               <button
                 class="nav-to-summary-btn"
                 @click.stop="scrollToFileSection(file)"
                 title="View this file's summary section"
               >
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M9 18l6-6-6-6"/>
                 </svg>
               </button>
            </div>
          </div>
        </div>

        <!-- Content Preview Area -->
        <div class="preview-area">
          <!-- Gap Summary Content -->
          <div v-if="activeCategory === 'summary'" class="summary-content">
            <!-- Show Gap Summary JSON data if available -->
            <div v-if="reorderedSummaryData && reorderedSummaryData.length > 0" class="gap-summary-viewer">
              <GapSummaryViewer 
                :summaryJsonData="reorderedSummaryData" 
                :combinedView="true"
                :useTwoColumnLayout="false"
              />
            </div>
            <!-- Fallback to showing summary files if no JSON data -->
            <div v-else-if="files.summaryFiles.length > 0" class="summary-files">
              <div v-for="(file, index) in files.summaryFiles" :key="file.name" class="summary-file">
                <div v-if="file.name.toLowerCase().endsWith('.pdf') && file.blob" class="pdf-viewer">
                  <PdfViewer :pdfBlob="file.blob" />
                </div>
                <div v-else-if="file.name.toLowerCase().endsWith('.docx') && file.blob && file.blob.size > 1000" class="docx-viewer">
                  <DocxViewer :docxBlob="file.blob" />
                </div>
                <div v-else class="no-file-viewer">
                  <div style="color: #888;">
                    {{ file.name }} - {{ file.blob ? 'Processing...' : 'No data available' }}
                  </div>
                </div>
              </div>
            </div>
            <!-- Show message if no summary data available -->
            <div v-else class="no-summary-data">
              <div style="color: #888; text-align: center; padding: 40px;">
                No summary data available
              </div>
            </div>
          </div>

          <!-- Content Extraction Preview -->
          <div v-else-if="activeCategory === 'gap' && activeFile" class="preview-content">
            <!-- Excel Preview -->
            <div v-if="activeFile.type === 'gap'" class="excel-viewer">
              <ExcelPreview 
                :jsonData="activeFileJsonData" 
                :currentFileName="activeFile.file.name" 
              />
        </div>
            <div v-else class="no-file-viewer">
              <div style="color: #888;">No file selected for preview.</div>
            </div>
          </div>
          <div v-else-if="activeCategory === 'gap'" class="no-file-viewer">
            <div style="color: #888;">No file selected for preview.</div>
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
import GapSummaryViewer from '../components/GapSummaryViewer.vue';
import DownloadButtons from '../components/DownloadButtons.vue';
import TabNavigation from '../components/TabNavigation.vue';
import logger from '../services/logger.js';
import { getCategorySequenceFromEnv } from '../config/categorySequence.js';

const files = ref(null); // { standardAnalyses: [], gapAnalyses: [], summaryFile: null }
const status = ref('');
const activeFile = ref(null);
const activeCategory = ref('summary'); // Track active main tab
const excelJsonData = ref({}); // Store JSON data for each Excel file
const subTabWidth = ref(null); // Will be set from CSS variable
const isError = computed(() => status.value.toLowerCase().includes('fail'));

// Get category sequence from environment or fallback to default
const categorySequence = computed(() => getCategorySequenceFromEnv());

// Computed property for score data from files
const scoreData = computed(() => {
  if (!files.value) return { gapAnalyses: [], totalScore: undefined };
  
  // If we have score data from the API response, use it
  if (files.value.scoreData) {
    return files.value.scoreData;
  }
  
  // Fallback: create score data from gapAnalyses if available
  if (files.value.gapAnalyses && files.value.gapAnalyses.length > 0) {
    return {
      gapAnalyses: files.value.gapAnalyses.map(file => ({
        name: file.name,
        score: file.score || 0
      })),
      totalScore: files.value.totalScore
    };
  }
  
  return { gapAnalyses: [], totalScore: undefined };
});

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

// Computed property to reorder summary sections based on score.json sequence
const reorderedSummaryData = computed(() => {
  if (!files.value?.gapSummaryJsonData || !scoreData.value.gapAnalyses) {
    return files.value?.gapSummaryJsonData || [];
  }
  
  const summarySections = files.value.gapSummaryJsonData;
  const scoreFiles = scoreData.value.gapAnalyses;
  
  // Create a map of file names to their sections with improved matching
  const sectionMap = new Map();
  const unmatchedSections = [];
  
  // First pass: try to match sections to score files
  summarySections.forEach(section => {
    const matchedFileName = findBestFileMatch(section, scoreFiles);
    if (matchedFileName) {
      sectionMap.set(matchedFileName, section);
    } else {
      unmatchedSections.push(section);
    }
  });
  
  // Reorder sections based on score.json sequence
  const reorderedSections = [];
  scoreFiles.forEach(scoreFile => {
    const section = sectionMap.get(scoreFile.name);
    if (section) {
      reorderedSections.push(section);
    }
  });
  
  // Add any remaining unmatched sections at the end in their original order
  reorderedSections.push(...unmatchedSections);
  
  // Verify we have all original sections
  if (reorderedSections.length !== summarySections.length) {
    // Return original data as fallback
    return summarySections;
  }
  
  return reorderedSections;
});

// Enhanced function to find the best file match for a section
function findBestFileMatch(section, scoreFiles) {
  const sectionTitle = section.title.toLowerCase();
  
  // Helper function to normalize text for comparison
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/[_\s]/g, '') // Remove underscores and whitespace
      .replace(/\.[^.]*$/, ''); // Remove file extension (everything after last dot)
  };
  
  const normalizedSectionTitle = normalizeText(sectionTitle);
  
  // Try direct matching with normalized file names
  for (const scoreFile of scoreFiles) {
    const normalizedFileName = normalizeText(scoreFile.name);
    if (normalizedSectionTitle === normalizedFileName) {
      return scoreFile.name;
    }
  }
  
  // Try matching by file name words to section title (more precise)
  for (const scoreFile of scoreFiles) {
    const fileNameWithoutExt = scoreFile.name.replace(/\.(xlsx|xls)$/i, '');
    const fileNameWords = fileNameWithoutExt.toLowerCase().split(/[_\s&]+/);
    
    // Check if ALL significant words from the file name appear in the section title
    const significantWords = fileNameWords.filter(word => word.length > 2);
    if (significantWords.length > 0) {
      const allWordsMatch = significantWords.every(word => sectionTitle.includes(word));
      if (allWordsMatch) {
        return scoreFile.name;
      }
    }
  }
  
  // Try reverse matching - check if section title words appear in file names
  const sectionWords = sectionTitle.split(/[_\s&]+/).filter(word => word.length > 2);
  
  for (const scoreFile of scoreFiles) {
    const fileNameWithoutExt = scoreFile.name.replace(/\.(xlsx|xls)$/i, '').toLowerCase();
    
    // Check if ALL significant words from section title appear in file name
    if (sectionWords.length > 0) {
      const allWordsMatch = sectionWords.every(word => fileNameWithoutExt.includes(word));
      if (allWordsMatch) {
        return scoreFile.name;
      }
    }
  }
  
  // Try partial matching with score file names (fallback)
  for (const scoreFile of scoreFiles) {
    const fileNameWithoutExt = scoreFile.name.replace(/\.(xlsx|xls)$/i, '');
    const fileNameWords = fileNameWithoutExt.toLowerCase().split(/[_\s&]+/);
    
    // Check if any word from the file name appears in the section title
    const hasWordMatch = fileNameWords.some(word => 
      word.length > 2 && sectionTitle.includes(word)
    );
    
    if (hasWordMatch) {
      return scoreFile.name;
    }
  }
  
  // Special handling for sections that don't have direct file matches
  // These sections should be preserved but not matched to any file
  const nonFileSections = [
    'introduction',
    'methodology', 
    'executive summary',
    'technology and digital tools',
    'compliance and governance',
    'recommendations and next steps'
  ];
  
  if (nonFileSections.some(nonFileSection => sectionTitle.includes(nonFileSection))) {
    return null; // Return null to indicate no match, but section should be preserved
  }
  
  return null;
}

// Computed property for the main heading text
const mainHeadingText = computed(() => {
  if (files.value && files.value.uploadedFileName) {
    // Remove file extension from the filename (handles multiple dots)
    const fileNameWithoutExtension = files.value.uploadedFileName.replace(/\.(pdf|docx)$/i, '');
    return `Policy Assist for ${fileNameWithoutExtension}`;
  }
  return 'Policy Assist';
});



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
    }
    
    // Set default active category and file
    if (Array.isArray(files.value.summaryFiles) && files.value.summaryFiles.length > 0) {
      activeCategory.value = 'summary';
      activeFile.value = null; // Summary shows all files directly
    } else if (scoreData.value.gapAnalyses && scoreData.value.gapAnalyses.length > 0) {
      activeCategory.value = 'gap';
      // Use first file from score.json for initial selection
      nextTick(() => {
        if (scoreData.value.gapAnalyses.length > 0) {
          const firstScoreFile = scoreData.value.gapAnalyses[0];
          const actualFile = findMatchingFile(firstScoreFile);
          activeFile.value = { type: 'gap', file: actualFile };
        }
      });
    }
  }
  
  // Initialize sub-tab width from CSS variable
  nextTick(() => {
    // Read CSS variables from document root or any existing element
    const rootWidth = getComputedStyle(document.documentElement).getPropertyValue('--sub-tab-default-width');
    const bodyWidth = getComputedStyle(document.body).getPropertyValue('--sub-tab-default-width');
    
    const defaultWidth = parseInt(rootWidth) || parseInt(bodyWidth) || 200;
    subTabWidth.value = defaultWidth;
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
  
  if (category === 'gap' && scoreData.value.gapAnalyses.length > 0) {
    // Auto-select first file in gap analysis
    const firstScoreFile = scoreData.value.gapAnalyses[0];
    const actualFile = findMatchingFile(firstScoreFile);
    activeFile.value = { type: 'gap', file: actualFile };
  } else if (category === 'summary') {
    // Clear active file for summary tab
    activeFile.value = null;
  }
}

// Helper function to find the actual file from gapAnalyses that matches a score.json entry
function findMatchingFile(scoreFile) {
  if (!files.value?.gapAnalyses) return scoreFile;
  
  // Try to find exact match first
  const exactMatch = files.value.gapAnalyses.find(gapFile => gapFile.name === scoreFile.name);
  if (exactMatch) return exactMatch;
  
  // Try to find match without extension
  const scoreFileNameWithoutExt = scoreFile.name.replace(/\.(xlsx|xls)$/i, '');
  const matchWithoutExt = files.value.gapAnalyses.find(gapFile => {
    const gapFileNameWithoutExt = gapFile.name.replace(/\.(xlsx|xls)$/i, '');
    return gapFileNameWithoutExt === scoreFileNameWithoutExt;
  });
  if (matchWithoutExt) return matchWithoutExt;
  
  // Return the score file if no match found
  return scoreFile;
}

// File selection from vertical sub-tabs
function selectFile(file, category) {
  // If we're in summary tab and user clicks a file, switch to gap tab
  if (activeCategory.value === 'summary' && category === 'summary') {
    activeCategory.value = 'gap';
    const actualFile = findMatchingFile(file);
    activeFile.value = { type: 'gap', file: actualFile };
  } else {
    const actualFile = findMatchingFile(file);
    activeFile.value = { type: category, file: actualFile };
  }
}

// Check if file is active
function isFileActive(file, category) {
  if (!activeFile.value || activeFile.value.type !== category) return false;
  
  // Compare file names (with and without extensions)
  const activeFileName = activeFile.value.file.name;
  const fileFileName = file.name;
  
  // Exact match
  if (activeFileName === fileFileName) return true;
  
  // Match without extensions
  const activeFileNameWithoutExt = activeFileName.replace(/\.(xlsx|xls)$/i, '');
  const fileFileNameWithoutExt = fileFileName.replace(/\.(xlsx|xls)$/i, '');
  
  return activeFileNameWithoutExt === fileFileNameWithoutExt;
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
function updateSubTabConstraints(minWidth = 20, maxWidth = 400, defaultWidth = 50) {
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

// Function to scroll to a specific file's section in the Gap Summary Viewer
function scrollToFileSection(file) {
  // If we're not in the summary tab, switch to it first
  if (activeCategory.value !== 'summary') {
    activeCategory.value = 'summary';
    // Wait for the DOM to update before trying to scroll
    nextTick(() => {
      scrollToFileSection(file);
    });
    return;
  }
  
  const gapSummaryViewer = document.querySelector('.gap-summary-viewer');
  if (gapSummaryViewer) {
    // Try to find section by data-file-name attribute
    const fileElement = gapSummaryViewer.querySelector(`[data-file-name="${file.name}"]`);
    if (fileElement) {
      fileElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    
    // Try to find by partial match
    const fileNameWithoutExt = file.name.replace(/\.(xlsx|xls)$/i, '');
    const partialMatch = gapSummaryViewer.querySelector(`[data-file-name*="${fileNameWithoutExt}"]`);
    if (partialMatch) {
      partialMatch.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    
    // Try to find by matching the section title to the file name
    const sections = gapSummaryViewer.querySelectorAll('.summary-section');
    for (const section of sections) {
      const sectionTitle = section.querySelector('.section-title')?.textContent?.toLowerCase();
      if (sectionTitle) {
        const fileNameWords = fileNameWithoutExt.toLowerCase().split(/[_\s&]+/);
        const hasWordMatch = fileNameWords.some(word => 
          word.length > 2 && sectionTitle.includes(word)
        );
        if (hasWordMatch) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
    }
  }
}
</script>

<style>
:root {
  --sub-tab-min-width: 20px;
  --sub-tab-default-width: 230px;
  --sub-tab-max-width: 400px;
  --summary-content-height: 70vh; /* Control summary content height */
  --summary-content-max-height: 70vh; /* Control max height */
}
</style>

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

.vertical-sub-tab-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  background: white;
  border: none;
  border-left: 3px solid transparent;
  color: #666;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-weight: 500;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vertical-sub-tab-container:hover {
  background: #f5f5f5;
}

.vertical-sub-tab-container.active {
  border-left-color: #020651;
  background: #f8f9fa;
}

.vertical-sub-tab {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: inherit;
  font-size: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-weight: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vertical-sub-tab:hover {
  color: #1976d2;
}

.vertical-sub-tab.active {
  color: #0c0e4e;
  font-weight: 600;
}

.nav-to-summary-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px; /* Adjust size as needed */
  height: 24px; /* Adjust size as needed */
  color: #666;
  transition: color 0.2s ease;
}

.nav-to-summary-btn:hover {
  color: #1976d2;
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
  padding: 4px 4px 0px 4px;
  background: #ffffff;
  overflow-x: auto; /* Enable horizontal scroll */
  overflow-y: auto; /* Keep vertical scroll */
}

.summary-content {
  height: var(--summary-content-height);
  padding: 10px;
  overflow: hidden;
  max-height: var(--summary-content-max-height);
  display: flex;
  flex-direction: column;
}

.gap-summary-viewer {
  height: 100%;
  min-height: 0;
}

.summary-files {
  display: flex;
  flex-direction: column;
}

.summary-file {
  margin-bottom: 20px;
}

.file-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 0px;
  font-style: normal;
}

.excel-viewer,
.pdf-viewer,
.docx-viewer {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 5px;
  margin-bottom: 0px;
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