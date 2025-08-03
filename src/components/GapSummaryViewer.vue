<template>
  <div class="gap-summary-viewer">
    <div v-if="loading" class="loading">Loading Gap Summary...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="summaryData && summaryData.length > 0" class="summary-container">
      <!-- Combined view (for main tab) -->
      <div v-if="combinedView && !useTwoColumnLayout" class="combined-view">
        <div class="content-body" ref="contentBody">
          <div
            v-for="(section, index) in summaryData"
            :key="index"
            :id="`section-${index}`"
            class="summary-section"
            :data-file-name="getFileSectionName(section)"
          >
            <h3 class="section-title">{{ section.title }}</h3>
            <div class="section-content" v-html="formatContent(section.content)"></div>
          </div>
        </div>
      </div>
      
      <!-- Two-column layout (for main tab with navigation) -->
      <div v-else-if="combinedView && useTwoColumnLayout" class="summary-layout">
        <!-- Left column: Navigation headings -->
        <div class="navigation-column" ref="navigationColumn">
          <div class="navigation-list">
            <button
              v-for="(section, index) in summaryData"
              :key="index"
              :class="{ 
                'nav-item': true,
                'active': activeSection === index 
              }"
              @click="scrollToSection(index)"
            >
              {{ section.title }}
            </button>
          </div>
        </div>

        <!-- Resizable divider -->
        <div 
          class="resize-handle"
          @mousedown="startResize"
          @touchstart="startResize"
        ></div>

        <!-- Right column: Content -->
        <div class="content-column">
          <div class="content-body" ref="contentBody">
            <div
              v-for="(section, index) in summaryData"
              :key="index"
              :id="`section-${index}`"
              class="summary-section"
              :data-file-name="getFileSectionName(section)"
            >
              <h3 class="section-title">{{ section.title }}</h3>
              <div class="section-content" v-html="formatContent(section.content)"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Two-column layout (for standalone use) -->
      <div v-else class="summary-layout">
        <!-- Left column: Navigation headings -->
        <div class="navigation-column" ref="navigationColumn">
          <!-- <div class="navigation-header">
            <h3>Summary Sections</h3>
          </div> -->
          <div class="navigation-list">
            <button
              v-for="(section, index) in summaryData"
              :key="index"
              :class="{ 
                'nav-item': true,
                'active': activeSection === index 
              }"
              @click="scrollToSection(index)"
            >
              {{ section.title }}
            </button>
          </div>
        </div>

        <!-- Resizable divider -->
        <div 
          class="resize-handle"
          @mousedown="startResize"
          @touchstart="startResize"
        ></div>

        <!-- Right column: Content -->
        <div class="content-column">
          <!-- <div class="content-header">
            <h2>Gap Analysis Summary</h2>
          </div> -->
          <div class="content-body" ref="contentBody">
            <div
              v-for="(section, index) in summaryData"
              :key="index"
              :id="`section-${index}`"
              class="summary-section"
            >
              <h3 class="section-title">{{ section.title }}</h3>
              <div class="section-content" v-html="formatContent(section.content)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-data">No summary data available</div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
  summaryJsonData: {
    type: Array,
    default: () => []
  },
  combinedView: {
    type: Boolean,
    default: false
  },
  useTwoColumnLayout: {
    type: Boolean,
    default: false
  }
});

const summaryData = ref([]);
const loading = ref(false);
const error = ref(null);
const activeSection = ref(0);
const contentBody = ref(null);
const navigationColumn = ref(null);
const isResizing = ref(false);

// Computed property that reads the CSS variable directly for default width
const defaultNavigationWidth = computed(() => {
  const defaultWidth = getComputedStyle(document.documentElement)
    .getPropertyValue('--nav-default-width')
    .trim();
  
  // Convert CSS value to number (remove 'px' and convert to number)
  const widthValue = parseInt(defaultWidth);
  return !isNaN(widthValue) ? widthValue : 250; // fallback to 250 if invalid
});

// Computed property for min width from CSS variable
const minNavigationWidth = computed(() => {
  const minWidth = getComputedStyle(document.documentElement)
    .getPropertyValue('--nav-min-width')
    .trim();
  
  const widthValue = parseInt(minWidth);
  return !isNaN(widthValue) ? widthValue : 150; // fallback to 150 if invalid
});

// Computed property for max width from CSS variable
const maxNavigationWidth = computed(() => {
  const maxWidth = getComputedStyle(document.documentElement)
    .getPropertyValue('--nav-max-width')
    .trim();
  
  const widthValue = parseInt(maxWidth);
  return !isNaN(widthValue) ? widthValue : 400; // fallback to 400 if invalid
});

