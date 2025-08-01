<template>
  <div class="tab-navigation">
    <!-- Main Category Tabs -->
    <div class="main-tabs">
      <template v-for="(category, index) in categories" :key="category.id">
        <button
          :class="{ 
            'main-tab': true,
            'active': activeCategory === category.id 
          }"
          @click="selectCategory(category.id)"
          :disabled="!enabled"
        >
          {{ category.label }}
          <span v-if="category.id === 'gap' && totalScore !== undefined" class="score-badge">({{ totalScore }}%)</span>
        </button>
        <div v-if="index < categories.length - 1" class="main-tab-divider"></div>
      </template>
    </div>

    <!-- Sub-tabs for files within the selected category -->
    <div v-if="activeCategory && getCategoryFiles(activeCategory).length > 0" class="sub-tabs">
      <template v-for="(file, index) in getCategoryFiles(activeCategory)" :key="file.name">
        <button
          :class="{ 
            'sub-tab': true,
            'active': isFileActive(file, activeCategory)
          }"
          @click="selectFile(file, activeCategory)"
          :disabled="!enabled"
        >
          {{ getDisplayName(file.name, activeCategory) }}
          <span v-if="file.score !== undefined" class="score-badge">({{ file.score }}%)</span>
        </button>
        <div v-if="index < getCategoryFiles(activeCategory).length - 1" class="sub-tab-divider"></div>
      </template>
    </div>

    <!-- No files message -->
    <div v-else-if="activeCategory && getCategoryFiles(activeCategory).length === 0" class="no-files-message">
      No files available in {{ getCategoryLabel(activeCategory) }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  enabled: Boolean,
  activeFile: Object,
  gapAnalyses: Array,
  summaryFiles: Array,
  totalScore: Number
});

const emit = defineEmits(['select-category', 'select-file']);

const activeCategory = ref(null);

const categories = computed(() => [
  {
    id: 'gap',
    label: 'Content Extraction and Scoring and Gap Analysis',
    // Show no count here, score will be shown in template
  },
  {
    id: 'summary',
    label: 'Gap Summary',
    // No count for summary tab
  }
]);

function getCategoryFiles(categoryId) {
  switch (categoryId) {
    case 'gap':
      return props.gapAnalyses || [];
    case 'summary':
      return props.summaryFiles || [];
    default:
      return [];
  }
}

function getCategoryLabel(categoryId) {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.label : '';
}

function isFileActive(file, categoryId) {
  return props.activeFile && 
         props.activeFile.type === categoryId && 
         props.activeFile.file.name === file.name;
}

function selectCategory(categoryId) {
  activeCategory.value = categoryId;
  emit('select-category', categoryId);
  
  // Auto-select first file in the category
  const files = getCategoryFiles(categoryId);
  if (files.length > 0) {
    selectFile(files[0], categoryId);
  }
}

// Auto-select first category with files when component mounts
watch(() => props.gapAnalyses, (newVal) => {
  if (newVal && newVal.length > 0 && !activeCategory.value) {
    selectCategory('gap');
  }
}, { immediate: true });

watch(() => props.summaryFiles, (newVal) => {
  if (newVal && newVal.length > 0 && !activeCategory.value) {
    selectCategory('summary');
  }
}, { immediate: true });

function selectFile(file, categoryId) {
  emit('select-file', { type: categoryId, file });
}

function getDisplayName(filename, categoryId = null) {
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
</script>

<style scoped>
.tab-navigation {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.main-tabs {
  display: flex;
  background: #E8F0F9;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
}

.main-tab {
  flex: 1;
  padding: var(--spacing-1) var(--spacing-1);
  background: white; /* Force white background for all main tabs */
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--gray-600);
  /* font-size: var(--font-size-sm); */
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.main-tab:hover:not(:disabled) {
  background: #f5f5f5;
  color: var(--primary-color);
}

.main-tab.active {
  color: rgb(12, 6, 66);
  border-bottom-color: rgb(2, 6, 81);
  background: white;
  font-weight: 600;
}

.main-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-count {
  background: var(--gray-200);
  color: var(--gray-600);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  min-width: 20px;
  text-align: center;
}

.main-tab.active .file-count {
  background: var(--primary-color);
  color: white;
}

.main-tab-divider {
  width: 1px;
  height: 28px;
  background: var(--gray-300);
  margin: 0 2px;
  align-self: center;
  flex-shrink: 0;
}

.sub-tabs {
  display: flex;
  background: white; /* Force white background for sub-tab bar */
  border-bottom: 1px solid var(--gray-200);
  overflow-x: auto;
  padding: 0 var(--spacing-4);
  gap: var(--spacing-1);
}

.sub-tab {
  padding: var(--spacing-1) var(--spacing-1);
  background: white; /* Force white background for all sub-tabs */
  border: none;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  color: rgb(80, 79, 79);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 700;
  position: relative;
}

.sub-tab:hover:not(:disabled) {
  background: #f5f5f5;
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.sub-tab.active {
  color: rgb(15, 3, 100);
  background: white;
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.sub-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: rgb(3, 3, 73);
}

.sub-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sub-tab-divider {
  width: 1px;
  height: 24px;
  background: var(--gray-300);
  margin: 0 var(--spacing-1);
  align-self: center;
  flex-shrink: 0;
}

.no-files-message {
  padding: 24px;
  text-align: center;
  color: #888;
  font-style: italic;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

/* Scrollbar styling for sub-tabs */
.sub-tabs::-webkit-scrollbar {
  height: 4px;
}

.sub-tabs::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sub-tabs::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.sub-tabs::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.score-badge {
  margin-left: 2px;
  color: #222c5a;
  font-weight: 700;
  font-size: 0.85em;
}
</style> 