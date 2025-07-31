<template>
  <div class="gap-summary-viewer">
    <div v-if="loading" class="loading">Loading Gap Summary...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="summaryData && summaryData.length > 0" class="summary-container">
      <!-- Two-column layout -->
      <div class="summary-layout">
        <!-- Left column: Navigation headings -->
        <div class="navigation-column">
          <div class="navigation-header">
            <h3>Summary Sections</h3>
          </div>
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

        <!-- Right column: Content -->
        <div class="content-column">
          <div class="content-header">
            <h2>Gap Analysis Summary</h2>
          </div>
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
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  summaryJsonData: {
    type: Array,
    default: () => []
  }
});

const summaryData = ref([]);
const loading = ref(false);
const error = ref(null);
const activeSection = ref(0);
const contentBody = ref(null);

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
</script>

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
  width: 250px;
  min-width: 200px;
  max-width: 300px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
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

/* Responsive design */
@media (max-width: 768px) {
  .summary-layout {
    flex-direction: column;
  }
  
  .navigation-column {
    width: 100%;
    max-width: none;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
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