// Resize functionality
const startResize = (event) => {
  isResizing.value = true;
  event.preventDefault();
  
  const handleMouseMove = (e) => {
    if (!isResizing.value) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (clientX && navigationColumn.value) {
      // Apply constraints from CSS variables
      const constrainedWidth = Math.max(
        minNavigationWidth.value, 
        Math.min(maxNavigationWidth.value, clientX)
      );
      
      // Update the CSS variable directly
      document.documentElement.style.setProperty('--nav-default-width', `${constrainedWidth}px`);
    }
  };
  
  const handleMouseUp = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('touchmove', handleMouseMove);
  document.addEventListener('touchend', handleMouseUp);
};

// Clean up event listeners on component unmount
onUnmounted(() => {
  isResizing.value = false;
});

// Watch for changes in the summary JSON data
watch(() => props.summaryJsonData, async (newData) => {
  console.log('GapSummaryViewer received data:', newData);
  
  if (!newData || !Array.isArray(newData) || newData.length === 0) {
    summaryData.value = [];
    error.value = 'No summary data provided';
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    // Validate the data structure
    const isValidData = newData.every(item => 
      item && typeof item === 'object' && 
      'title' in item && 'content' in item &&
      typeof item.title === 'string' && typeof item.content === 'string'
    );
    
    if (!isValidData) {
      throw new Error('Invalid summary data structure');
    }
    
    summaryData.value = newData;
    activeSection.value = 0;
    console.log('Summary data loaded successfully:', summaryData.value);
  } catch (err) {
    error.value = 'Failed to load summary data';
    console.error('Summary data loading error:', err);
  } finally {
    loading.value = false;
  }
}, { immediate: true });

// Function to scroll to a specific section
const scrollToSection = async (sectionIndex) => {
  if (sectionIndex < 0 || sectionIndex >= summaryData.value.length) {
    return;
  }
  
  activeSection.value = sectionIndex;
  
  await nextTick();
  
  const targetElement = document.getElementById(`section-${sectionIndex}`);
  if (targetElement && contentBody.value) {
    // Smooth scroll to the section
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    
    // Add a small delay to ensure the scroll completes before any additional styling
    setTimeout(() => {
      // Highlight the active section briefly
      targetElement.classList.add('highlighted');
      setTimeout(() => {
        targetElement.classList.remove('highlighted');
      }, 1000);
    }, 300);
  }
};

// Function to format content (handle line breaks, etc.)
const formatContent = (content) => {
  if (!content) return '';
  
  // Convert line breaks to HTML
  return content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
};

// Function to get the file section name from a summary item
const getFileSectionName = (section) => {
  // Enhanced mapping with more comprehensive title-to-file mapping
  const titleToFileMap = {
    'Air Travel Analysis': 'Air_Travel.xlsx',
    'Ground Transportation': 'Ground_Transportation.xlsx',
    'Hotel Accommodations': 'Hotel_Lodging.xlsx',
    'Expense Management': 'Expense_Management.xlsx',
    'Risk Management': 'Risk_Management.xlsx',
    'Sustainability': 'Sustainability.xlsx',
    'Technology and Digital Tools': 'Technology.xlsx',
    'Compliance and Governance': 'Compliance.xlsx',
    'Group & Event Travel': 'Group_&_Event_Travel.xlsx',
    'Meals & Entertainment': 'Meals_&_Entertainment.xlsx',
    'Overview & Guidelines': 'Overview_&_Guidelines.xlsx',
    'Travel Arrangements': 'Travel_Arrangements.xlsx',
    'Wellbeing': 'Wellbeing.xlsx',
    'Group & Events Travel': 'Group_&_Events_Travel.xlsx'
  };

  const sectionTitle = section.title.toLowerCase();

  // Try exact title match first (most specific)
  for (const [title, fileName] of Object.entries(titleToFileMap)) {
    if (sectionTitle.includes(title.toLowerCase())) {
      return fileName;
    }
  }

  // Try more specific word matching to avoid conflicts
  const specificWords = {
    'air travel': 'Air_Travel.xlsx',
    'ground transport': 'Ground_Transportation.xlsx',
    'transportation': 'Ground_Transportation.xlsx',
    'hotel': 'Hotel_Lodging.xlsx',
    'lodging': 'Hotel_Lodging.xlsx',
    'expense': 'Expense_Management.xlsx',
    'expenses': 'Expense_Management.xlsx',
    'risk': 'Risk_Management.xlsx',
    'sustainability': 'Sustainability.xlsx',
    'technology': 'Technology.xlsx',
    'digital': 'Technology.xlsx',
    'compliance': 'Compliance.xlsx',
    'governance': 'Compliance.xlsx',
    'group travel': 'Group_&_Events_Travel.xlsx',
    'events': 'Group_&_Events_Travel.xlsx',
    'meals': 'Meals_&_Entertainment.xlsx',
    'entertainment': 'Meals_&_Entertainment.xlsx',
    'overview': 'Overview_&_Guidelines.xlsx',
    'guidelines': 'Overview_&_Guidelines.xlsx',
    'arrangements': 'Travel_Arrangements.xlsx',
    'wellbeing': 'Wellbeing.xlsx'
  };

  // Try specific word matches first
  for (const [word, fileName] of Object.entries(specificWords)) {
    if (sectionTitle.includes(word)) {
      return fileName;
    }
  }

  // For sections that don't have file matches, return a fallback
  // This ensures the data-file-name attribute is always set
  const nonFileSections = [
    'introduction',
    'methodology', 
    'executive summary',
    'technology and digital tools',
    'compliance and governance',
    'recommendations and next steps'
  ];
  
  if (nonFileSections.some(nonFileSection => sectionTitle.includes(nonFileSection))) {
    return `section_${section.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  return section.title.split(' ')[0] + '.xlsx'; // Fallback
};


</script>

<style>
:root {
  --nav-default-width: 200px;  /* Default width - change this to control default */
  --nav-min-width: 20px;      /* Minimum width - change this to control minimum */
  --nav-max-width: 500px;      /* Maximum width - change this to control maximum */
}
</style>

<style scoped>

.gap-summary-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 0.9rem;
}

.error {
  color: #d32f2f;
}

.summary-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Combined view styles */
.combined-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow: hidden;
}

.combined-view .content-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  background: white;
}

.summary-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow: hidden;
}

/* Left Column - Navigation */
.navigation-column {
  width: var(--nav-default-width);    /* Default width from CSS variable */
  min-width: var(--nav-min-width);    /* Minimum width from CSS variable */
  max-width: var(--nav-max-width);    /* Maximum width from CSS variable */
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative; /* For resize handle positioning */
}

.navigation-header {
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  background: #e9ecef;
}

.navigation-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.navigation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.nav-item {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 0.8rem;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item:hover {
  background: #e9ecef;
  color: #1976d2;
}

.nav-item.active {
  background: #1976d2;
  color: white;
  border-left-color: #1565c0;
  font-weight: 500;
}

/* Right Column - Content */
.content-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.content-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  background: white;
}

.content-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #212529;
}

.content-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  background: white;
}

.summary-section {
  margin-bottom: 32px;
  scroll-margin-top: 20px;
}

.summary-section:last-child {
  margin-bottom: 0;
}

.summary-section.highlighted {
  background: rgba(25, 118, 210, 0.05);
  border-radius: 4px;
  padding: 8px;
  margin: -8px;
  transition: background-color 0.3s ease;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
  border-bottom: 2px solid #e3f2fd;
  padding-bottom: 8px;
}

.section-content {
  font-size: 0.85rem;
  line-height: 1.6;
  color: #495057;
}

.section-content :deep(p) {
  margin: 0 0 12px 0;
}

.section-content :deep(p:last-child) {
  margin-bottom: 0;
}

.section-content :deep(ul),
.section-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.section-content :deep(li) {
  margin: 4px 0;
}

.section-content :deep(strong),
.section-content :deep(b) {
  font-weight: 600;
  color: #212529;
}

.section-content :deep(em),
.section-content :deep(i) {
  font-style: italic;
}

/* Resize Handle */
.resize-handle {
  width: 6px;
  background: #ffffff;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.resize-handle:hover {
  background: #1976d2;
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 20px;
  background: #adb5bd;
  border-radius: 1px;
}

.resize-handle:hover::after {
  background: white;
}

/* Responsive design */
@media (max-width: 768px) {
  .summary-layout {
    flex-direction: column;
  }
  
  .navigation-column {
    width: 100% !important;
    max-width: none;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }
  
  .resize-handle {
    display: none;
  }
  
  .navigation-list {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px;
  }
  
  .nav-item {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 8px 12px;
    margin-right: 8px;
    border-radius: 4px;
    border-left: none;
  }
}
</style> 